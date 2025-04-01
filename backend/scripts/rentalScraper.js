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

      // Check for success first
      if (response.data && response.data.success) {
        // Return the data, which might be null if nothing was extracted
        return response.data.data;
      } else {
        // If success is false, or response format is unexpected, throw an error
        const errorMessage = response.data?.error || 'Unknown error or invalid response from Crawl4AI service';
        console.error(`Crawl4AI service indicated failure for ${url}: ${errorMessage}`); // Log the specific error from the service if available
        throw new Error(`Crawl4AI service failed: ${errorMessage}`);
      }
    } catch (error) {
       // Handle network errors or errors thrown explicitly above
      const errorMessage = error.response?.data?.detail || error.message; // Prefer detail if available from FastAPI error
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
      Analyze this real estate search results page which lists multiple properties for rent.
      Identify the main list or grid containing the individual rental property summaries.
      For EACH rental property summary found in that list, extract the following details:
      - The direct URL link to the rental's own detail page (key: 'url').
      - The listed monthly rent amount (key: 'rent'). If not found, use null.
      - The full street address (key: 'address'). If not found, use null.
      - Number of bedrooms (key: 'bedrooms'). If not found, use null.
      - Number of bathrooms (key: 'bathrooms'). If not found, use null.
      - Square footage (key: 'squareFootage'). If not found, use null.
      Return ALL extracted rental properties as a single JSON list of objects. Each object in the list must represent one rental and contain the keys 'url', 'rent', 'address', 'bedrooms', 'bathrooms', and 'squareFootage'.
      If no rental properties are found on the page, return an empty list [].
      Example of expected output format: [{"url": "...", "rent": "$2,500/mo", "address": "456 Oak St", "bedrooms": 2, "bathrooms": 1, "squareFootage": 900}, {"url": "...", ...}]
    `;

    try {
      const extractedData = await this.callCrawl4aiService(url, prompt);

      // If extractedData is null (meaning service succeeded but found nothing), return an empty array.
      if (extractedData === null) {
          console.log(`Crawl4AI service returned null (no rental listings found) for ${url}. Returning empty list.`);
          return [];
      }

      // Check if the response is an object with an 'items' key which is an array
      if (typeof extractedData === 'object' && extractedData !== null && Array.isArray(extractedData.items)) {
          const listings = extractedData.items;
          console.log(`Scraped ${listings.length} potential rental listings from ${url}`);
          return listings; // Return the items array
      }
      // Check if it's already a direct array (for backward compatibility or other sources)
      else if (Array.isArray(extractedData)) {
          console.log(`Scraped ${extractedData.length} potential rental listings from ${url}`);
          return extractedData; // Return the direct array
      }
      // If it's neither null, an object with items array, nor a direct array, it's an error
      else {
          console.error("Crawl4AI service did not return a list, null, or {items: [...]} for rental listings:", extractedData);
          throw new Error("Expected a list, null, or {items: [...]} from Crawl4AI service, but received a different type.");
      }

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

    // --- Data Cleaning ---
    let cleanedRent = null;
    if (rentalData.actualRent && typeof rentalData.actualRent === 'string') {
      const rentString = rentalData.actualRent.replace(/[$,\/moMonth\s+]/gi, ''); // Remove $, commas, /mo, /Month, spaces
      cleanedRent = parseFloat(rentString);
      if (isNaN(cleanedRent)) {
        console.warn(`Could not parse rent: ${rentalData.actualRent}`);
        cleanedRent = null; // Set to null if parsing failed
      }
    } else if (typeof rentalData.actualRent === 'number') {
       cleanedRent = rentalData.actualRent; // Already a number
    }

    let cleanedSqft = null;
    if (rentalData.squareFootage && typeof rentalData.squareFootage === 'string') {
      const sqftString = rentalData.squareFootage.replace(/[,sqft\s]/gi, ''); // Remove commas, sq ft, spaces
      cleanedSqft = parseInt(sqftString, 10);
       if (isNaN(cleanedSqft)) {
        console.warn(`Could not parse square footage: ${rentalData.squareFootage}`);
        cleanedSqft = null; // Set to null if parsing failed
      }
    } else if (typeof rentalData.squareFootage === 'number') {
        cleanedSqft = rentalData.squareFootage; // Already a number
    }

    let cleanedDate = new Date(); // Default to now
    if (rentalData.listingDate && typeof rentalData.listingDate === 'string') {
        const dateString = rentalData.listingDate.toLowerCase();
        if (dateString.includes('today')) {
            // Already defaulted to today
        } else if (dateString.includes('yesterday')) {
            cleanedDate.setDate(cleanedDate.getDate() - 1);
        } else if (dateString.includes('day ago') || dateString.includes('days ago')) {
            const days = parseInt(dateString.replace(/\D/g, ''), 10);
            if (!isNaN(days)) {
                cleanedDate.setDate(cleanedDate.getDate() - days);
            }
        } else if (dateString.includes('week ago') || dateString.includes('weeks ago')) {
             const weeks = parseInt(dateString.replace(/\D/g, ''), 10);
            if (!isNaN(weeks)) {
                cleanedDate.setDate(cleanedDate.getDate() - (weeks * 7));
            }
        } else {
            // Try parsing as a standard date string if possible
            const parsed = Date.parse(rentalData.listingDate);
            if (!isNaN(parsed)) {
                cleanedDate = new Date(parsed);
            } else {
                 console.warn(`Could not parse listing date: ${rentalData.listingDate}. Defaulting to today.`);
            }
        }
    } else if (rentalData.listingDate instanceof Date) {
        cleanedDate = rentalData.listingDate; // Already a Date object
    }
    // --- End Data Cleaning ---


    try {
      // Create new rental training data document using cleaned data
      const rentalTrainingData = new RentalTrainingData({
        address: rentalData.address,
        city: rentalData.city,
        state: rentalData.state,
        zip: rentalData.zip,
        bedrooms: rentalData.bedrooms,
        bathrooms: rentalData.bathrooms,
        squareFootage: cleanedSqft, // Use cleaned value
        propertyType: rentalData.propertyType,
        yearBuilt: rentalData.yearBuilt,
        amenities: rentalData.features || [],
        actualRent: cleanedRent, // Use cleaned value
        listingDate: cleanedDate, // Use cleaned value
        source: rentalData.source || 'unknown',
        metadata: {
          scrapedAt: new Date(),
          originalRentString: rentalData.actualRent, // Keep original for reference if needed
          originalSqftString: rentalData.squareFootage,
          originalDateString: rentalData.listingDate
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
