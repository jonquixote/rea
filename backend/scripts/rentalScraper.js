// Rental Estimator Scraper Implementation using Crawl4AI via separate service
const axios = require('axios');
// Removed unused delay/user-agent utils from scraperUtils
const { RentalTrainingData } = require('../models/mongoSchemas');
const { pgPool } = require('../config/db');
// const dotenv = require('dotenv'); // Remove: Docker Compose injects env vars

// Load environment variables from root - Remove: Incorrect path and redundant
// dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

// Get URL from environment variable set by Docker Compose
const CRAWL4AI_SERVICE_URL = process.env.CRAWL4AI_SERVICE_URL;

// Add a check to ensure the variable is set
if (!CRAWL4AI_SERVICE_URL) {
  console.error("Error: CRAWL4AI_SERVICE_URL environment variable is not set. Check docker-compose.yml.");
  process.exit(1); // Exit if the URL is missing
}

/**
 * Rental Estimator Scraper Class
 */
class RentalEstimatorScraper {
  constructor() {
    // Removed old properties like userAgent, delay, proxy
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
   * Scrape rental listings from a given URL/source configuration
   * @param {string} sourceConfig - Object containing url, filters, and potentially listing prompt
   * @returns {Promise<Array>} - Array of rental listing data (e.g., [{ url: '...', rent: '...', address: '...' }])
   */
  async scrapeRentalListings(sourceConfig) {
    const { url, filters = {}, listingPrompt } = sourceConfig;
    console.log(`Scraping rental listings from: ${url}`);
    console.log('Filters:', filters); // Filters might inform the prompt

    // Define a generic prompt or use one from sourceConfig
    const prompt = listingPrompt || `
      Scrape this page listing multiple real estate properties for rent.
      Extract the following information for each property listed:
      - The direct URL to the rental's detail page (as 'url')
      - The listed monthly rent (as 'rent')
      - The full street address (as 'address')
      - Number of bedrooms (as 'bedrooms')
      - Number of bathrooms (as 'bathrooms')
      - Square footage (if available) (as 'squareFootage')
      Return the result as a JSON list of objects, where each object represents a rental property.
      Example: [{"url": "...", "rent": "$2,500/mo", "address": "456 Oak St", "bedrooms": 2, "bathrooms": 1, "squareFootage": 900}, ...]
    `;

    try {
      const extractedData = await this.callCrawl4aiService(url, prompt);

      // Validate the structure (should be a list)
      if (!Array.isArray(extractedData)) {
          console.error("Crawl4AI service did not return a list for rental listings:", extractedData);
          throw new Error("Expected a list of rental listings from Crawl4AI service.");
      }

      console.log(`Scraped ${extractedData.length} potential rental listings from ${url}`);
      return extractedData;

    } catch (error) {
        console.error(`Error scraping rental listings from ${url}: ${error.message}`);
        throw error;
    }
  }

  /**
   * Scrape detailed rental data from a listing URL
   * @param {string} url - Rental listing URL
   * @param {string} detailPrompt - Optional prompt specific to detail scraping
   * @returns {Promise<Object>} - Detailed rental data
   */
  async scrapeRentalDetails(url, detailPrompt) {
    console.log(`Scraping rental details from: ${url}`);

    // Define a generic prompt or use the one provided
    const prompt = detailPrompt || `
      Scrape this real estate rental property detail page.
      Extract the following information:
      - Full street address (as 'address')
      - City (as 'city')
      - State (as 'state')
      - Zip code (as 'zip')
      - Listed monthly rent (as 'rent')
      - Number of bedrooms (as 'bedrooms')
      - Number of bathrooms (as 'bathrooms')
      - Square footage (as 'squareFootage')
      - Property type (e.g., 'Apartment', 'House', 'Condo') (as 'propertyType')
      - Year built (if available) (as 'yearBuilt')
      - List of amenities or features (as 'features', should be a list of strings)
      - Date the listing was posted or became available (if available) (as 'listingDate')
      - The source website or listing provider name (as 'source')
      - A detailed description of the rental property (as 'description')
      Return the result as a single JSON object.
      Example: {"address": "456 Oak St", "city": "Anytown", "state": "CA", "zip": "12345", "rent": "$2,500/mo", ...}
    `;

    try {
        const extractedData = await this.callCrawl4aiService(url, prompt);

        // Basic validation (ensure it's an object)
        if (typeof extractedData !== 'object' || extractedData === null || Array.isArray(extractedData)) {
            console.error("Crawl4AI service did not return an object for rental details:", extractedData);
            throw new Error("Expected an object with rental details from Crawl4AI service.");
        }

        console.log(`Scraped details for rental at: ${extractedData.address || url}`);
        // Add the URL scraped from
        extractedData.scrapedUrl = url;
        // Rename 'rent' to 'actualRent' to match schema? Or handle in saveRentalData
        if (extractedData.rent) {
            extractedData.actualRent = extractedData.rent;
            // delete extractedData.rent; // Optional: remove original 'rent' key
        }
        return extractedData;

    } catch (error) {
        console.error(`Error scraping rental details from ${url}: ${error.message}`);
        throw error;
    }
  }

  /**
   * Save rental data to database for training
   * @param {Object} rentalData - Rental data to save
   * @returns {Promise<Object>} - Saved rental data with ID
   */
  async saveRentalData(rentalData) {
    console.log(`Saving rental data for: ${rentalData.address}`);

    try {
      // Create new rental training data document
      const rentalTrainingData = new RentalTrainingData({
        address: rentalData.address,
        city: rentalData.city,
        state: rentalData.state,
        zip: rentalData.zip,
        bedrooms: rentalData.bedrooms,
        bathrooms: rentalData.bathrooms,
        squareFootage: rentalData.squareFootage,
        propertyType: rentalData.propertyType,
        yearBuilt: rentalData.yearBuilt,
        amenities: rentalData.features || [],
        actualRent: rentalData.rent,
        listingDate: rentalData.listingDate || new Date(),
        source: rentalData.source || 'unknown',
        metadata: {
          scrapedAt: new Date()
        }
      });
      
      // Save to MongoDB
      await rentalTrainingData.save();
      
      console.log(`Rental data saved successfully with ID: ${rentalTrainingData._id}`);
      
      return {
        id: rentalTrainingData._id,
        ...rentalData
      };
    } catch (error) {
      console.error(`Error saving rental data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save rental estimate for a property
   * @param {number} propertyId - PostgreSQL property ID
   * @param {number} estimatedRent - Estimated monthly rent
   * @param {string} method - Estimation method
   * @param {number} confidenceScore - Confidence score (0-100)
   * @returns {Promise<Object>} - Saved rental estimate data
   */
  async saveRentalEstimate(propertyId, estimatedRent, method = 'ml-model', confidenceScore = 85) {
    console.log(`Saving rental estimate for property ID: ${propertyId}`);

    try {
      // Start a PostgreSQL transaction
      const pgClient = await pgPool.connect();
      
      try {
        await pgClient.query('BEGIN');
        
        // Insert into PostgreSQL rental_estimates table
        const pgQuery = `
          INSERT INTO rental_estimates (
            property_id, estimated_rent, estimation_method, confidence_score
          ) VALUES (
            $1, $2, $3, $4
          ) RETURNING id;
        `;
        
        const pgResult = await pgClient.query(pgQuery, [
          propertyId,
          estimatedRent,
          method,
          confidenceScore
        ]);
        
        const estimateId = pgResult.rows[0].id;
        
        // Commit PostgreSQL transaction
        await pgClient.query('COMMIT');
        
        console.log(`Rental estimate saved successfully with ID: ${estimateId}`);
        
        return {
          id: estimateId,
          propertyId,
          estimatedRent,
          method,
          confidenceScore
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
      console.error(`Error saving rental estimate: ${error.message}`);
      throw error;
    }
  }

  // Removed generateMockRentalListings and generateMockRentalDetails
} // End of RentalEstimatorScraper class

module.exports = RentalEstimatorScraper;
