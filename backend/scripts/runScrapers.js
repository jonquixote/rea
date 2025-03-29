// Script to run property and rental scraping jobs
const ScraperWorkflowManager = require('./scraperWorkflow');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize scraper workflow manager
const scraperManager = new ScraperWorkflowManager();

// Define sources and URLs for scraping
const propertySources = [
  {
    name: 'bookstoscrape-test', // New test case using books.toscrape.com
    url: 'http://books.toscrape.com/', // Use http as https might not be configured
    filters: {}, // No filters needed
    // Simplified prompt with explicit structure
    listingPrompt: `
      Analyze the HTML and extract books data.
      Target: Find all article.product_pod elements
      Required format:
      {
        "items": [
          {
            "title": "{{text from h3 a}}",
            "price": "{{text from .price_color}}",
            "stock": "{{text from .availability}}"
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
    // Construct Zillow URL dynamically using searchQueryState parameter
    getUrl: (filters) => {
      const cityState = `${filters.city}-${filters.state}`.toLowerCase().replace(/ /g, '-');
      const baseUrl = `https://www.zillow.com/${cityState}/`; // Base path seems correct

      // Construct the filterState object based on provided filters
      const filterState = {
        sort: { value: 'globalrelevanceex' }, // Default sort, might need adjustment
        price: {},
        mp: {}, // Monthly payment, might need calculation or omit
        beds: {},
        baths: {},
      };
      if (filters.minPrice !== undefined) filterState.price.min = filters.minPrice;
      if (filters.maxPrice !== undefined) filterState.price.max = filters.maxPrice;
      // Assuming monthly payment calculation is complex and not directly mapped, omitting mp for now
      if (filters.bedrooms !== undefined) filterState.beds.min = filters.bedrooms;
      if (filters.bathrooms !== undefined) filterState.baths.min = filters.bathrooms;

      // Construct the full searchQueryState object
      const searchQueryState = {
        pagination: {},
        isMapVisible: false, // Assuming list view is preferred
        // mapBounds and regionSelection might be dynamic based on location, hard to replicate exactly without more info
        // Using a simplified version for now
        filterState: filterState,
        isListVisible: true,
        usersSearchTerm: `${filters.city} ${filters.state}` // Reflects the search term
      };

      // Encode the JSON object for the URL query parameter
      const encodedSearchQuery = encodeURIComponent(JSON.stringify(searchQueryState));
      
      return `${baseUrl}?searchQueryState=${encodedSearchQuery}`;
    },
    filters: {
      city: 'San Francisco',
      state: 'CA',
      minPrice: 500000,
      maxPrice: 1500000,
      bedrooms: 2,
      bathrooms: 2
    }
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
    }
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
    }
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
    }
  }
];

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
    }
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
      // Pass name, calculated url, filters, and prompt separately
      const result = await scraperManager.runPropertyScrapingJob(source.name, url, source.filters, source.listingPrompt); 
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
      const result = await scraperManager.runRentalScrapingJob(source.name, url, source.filters);
      console.log(`Rental scraping job for ${source.name} completed:`, result);
    } catch (error) {
      console.error(`Error running rental scraping job for ${source.name}:`, error.message, error.stack); // Added stack trace
    }
  }
  
  console.log('All rental scraping jobs completed');
}

// Main function to run all scraping jobs
async function main() {
  try {
    await runPropertyScrapingJobs();
    await runRentalScrapingJobs();
    console.log('All scraping jobs completed successfully');
  } catch (error) {
    console.error('Error running scraping jobs:', error.message);
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
