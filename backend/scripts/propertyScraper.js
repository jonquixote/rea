// Property Scraper Implementation using Crawl4AI via separate service
const axios = require('axios');
const { cleanPropertyData } = require('../utils/scraperUtils'); // Removed unused delay/user-agent utils
const { Property } = require('../models/mongoSchemas');
const { pgPool } = require('../config/db');
// const dotenv = require('dotenv'); // Remove: Docker Compose injects env vars

// dotenv.config({ path: require('path').resolve(__dirname, '../../.env') }); // Remove: Incorrect path and redundant

// Get URL from environment variable set by Docker Compose
const CRAWL4AI_SERVICE_URL = process.env.CRAWL4AI_SERVICE_URL;
const MAX_RETRIES = 3; // Number of retry attempts
const RETRY_DELAY = 2000; // Delay between retries in milliseconds

// Add a check to ensure the variable is set
if (!CRAWL4AI_SERVICE_URL) {
  console.error("Error: CRAWL4AI_SERVICE_URL environment variable is not set. Check docker-compose.yml.");
  process.exit(1); // Exit if the URL is missing
}

// Define site-specific prompts for listing pages
const SITE_SPECIFIC_LISTING_PROMPTS = {
  zillow: `
    Analyze this Zillow search results page. First, locate the main container holding the results, which is a 'div' with the id 'grid-search-results'.
    Within this container, find all property card elements, which are 'article' tags with the attribute 'data-test="property-card"'.
    For each 'article' element found:
    - Extract the direct URL link to the property's detail page, likely from an 'a' tag within the article (key: 'url').
    - Extract the price from the 'span' element with the attribute 'data-test="property-card-price"' (key: 'price').
    - Extract the full street address, likely from an 'address' tag or similar within the article (key: 'address').
    - Extract the number of bedrooms (e.g., "3 bds"), look for elements indicating beds within the article (key: 'bedrooms').
    - Extract the number of bathrooms (e.g., "2 ba"), look for elements indicating baths within the article (key: 'bathrooms').
    - Extract the square footage (e.g., "1,500 sqft"), look for elements indicating sqft within the article (key: 'squareFootage').
    Return ALL extracted properties as a single JSON list of objects. Each object must have keys 'url', 'price', 'address', 'bedrooms', 'bathrooms', 'squareFootage'. Use null if a value isn't found for any key.
    If no property cards ('article' with 'data-test="property-card"') are found, return an empty list [].
  `,
  realtor: `
    Analyze this Realtor.com search results page. Locate the main container for property listings (e.g., div with data-testid="property-list" or similar).
    Within this container, identify each individual property listing card.
    For each listing card:
    - Extract the direct URL link to the property's detail page (key: 'url').
    - Extract the price, often found in an element with class containing "price" or "price-wrapper" (key: 'price').
    - Extract the full street address, typically in an element with class containing "listing-address" or similar (key: 'address').
    - Extract the number of bedrooms (key: 'bedrooms').
    - Extract the number of bathrooms (key: 'bathrooms').
    - Extract the square footage (key: 'squareFootage'). These details are often grouped in an element with class containing "property-meta" or "property-info".
    Return ALL extracted properties as a single JSON list of objects. Each object must have keys 'url', 'price', 'address', 'bedrooms', 'bathrooms', 'squareFootage'. Use null if a value isn't found.
    If no properties are found, return an empty list [].
  `,
  ohiobrokerdirect: `
    Analyze this OhioBrokerDirect search results page. Identify each property listing container, often marked with class="IDX-listingContainer" or similar structure containing listing details.
    For EACH property listing found:
    - Extract the direct URL link to the property's detail page. This is often within an 'a' tag containing the address or a "View Details" link (key: 'url'). Look for links pointing to '/idx/details/listing/...'.
    - Extract the price, usually prefixed with '$' (key: 'price').
    - Extract the full street address (key: 'address').
    - Extract the number of bedrooms (key: 'bedrooms').
    - Extract the number of bathrooms (key: 'bathrooms').
    - Extract the square footage (key: 'squareFootage').
    Return ALL extracted properties as a single JSON list of objects. Each object must have keys 'url', 'price', 'address', 'bedrooms', 'bathrooms', 'squareFootage'. Use null if a value isn't found.
    If no properties are found, return an empty list [].
  `,
  lotside: `
    Analyze this Lotside browse page. Identify the main container holding property cards or listings. These might be divs with specific classes related to 'property', 'card', or 'listing'.
    For EACH property card/listing found:
    - Extract the direct URL link to the property's detail page. This might be associated with the address or an image (key: 'url'). Look for links pointing to '/property/...' or similar.
    - Extract the listed price (key: 'price').
    - Extract the full street address (key: 'address').
    - Extract the number of bedrooms (key: 'bedrooms').
    - Extract the number of bathrooms (key: 'bathrooms').
    - Extract the square footage (key: 'squareFootage').
    Return ALL extracted properties as a single JSON list of objects. Each object must have keys 'url', 'price', 'address', 'bedrooms', 'bathrooms', 'squareFootage'. Use null if a value isn't found.
    If no properties are found, return an empty list [].
  `
  // Add other source-specific prompts here if needed
};

// Generic prompt as a fallback
const GENERIC_LISTING_PROMPT = `
  Analyze this real estate search results page which lists multiple properties for sale.
  Identify the main list or grid containing the individual property summaries.
  For EACH property summary found in that list, extract the following details:
  - The direct URL link to the property's own detail page (key: 'url').
  - The listed sale price (key: 'price'). If not found, use null.
  - The full street address (key: 'address'). If not found, use null.
  - Number of bedrooms (key: 'bedrooms'). If not found, use null.
  - Number of bathrooms (key: 'bathrooms'). If not found, use null.
  - Square footage (key: 'squareFootage'). If not found, use null.
  Return ALL extracted properties as a single JSON list of objects. Each object in the list must represent one property and contain the keys 'url', 'price', 'address', 'bedrooms', 'bathrooms', and 'squareFootage'.
  If no properties are found on the page, return an empty list [].
  Example of expected output format: [{"url": "...", "price": "$500,000", "address": "123 Main St", "bedrooms": 3, "bathrooms": 2, "squareFootage": 1500}, {"url": "...", ...}]
`;


/**
 * Property Scraper Class
 */
class PropertyScraper {
  constructor() {
    // Removed old properties like userAgent, delay, proxy as Crawl4AI service handles this
    this.crawl4aiServiceUrl = CRAWL4AI_SERVICE_URL;
  }

  /**
   * Call the Crawl4AI service to scrape data.
   * @param {string} url - The URL to scrape.
   * @param {string | null} prompt - The prompt for LLM extraction (null if using schema).
   * @param {Object | null} schema - The CSS schema for direct extraction (null if using prompt).
   * @param {Object | null} headers - Optional headers to use for the request.
   * @returns {Promise<Object>} - The extracted data.
   * @throws {Error} If scraping fails after all retries.
   */
  async callCrawl4aiService(url, prompt, schema, headers = null) { // Added schema parameter
    const targetUrl = `${this.crawl4aiServiceUrl}/scrape`; // Construct URL
    console.log(`[Debug] Attempting to call Crawl4AI service at: ${targetUrl}`);
    console.log(`[Debug] Target URL for scraping: ${url}`);

    // Construct POST data, including either prompt or schema
    const postData = { url };
    if (schema) {
      postData.schema = schema;
      console.log(`[Debug] Using CSS Schema for extraction:`, schema);
    } else if (prompt) {
      postData.prompt = prompt;
      // Log only the start of the prompt to avoid flooding logs
      console.log(`[Debug] Using LLM Prompt for extraction (start): ${prompt.substring(0, 150)}...`);
    } else {
      // Should not happen if called correctly from scrapeListings/scrapePropertyDetails
      throw new Error("Must provide either a prompt or a schema to callCrawl4aiService.");
    }

    // Add headers if provided
    if (headers) {
      postData.headers = headers; // Pass headers to the service if available
      console.log(`[Debug] Sending headers to Crawl4AI service:`, headers);
    } else {
      console.log(`[Debug] Not sending custom headers to Crawl4AI service.`);
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${MAX_RETRIES} for ${url}...`);
        const response = await axios.post(targetUrl, postData);

        // Log raw response data for debugging
        console.log(`[Debug] Raw response from Crawl4AI service (Attempt ${attempt}):`, JSON.stringify(response.data, null, 2));

        // Check for success and potential errors within the response data
        if (response.data) {
            if (response.data.success && response.data.error) {
                // Success reported, but an error message exists (e.g., parsing failed, LLM error)
                console.warn(`Crawl4AI service succeeded for ${url} but reported an error: ${response.data.error}`);
                // Treat this as a failure for retry purposes
                throw new Error(`Crawl4AI service error: ${response.data.error}`);
            } else if (response.data.success) {
                // True success, data might be null if nothing found/extracted
                console.log(`Crawl4AI service succeeded for ${url} on attempt ${attempt}.`);
                return response.data.data;
            } else {
                // Explicit failure reported by the service (success: false)
                const errorMessage = response.data.error || 'Unknown error from Crawl4AI service (success: false)';
                console.warn(`Crawl4AI service indicated failure for ${url} on attempt ${attempt}: ${errorMessage}`);
                throw new Error(`Crawl4AI service failed: ${errorMessage}`);
            }
        } else {
          // If response.data itself is missing or malformed
          const errorMessage = 'Invalid or empty response from Crawl4AI service';
          console.warn(`Crawl4AI service indicated failure for ${url} on attempt ${attempt}: ${errorMessage}`);
          // Throw an error to trigger the catch block for retry logic
          throw new Error(`Crawl4AI service failed: ${errorMessage}`);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message; // Prefer detail if available from FastAPI error
        console.warn(`Error calling Crawl4AI service for ${url} on attempt ${attempt}: ${errorMessage}`);

        if (attempt === MAX_RETRIES) {
          console.error(`All ${MAX_RETRIES} attempts failed for ${url}.`);
          throw new Error(`Failed to scrape ${url} after ${MAX_RETRIES} attempts: ${errorMessage}`); // Throw final error
        }

        // Wait before retrying
        console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
     // This line should theoretically not be reached if MAX_RETRIES > 0
     throw new Error(`Failed to scrape ${url} after ${MAX_RETRIES} attempts.`);
  }


  /**
   * Scrape property listings from a given URL/source configuration
   * @param {Object} options - Object containing source, url, filters, listingPrompt or listingSchema, and headers
   * @returns {Promise<Object|null>} - Extracted data object (e.g., { items: [...] }) or null on failure.
   */
  async scrapeListings(options) {
    // Destructure options, including potential schema and prompt
    const { source, url, filters = {}, listingPrompt, listingSchema, headers } = options;
    console.log(`Scraping property listings from ${source} at: ${url}`);
    console.log('Filters:', filters);

    // Determine if using schema or prompt
    const useSchema = !!listingSchema;
    console.log(`Using ${useSchema ? 'CSS Schema' : 'LLM Prompt'} for ${source} listings.`);

    if (!useSchema && !listingPrompt) {
        console.error(`[Error] No listingPrompt or listingSchema provided for scrapeListings source: ${source}`);
        throw new Error(`No prompt or schema available for source ${source}`);
    }

    try {
      // Call service with either prompt or schema (pass null for the one not used)
      const extractedData = await this.callCrawl4aiService(
        url,
        useSchema ? null : listingPrompt, // Pass prompt only if not using schema
        useSchema ? listingSchema : null, // Pass schema only if using schema
        headers
      );

      // The workflow manager handles the default empty structure.
      // This function returns the raw data (or null) received from the service.
      if (extractedData === null) {
          console.log(`Crawl4AI service returned null data for ${url}.`);
          return null; // Return null as received
      }

      // Basic validation: Check if it's an object or list (as expected from enhanced prompt)
      if (typeof extractedData !== 'object' && !Array.isArray(extractedData)) {
           console.error(`Crawl4AI service returned unexpected data type: ${typeof extractedData}`, extractedData);
           // Return null or throw error based on desired strictness
           return null; 
      }

      // Log success and return the data
      console.log(`Successfully received data structure from Crawl4AI for ${url}`);
      return extractedData; // Return the object/list received

    } catch (error) {
        console.error(`Error in scrapeListings calling Crawl4AI for ${url}: ${error.message}`);
        throw error;
    }
  }


  /**
   * Scrape detailed property data from a listing URL
   * @param {string} url - Property listing URL
   * @param {string} detailPrompt - Optional prompt specific to detail scraping
   * @returns {Promise<Object>} - Detailed property data
   */
  async scrapePropertyDetails(url, detailPrompt) {
    console.log(`Scraping property details from: ${url}`);

    // Define a generic prompt or use the one provided
    const prompt = detailPrompt || `
      Scrape this real estate property detail page.
      Extract the following information:
      - Full street address (as 'address')
      - City (as 'city')
      - State (as 'state')
      - Zip code (as 'zip')
      - Listed price (as 'price')
      - Number of bedrooms (as 'bedrooms')
      - Number of bathrooms (as 'bathrooms')
      - Square footage (as 'squareFootage')
      - Year built (as 'yearBuilt')
      - Lot size (as 'lotSize')
      - Property type (e.g., 'Single Family', 'Condo') (as 'propertyType')
      - HOA fees (if available, per month or year) (as 'hoaFees')
      - Property tax information (if available) (as 'taxInfo')
      - A detailed description of the property (as 'description')
      - List of image URLs (as 'images', should be a list of strings)
      - List of property features or amenities (as 'features', should be a list of strings)
      - The source website or MLS name (as 'source')
      Return the result as a single JSON object.
      Example: {"address": "123 Main St", "city": "Anytown", "state": "CA", "zip": "12345", "price": "$500,000", ...}
    `;

    try {
        const extractedData = await this.callCrawl4aiService(url, prompt);

        // Basic validation (ensure it's an object)
        if (typeof extractedData !== 'object' || extractedData === null || Array.isArray(extractedData)) {
            console.error("Crawl4AI service did not return an object for details:", extractedData);
            throw new Error("Expected an object with property details from Crawl4AI service.");
        }

        console.log(`Scraped details for property at: ${extractedData.address || url}`);
        // Add the URL scraped from, as it might not be in the extracted data
        extractedData.scrapedUrl = url;
        return extractedData;

    } catch (error) {
        console.error(`Error scraping property details from ${url}: ${error.message}`);
        throw error;
    }
  }

  /**
   * Save property data to database
   * @param {Object} propertyData - Property data to save
   * @returns {Promise<Object>} - Saved property data with IDs
   */
  async savePropertyData(propertyData) {
    console.log(`Saving property data for: ${propertyData.address}`);

    try {
      // Clean and normalize property data
      const cleanedData = cleanPropertyData(propertyData);
      
      // Start a PostgreSQL transaction
      const pgClient = await pgPool.connect();
      
      try {
        await pgClient.query('BEGIN');
        
        // Insert into PostgreSQL properties table
        const pgQuery = `
          INSERT INTO properties (
            address, city, state, zip, location, price, 
            bedrooms, bathrooms, square_footage, year_built, 
            lot_size, property_type, hoa_fees, tax_info, description,
            listing_url -- Added listing_url column
          ) VALUES (
            $1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, 
            $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17 -- Added parameter for listing_url
          ) RETURNING id;
        `;
        
        // Extract latitude and longitude (in a real implementation, these would be geocoded)
        const lat = 37.7749; // Mock latitude
        const lng = -122.4194; // Mock longitude
        
        const pgResult = await pgClient.query(pgQuery, [
          cleanedData.address,
          cleanedData.city,
          cleanedData.state,
          cleanedData.zip,
          lng, // Note: PostgreSQL uses (longitude, latitude) order
          lat,
          cleanedData.price,
          cleanedData.bedrooms,
          cleanedData.bathrooms,
          cleanedData.squareFootage,
          cleanedData.yearBuilt,
          cleanedData.lotSize,
          cleanedData.propertyType,
          cleanedData.hoaFees,
          cleanedData.taxInfo,
          propertyData.description || '',
          propertyData.scrapedUrl || null // Add scrapedUrl (or null if missing) as the 17th parameter
        ]);
        
        const pgPropertyId = pgResult.rows[0].id;
        
        // Insert into MongoDB for unstructured data
        const mongoProperty = new Property({
          pgPropertyId,
          images: propertyData.images || [],
          detailedDescription: propertyData.detailedDescription || '',
          features: propertyData.features || [],
          metadata: {
            source: propertyData.source || 'unknown',
            scrapedAt: new Date()
          }
        });
        
        await mongoProperty.save();
        
        // Commit PostgreSQL transaction
        await pgClient.query('COMMIT');
        
        console.log(`Property saved successfully with ID: ${pgPropertyId}`);
        
        return {
          pgPropertyId,
          mongoPropertyId: mongoProperty._id,
          ...cleanedData
        };
      } catch (error) {
        // Rollback transaction on error
        await pgClient.query('ROLLBACK');
        throw error;
      } finally {
        // Release client back to pool
        pgClient.release();
      }
    } catch (error) {
      console.error(`Error saving property data: ${error.message}`);
      throw error;
    }
  }

  // Removed generateMockListings and generateMockPropertyDetails as they are replaced by actual scraping
} // End of PropertyScraper class

module.exports = PropertyScraper;
