// Script to run property and rental scraping jobs
const ScraperWorkflowManager = require('./scraperWorkflow');
const dotenv = require('dotenv');
const { initPostgresSchema } = require('../config/dbInit'); // Import DB init function
const { pgPool } = require('../config/db'); // Import PG Pool

// Load environment variables
dotenv.config();

// Initialize scraper workflow manager
const scraperManager = new ScraperWorkflowManager();

// Generic listing prompt (defined once, used below)
// Enhanced to be more specific about targeting listings and requiring URL
const GENERIC_LISTING_PROMPT = `
  Analyze this real estate search results page which lists multiple properties for sale.
  Identify the main container holding the list or grid of individual property listings.
  Focus ONLY on the elements that clearly represent a single property for sale. Ignore headers, footers, ads, pagination controls, map elements, or other non-listing content.
  For EACH distinct property listing element identified:
  - Extract the direct URL link to the property's own detail page. This is CRITICAL. If a listing element does not contain a valid URL to its detail page, SKIP that element entirely. (key: 'url').
  - Extract the listed sale price (key: 'price'). Use null if not found.
  - Extract the full street address (key: 'address'). Use null if not found.
  - Number of bedrooms (key: 'bedrooms'). Use null if not found.
  - Number of bathrooms (key: 'bathrooms'). Use null if not found.
  - Square footage (key: 'squareFootage'). Use null if not found.
  Return ONLY the valid property listings found as a single JSON list of objects. Each object MUST have a non-null 'url' key.
  If no valid property listings with URLs are found, return an empty list [].
  Example of expected output format: [{"url": "https://...", "price": "$500,000", "address": "123 Main St", "bedrooms": 3, "bathrooms": 2, "squareFootage": 1500}, {"url": "https://...", ...}]
`;

// Define sources and URLs for scraping
const propertySources = [
  {
    name: 'bookstoscrape-test', // New test case using books.toscrape.com
    url: 'http://books.toscrape.com/', // Use http as https might not be configured
    filters: {}, // No filters needed
    // Define CSS schema for direct extraction
    listingSchema: {
      baseSelector: "article.product_pod", // Selector for each item
      fields: [
        { name: "title", selector: "h3 a", type: "attribute", attribute: "title" }, // Get title from 'title' attribute
        { name: "price", selector: ".price_color", type: "text" },
        { name: "stock", selector: ".availability", type: "text" },
        // Corrected: Ensure 'url' field correctly targets the href attribute
        { name: "url", selector: "h3 a", type: "attribute", attribute: "href" }
      ]
    },
    // Keep the prompt as a fallback or for potential future use, but schema takes precedence
    listingPrompt: `
      Analyze the HTML and extract books data.
      Target: Find all article.product_pod elements
      Required format:
      {
        "items": [
          {
            "title": "{{text from h3 a}}",
            "price": "{{text from .price_color}}",
            "stock": "{{text from .availability}}",
            "url": "{{href from h3 a}}"
          }
        ]
      }
      Notes:
      - Return ONLY the JSON object
      - Include ALL books found
      - Must match format exactly
      - Empty result should be {"items": []}
    `
  },
  {
    name: 'zillow',
    // Simplify Zillow URL generation - just use base city/state path
    getUrl: (filters) => {
      const cityState = `${filters.city}-${filters.state}`.toLowerCase().replace(/ /g, '-');
      // Return only the base URL. Filters will need to be applied manually on Zillow or handled differently.
      // This avoids relying on the complex and brittle searchQueryState parameter.
      console.warn(`[Zillow URL] Using simplified URL: https://www.zillow.com/${cityState}/. Filters are not applied via URL.`);
      return `https://www.zillow.com/${cityState}/`;
    },
    filters: {
      city: 'San Francisco',
      state: 'CA',
      minPrice: 500000,
      maxPrice: 1500000,
      bedrooms: 2,
      bathrooms: 2
    },
    // Define CSS schema for Zillow listings
    listingSchema: {
      baseSelector: "article[data-test='property-card']", // Target the article element
      fields: [
        // Use more specific selectors based on the prompt examples
        { name: "address", selector: "address[data-test='property-card-addr']", type: "text" },
        { name: "price", selector: "span[data-test='property-card-price']", type: "text" },
        // Replace :contains() with standard selectors targeting list items within the card details container
        // Assuming a structure like <ul class="StyledPropertyCardHomeDetailsList-c11n-8-100-1__sc-1xvdaej-0 ehrLVA"><li><span>3</span> bds</li>...
        // We'll grab the text of all list items and let the backend parse beds/baths/sqft
        { name: "details", selector: "[data-test='property-card-details'] li", type: "text[]" }, // Get text of all list items
        { name: "url", selector: "a[data-test='property-card-link']", type: "attribute", attribute: "href" }
      ]
    },
    // Keep the prompt as a fallback or for potential future use
    // Keep the prompt as a fallback or for potential future use
    listingPrompt: `
      Analyze the HTML and extract property listings.
      Target: Find all article elements that represent a property listing (e.g., .list-card, .property-card).
      Required format:
      {
        "items": [
          {
            "address": "{{text from address element, e.g., .list-card-addr}}",
            "price": "{{text from price element, e.g., .list-card-price}}",
            "beds": "{{text containing beds info, e.g., .list-card-details li containing 'bds'}}",
            "baths": "{{text containing baths info, e.g., .list-card-details li containing 'ba'}}",
            "sqft": "{{text containing sqft info, e.g., .list-card-details li containing 'sqft'}}",
            "url": "{{href from main listing link, e.g., a.list-card-link}}"
          }
        ]
      }
      Notes:
      - Return ONLY the JSON object.
      - Extract numeric values for beds, baths, sqft if possible, otherwise text.
      - Clean price (remove $, commas, /mo).
      - Ensure URL is absolute or prepend with base URL if relative.
      - Empty result should be {"items": []}
    `
  },
  {
    name: 'realtor',
    // Construct Realtor.com URL dynamically with correct parameter order and casing
    getUrl: (filters) => {
      // Format city and state: "Chicago_IL" (Title Case City, Uppercase State)
      const cityFormatted = filters.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('-'); // Handle multi-word cities if needed
      const stateFormatted = filters.state.toUpperCase();
      const cityState = `${cityFormatted}_${stateFormatted}`;

      let url = `https://www.realtor.com/realestateandhomes-search/${cityState}`;
      const params = [];

      // Add parameters in the specific order: beds, baths, price
      if (filters.bedrooms) {
        params.push(`beds-${filters.bedrooms}`);
      }
      if (filters.bathrooms) {
        params.push(`baths-${filters.bathrooms}`);
      }
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        // Use 'undefined' check for flexibility if only one bound is set
        const min = filters.minPrice !== undefined ? filters.minPrice : '';
        const max = filters.maxPrice !== undefined ? filters.maxPrice : '';
         // Realtor might use 'X-' for min only, '-Y' for max only, or 'X-Y' for both.
         // Assuming 'X-Y' format, using 0 if min is undefined. Adjust if needed.
        params.push(`price-${min || 0}-${max}`); 
      }

      if (params.length > 0) {
        url += '/' + params.join('/');
      }
      return url;
    },
    filters: {
      city: 'Chicago',
      state: 'IL',
      minPrice: 300000,
      maxPrice: 800000,
      bedrooms: 3,
      bathrooms: 2
    },
    // Removed listingSchema for Realtor - will use GENERIC_LISTING_PROMPT instead
    listingPrompt: GENERIC_LISTING_PROMPT // Use the refined generic prompt
    /* Old Realtor Prompt (kept for reference if needed):
      Analyze the HTML and extract property listings.
      Target: Find all elements representing a property card (e.g., [data-testid=property-card], .card-component).
      Required format:
      {
        "items": [
          {
            "address": "{{text from address element, e.g., [data-testid=card-address]}}",
            "price": "{{text from price element, e.g., .card-price}}",
            "beds": "{{text from beds element, e.g., li[data-testid=property-meta-beds] .meta-value}}",
            "baths": "{{text from baths element, e.g., li[data-testid=property-meta-baths] .meta-value}}",
            "sqft": "{{text from sqft element, e.g., li[data-testid=property-meta-sqft] .meta-value}}",
            "url": "{{href from main listing link, e.g., a[data-testid=card-link]}}"
          }
        ]
      }
      Notes:
      - Return ONLY the JSON object.
      - Extract numeric values for beds, baths, sqft if possible, otherwise text.
      - Clean price (remove $, commas).
      - Ensure URL is absolute or prepend with base URL if relative.
      - Empty result should be {"items": []}
    */
  },
  {
    name: 'ohiobrokerdirect',
    // Construct URL with query parameters. NOTE: Uses hardcoded city ID for Cleveland (9179).
    getUrl: (filters) => {
      const baseUrl = 'https://search.ohiobrokerdirect.com/idx/results/listings';
      const params = new URLSearchParams();
      params.set('pt', 'all'); // Property type
      params.set('ccz', 'city'); // Search by city

      // Hardcoded city ID for Cleveland. This needs a lookup mechanism for other cities.
      if (filters.city === 'Cleveland' && filters.state === 'OH') {
        params.set('city[]', '9179');
      } else {
        console.warn(`OhioBrokerDirect scraper currently only supports Cleveland, OH due to city ID requirement. Skipping ${filters.city}, ${filters.state}.`);
        return null; // Return null if not Cleveland to prevent incorrect scraping attempts
      }

      if (filters.minPrice !== undefined) params.set('lp', filters.minPrice);
      if (filters.maxPrice !== undefined) params.set('hp', filters.maxPrice);
      if (filters.bedrooms !== undefined) params.set('bd', filters.bedrooms);
      // Baths filter not obvious in the example URL, omitting for now.

      return `${baseUrl}?${params.toString()}`;
    },
    filters: {
      city: 'Cleveland',
      state: 'OH',
      minPrice: 100000,
      maxPrice: 500000,
      bedrooms: 2 // Assuming 'bedrooms' means minimum bedrooms
    },
    // Add a generic fallback prompt
    listingPrompt: GENERIC_LISTING_PROMPT
  },
  {
    name: 'lotside',
    // Construct URL with query parameters. NOTE: Uses hardcoded city/state IDs for Cleveland (15107/39).
    getUrl: (filters) => {
      const baseUrl = 'https://app.lotside.com/browse';
      const params = new URLSearchParams();

      // Hardcoded city/state IDs for Cleveland. Needs lookup mechanism for others.
      if (filters.city === 'Cleveland' && filters.state === 'OH') {
        params.set('city', '15107');
        params.set('state', '39');
      } else {
        console.warn(`Lotside scraper currently only supports Cleveland, OH due to city/state ID requirement. Skipping ${filters.city}, ${filters.state}.`);
        return null; // Return null if not Cleveland
      }

      // Add other relevant filters from the example URL
      if (filters.minPrice !== undefined) params.set('min_listing_price', filters.minPrice);
      if (filters.maxPrice !== undefined) params.set('max_listing_price', filters.maxPrice);
      if (filters.bedrooms !== undefined) params.set('min_bedrooms', filters.bedrooms);
      // Omitting mapBounds, listing_event, listing_type etc. for simplicity

      return `${baseUrl}?${params.toString()}`;
    },
    filters: {
      city: 'Cleveland',
      state: 'OH',
      minPrice: 100000,
      maxPrice: 500000,
      bedrooms: 2 // Assuming 'bedrooms' means minimum bedrooms
    },
    // Add a generic fallback prompt
    listingPrompt: GENERIC_LISTING_PROMPT
  }
];

// Removed GENERIC_LISTING_PROMPT definition from here as it's moved above

const rentalSources = [
  {
    name: 'apartments',
    // Construct Apartments.com URL dynamically based on observed pattern
    getUrl: (filters) => {
      const cityState = `${filters.city}-${filters.state}`.toLowerCase().replace(/ /g, '-');
      // Assuming '/houses/' is a common path segment, adjust if needed for different types
      let url = `https://www.apartments.com/houses/${cityState}/`; 
      const params = [];
      if (filters.bedrooms !== undefined) {
        params.push(`min-${filters.bedrooms}-bedrooms`); // Uses 'min-' prefix
      }
      if (filters.bathrooms !== undefined) {
        params.push(`${filters.bathrooms}-bathrooms`); // Exact bathrooms
      }
      
      if (params.length > 0) {
        url += params.join('-') + '/'; // Parameters seem joined by '-' in the path
      }
      return url;
    },
    filters: {
      city: 'San Francisco',
      state: 'CA',
      bedrooms: 2,
      bathrooms: 1
    }
  },
  {
    name: 'zillow-rentals',
    // Construct Zillow rentals URL dynamically using searchQueryState parameter
    getUrl: (filters) => {
      const cityState = `${filters.city}-${filters.state}`.toLowerCase().replace(/ /g, '-');
      // Use a general rental path, filters are in searchQueryState
      const baseUrl = `https://www.zillow.com/${cityState}/rent/`; 

      // Construct the filterState object for rentals
      const filterState = {
        sort: { value: 'priorityscore' }, // Default sort for rentals
        fr: { value: true }, // Filter for rentals
        fsba: { value: false }, // Exclude For Sale By Agent
        fsbo: { value: false }, // Exclude For Sale By Owner
        nc: { value: false },   // Exclude New Construction
        cmsn: { value: false }, // Exclude Coming Soon
        auc: { value: false },  // Exclude Auctions
        fore: { value: false }, // Exclude Foreclosures
        beds: {},
        baths: {},
        // Add other potential rental filters if needed (e.g., price, sqft)
      };
      
      if (filters.bedrooms !== undefined) filterState.beds.min = filters.bedrooms;
      if (filters.bathrooms !== undefined) filterState.baths.min = filters.bathrooms;
      // Add price filters if available in rental filters
      // if (filters.minPrice !== undefined) filterState.price.min = filters.minPrice;
      // if (filters.maxPrice !== undefined) filterState.price.max = filters.maxPrice;


      // Construct the full searchQueryState object
      const searchQueryState = {
        pagination: {},
        isMapVisible: false, // Prefer list view
        filterState: filterState,
        isListVisible: true,
        usersSearchTerm: `${filters.city} ${filters.state}`
      };

      // Encode the JSON object for the URL query parameter
      const encodedSearchQuery = encodeURIComponent(JSON.stringify(searchQueryState));
      
      return `${baseUrl}?searchQueryState=${encodedSearchQuery}`;
    },
    filters: {
      city: 'Chicago',
      state: 'IL',
      bedrooms: 1,
      bathrooms: 1
    },
    // Add a specific prompt for Zillow rentals to improve URL extraction
    listingPrompt: `
      Analyze this Zillow rental search results page. Locate the main container for listings (e.g., #grid-search-results).
      Within this container, find all property card elements (e.g., article[data-test='property-card']).
      For each property card:
      - Extract the direct URL link to the rental's detail page from the primary link element (e.g., a[data-test='property-card-link']). This is the MOST important field. (key: 'url').
      - Extract the monthly rent price (e.g., span[data-test='property-card-price']). (key: 'rent').
      - Extract the full street address (e.g., address[data-test='property-card-addr']). (key: 'address').
      - Extract bedrooms, bathrooms, and square footage if available within the card details. (keys: 'bedrooms', 'bathrooms', 'squareFootage').
      Return ONLY the valid rental listings found as a single JSON list of objects. Each object MUST have a non-null 'url' key.
      If no valid rental listings with URLs are found, return an empty list [].
      Example: [{"url": "https://www.zillow.com/homedetails/...", "rent": "$3,000/mo", "address": "789 Pine St", "bedrooms": 1, "bathrooms": 1, "squareFootage": 700}, ...]
    `
  }
];

// Run property scraping jobs
async function runPropertyScrapingJobs() {
  console.log('Starting property scraping jobs...');
  
  for (const source of propertySources) {
    let url;
    try {
      // Check if getUrl is a function, otherwise use the static url
      if (typeof source.getUrl === 'function') {
        url = source.getUrl(source.filters); // Get dynamic URL
      } else {
        url = source.url; // Use static URL
      }
      
      if (!url) {
        console.error(`Could not determine URL for source: ${source.name}`);
        continue; // Skip this source if URL is missing
      }

      console.log(`Running property scraping job for ${source.name} with URL: ${url}`);
      // Determine whether to pass schema or prompt
      const promptOrSchema = source.listingSchema ? source.listingSchema : source.listingPrompt;
      if (!promptOrSchema) {
        console.error(`Missing listingSchema or listingPrompt for source: ${source.name}`);
        continue; // Skip if neither is defined
      }
      // Pass the determined schema or prompt (Corrected variable name)
      const result = await scraperManager.runPropertyScrapingJob(source.name, url, source.filters, promptOrSchema);
      console.log(`Property scraping job for ${source.name} completed:`, result);
    } catch (error) {
      console.error(`Error running property scraping job for ${source.name}:`, error.message, error.stack); // Added stack trace
    }
  }
  
  console.log('All property scraping jobs completed');
}

// Run rental scraping jobs
async function runRentalScrapingJobs() {
  console.log('Starting rental scraping jobs...');
  
  for (const source of rentalSources) {
    try {
      const url = source.getUrl(source.filters); // Get dynamic URL
      console.log(`Running rental scraping job for ${source.name} with URL: ${url}`);
      // Pass the listingPrompt if it exists in the source config
      const result = await scraperManager.runRentalScrapingJob(source.name, url, source.filters, source.listingPrompt); 
      console.log(`Rental scraping job for ${source.name} completed:`, result);
    } catch (error) {
      console.error(`Error running rental scraping job for ${source.name}:`, error.message, error.stack); // Added stack trace
    }
  }
  
  console.log('All rental scraping jobs completed');
}

// Main function to run all scraping jobs
async function main() {
  let pgClient; // Define client here to use in finally block
  try {
    // Initialize PostgreSQL Schema FIRST
    console.log('Attempting to initialize PostgreSQL schema...');
    pgClient = await pgPool.connect();
    await initPostgresSchema(pgClient);
    console.log('PostgreSQL schema initialization check complete.');
    pgClient.release(); // Release client after init
    pgClient = null; // Set to null after release

    // Now run the scraping jobs
    await runPropertyScrapingJobs();
    await runRentalScrapingJobs();
    console.log('All scraping jobs completed successfully');
  } catch (error) {
    console.error('Error during initialization or running scraping jobs:', error.message, error.stack); // Added stack trace
  } finally {
    // Ensure client is released if an error occurred after connect but before release
    if (pgClient) {
      pgClient.release();
      console.log('Ensured PostgreSQL client was released after error.');
    }
    // Optionally end the pool if this script is meant to be short-lived
    // await pgPool.end(); 
    // console.log('PostgreSQL pool ended.');
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error in main function:', error);
    process.exit(1);
  });
}

module.exports = {
  runPropertyScrapingJobs,
  runRentalScrapingJobs
};
