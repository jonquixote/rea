// Property Scraper Implementation using Crawl4AI
const axios = require('axios');
const { getRandomDelay, getRandomUserAgent, cleanPropertyData } = require('../utils/scraperUtils');
const { Property } = require('../models/mongoSchemas');
const { pgPool } = require('../config/db');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Property Scraper Class
 */
class PropertyScraper {
  constructor() {
    this.userAgent = process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.minDelay = parseInt(process.env.SCRAPER_DELAY_MIN || '1000', 10);
    this.maxDelay = parseInt(process.env.SCRAPER_DELAY_MAX || '5000', 10);
    this.useProxy = process.env.USE_PROXY === 'true';
    this.proxyList = process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [];
  }

  /**
   * Get a random proxy from the list
   * @returns {string|null} - Random proxy or null if none available
   */
  getRandomProxy() {
    if (!this.useProxy || this.proxyList.length === 0) return null;
    return this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
  }

  /**
   * Scrape property listings from a given URL
   * @param {string} url - URL to scrape
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} - Array of property data
   */
  async scrapeListings(url, filters = {}) {
    console.log(`Scraping property listings from: ${url}`);
    console.log('Filters:', filters);

    try {
      // In a real implementation, this would use Crawl4AI to scrape the website
      // For now, we'll simulate the scraping process with a delay
      
      const delay = getRandomDelay(this.minDelay, this.maxDelay);
      console.log(`Waiting for ${delay}ms before scraping...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate scraping results
      const mockListings = this.generateMockListings(filters);
      
      console.log(`Scraped ${mockListings.length} property listings`);
      return mockListings;
    } catch (error) {
      console.error(`Error scraping property listings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape detailed property data from a listing URL
   * @param {string} url - Property listing URL
   * @returns {Promise<Object>} - Detailed property data
   */
  async scrapePropertyDetails(url) {
    console.log(`Scraping property details from: ${url}`);

    try {
      // In a real implementation, this would use Crawl4AI to scrape the property details
      // For now, we'll simulate the scraping process with a delay
      
      const delay = getRandomDelay(this.minDelay, this.maxDelay);
      console.log(`Waiting for ${delay}ms before scraping...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate property details
      const mockDetails = this.generateMockPropertyDetails(url);
      
      console.log(`Scraped details for property: ${mockDetails.address}`);
      return mockDetails;
    } catch (error) {
      console.error(`Error scraping property details: ${error.message}`);
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

  /**
   * Generate mock property listings for testing
   * @param {Object} filters - Search filters
   * @returns {Array} - Array of mock property listings
   */
  generateMockListings(filters = {}) {
    const count = Math.floor(Math.random() * 10) + 5; // 5-15 listings
    const listings = [];
    
    for (let i = 0; i < count; i++) {
      listings.push({
        id: `property-${i + 1}`,
        address: `${1000 + i} Main St`,
        city: filters.city || 'Anytown',
        state: filters.state || 'CA',
        zip: filters.zip || '12345',
        price: filters.minPrice ? 
          Math.floor(Math.random() * (filters.maxPrice - filters.minPrice) + filters.minPrice) : 
          Math.floor(Math.random() * 500000) + 200000,
        bedrooms: filters.bedrooms || Math.floor(Math.random() * 3) + 2,
        bathrooms: filters.bathrooms || Math.floor(Math.random() * 2) + 1.5,
        squareFootage: Math.floor(Math.random() * 1000) + 1000,
        url: `https://example.com/property-${i + 1}`
      });
    }
    
    return listings;
  }

  /**
   * Generate mock property details for testing
   * @param {string} url - Property URL
   * @returns {Object} - Mock property details
   */
  generateMockPropertyDetails(url) {
    const propertyId = url.split('-').pop();
    
    return {
      id: `property-${propertyId}`,
      address: `${1000 + parseInt(propertyId, 10)} Main St`,
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      price: Math.floor(Math.random() * 500000) + 200000,
      bedrooms: Math.floor(Math.random() * 3) + 2,
      bathrooms: Math.floor(Math.random() * 2) + 1.5,
      squareFootage: Math.floor(Math.random() * 1000) + 1000,
      yearBuilt: Math.floor(Math.random() * 50) + 1970,
      lotSize: Math.floor(Math.random() * 5000) + 5000,
      propertyType: 'Single Family',
      hoaFees: Math.random() < 0.3 ? Math.floor(Math.random() * 300) + 100 : 0,
      taxInfo: Math.floor(Math.random() * 5000) + 2000,
      description: 'Beautiful home in a great neighborhood with excellent schools and amenities.',
      images: [
        { url: 'https://example.com/images/property-1.jpg', caption: 'Front view', isPrimary: true },
        { url: 'https://example.com/images/property-2.jpg', caption: 'Kitchen', isPrimary: false },
        { url: 'https://example.com/images/property-3.jpg', caption: 'Living room', isPrimary: false }
      ],
      features: [
        'Central Air',
        'Hardwood Floors',
        'Granite Countertops',
        'Stainless Steel Appliances',
        'Fenced Yard'
      ],
      source: 'Mock MLS',
      detailedDescription: 'This stunning home features an open floor plan with plenty of natural light. The kitchen has been recently updated with granite countertops and stainless steel appliances. The spacious master bedroom includes an en-suite bathroom with a double vanity and walk-in shower. The backyard is perfect for entertaining with a covered patio and mature landscaping.'
    };
  }
}

module.exports = PropertyScraper;
