// Property Scraper Implementation using Crawl4AI via separate service
const axios = require('axios');
const { cleanPropertyData } = require('../utils/scraperUtils'); // Removed unused delay/user-agent utils
const { Property } = require('../models/mongoSchemas');
const { pgPool } = require('../config/db');
// const dotenv = require('dotenv'); // Remove: Docker Compose injects env vars

// dotenv.config({ path: require('path').resolve(__dirname, '../../.env') }); // Remove: Incorrect path and redundant

// Get URL from environment variable set by Docker Compose
const CRAWL4AI_SERVICE_URL = process.env.CRAWL4AI_SERVICE_URL; 

// Add a check to ensure the variable is set
if (!CRAWL4AI_SERVICE_URL) {
  console.error("Error: CRAWL4AI_SERVICE_URL environment variable is not set. Check docker-compose.yml.");
  process.exit(1); // Exit if the URL is missing
}

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
   * @param {string} prompt - The prompt for data extraction.
   * @returns {Promise<Object>} - The extracted data.
   * @throws {Error} If scraping fails or the service returns an error.
   */
  async callCrawl4aiService(url, prompt) {
    const targetUrl = `${this.crawl4aiServiceUrl}/scrape`; // Construct URL
    console.log(`Attempting to call Crawl4AI service at: ${targetUrl}`); // Log the URL
    try {
      const response = await axios.post(targetUrl, { // Use the constructed URL
        url,
        prompt,
      });

      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        const errorMessage = response.data?.error || 'Unknown error from Crawl4AI service';
        throw new Error(`Crawl4AI service failed: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      console.error(`Error calling Crawl4AI service for ${url}: ${errorMessage}`);
      throw new Error(`Failed to scrape ${url}: ${errorMessage}`);
    }
  }


  /**
   * Scrape property listings from a given URL/source configuration
   * @param {string} sourceConfig - Object containing url, filters, and potentially listing prompt
   * @returns {Promise<Array>} - Array of property listing data (e.g., [{ url: '...', price: '...', address: '...' }])
   */
  async scrapeListings(sourceConfig) {
    const { url, filters = {}, listingPrompt } = sourceConfig;
    console.log(`Scraping property listings from: ${url}`);
    console.log('Filters:', filters); // Note: Filters are not directly used in scrape call, but might inform the prompt

    // Define a generic prompt or use one from sourceConfig
    const prompt = listingPrompt || `
      Scrape this page listing multiple real estate properties for sale.
      Extract the following information for each property listed:
      - The direct URL to the property's detail page (as 'url')
      - The listed price (as 'price')
      - The full street address (as 'address')
      - Number of bedrooms (as 'bedrooms')
      - Number of bathrooms (as 'bathrooms')
      - Square footage (as 'squareFootage')
      Return the result as a JSON list of objects, where each object represents a property.
      Example: [{"url": "...", "price": "$500,000", "address": "123 Main St", "bedrooms": 3, "bathrooms": 2, "squareFootage": 1500}, ...]
    `;

    try {
      const extractedData = await this.callCrawl4aiService(url, prompt);

      // Validate the structure of the returned data (should be a list)
      if (!Array.isArray(extractedData)) {
          console.error("Crawl4AI service did not return a list for listings:", extractedData);
          throw new Error("Expected a list of listings from Crawl4AI service, but received a different type.");
      }

      console.log(`Scraped ${extractedData.length} potential property listings from ${url}`);
      // Further validation could be added here to check if objects have expected keys (url, price, etc.)
      return extractedData;

    } catch (error) {
        console.error(`Error scraping property listings from ${url}: ${error.message}`);
        // Decide how to handle errors - skip source, retry, etc. Here we re-throw.
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
            lot_size, property_type, hoa_fees, tax_info, description
          ) VALUES (
            $1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, 
            $8, $9, $10, $11, $12, $13, $14, $15, $16
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
          propertyData.description || ''
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
