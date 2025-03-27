// Scraping utilities for property data

/**
 * Configuration for web scraping
 * @typedef {Object} ScraperConfig
 * @property {string} userAgent - User agent string for requests
 * @property {number} minDelay - Minimum delay between requests in ms
 * @property {number} maxDelay - Maximum delay between requests in ms
 * @property {boolean} useProxy - Whether to use proxy rotation
 * @property {Array<string>} proxyList - List of proxies to rotate through
 */

/**
 * Generate a random delay between min and max values
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {number} - Random delay in ms
 */
const getRandomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Get a random user agent from the list
 * @param {Array<string>} userAgents - List of user agents
 * @returns {string} - Random user agent
 */
const getRandomUserAgent = (userAgents) => {
  if (!userAgents || userAgents.length === 0) {
    // Default user agents if none provided
    const defaultUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
    return defaultUserAgents[Math.floor(Math.random() * defaultUserAgents.length)];
  }
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

/**
 * Clean and normalize property data
 * @param {Object} propertyData - Raw property data from scraper
 * @returns {Object} - Cleaned and normalized property data
 */
const cleanPropertyData = (propertyData) => {
  if (!propertyData) return null;
  
  // Create a new object with cleaned data
  const cleanedData = {};
  
  // Clean price - remove non-numeric characters and convert to number
  if (propertyData.price) {
    cleanedData.price = Number(propertyData.price.replace(/[^0-9.]/g, ''));
  }
  
  // Clean address
  if (propertyData.address) {
    cleanedData.address = propertyData.address.trim();
  }
  
  // Clean city
  if (propertyData.city) {
    cleanedData.city = propertyData.city.trim();
  }
  
  // Clean state
  if (propertyData.state) {
    cleanedData.state = propertyData.state.trim();
  }
  
  // Clean zip
  if (propertyData.zip) {
    cleanedData.zip = propertyData.zip.trim();
  }
  
  // Combine address components
  cleanedData.location = [
    cleanedData.address,
    cleanedData.city,
    cleanedData.state,
    cleanedData.zip
  ].filter(Boolean).join(', ');
  
  // Clean bedrooms - extract number
  if (propertyData.bedrooms) {
    const bedroomsMatch = propertyData.bedrooms.toString().match(/(\d+)/);
    cleanedData.bedrooms = bedroomsMatch ? Number(bedroomsMatch[1]) : null;
  }
  
  // Clean bathrooms - extract number
  if (propertyData.bathrooms) {
    const bathroomsMatch = propertyData.bathrooms.toString().match(/(\d+(\.\d+)?)/);
    cleanedData.bathrooms = bathroomsMatch ? Number(bathroomsMatch[1]) : null;
  }
  
  // Clean square footage - remove non-numeric characters and convert to number
  if (propertyData.squareFootage) {
    cleanedData.squareFootage = Number(propertyData.squareFootage.toString().replace(/[^0-9.]/g, ''));
  }
  
  // Clean year built - extract 4-digit year
  if (propertyData.yearBuilt) {
    const yearMatch = propertyData.yearBuilt.toString().match(/\b(19|20)\d{2}\b/);
    cleanedData.yearBuilt = yearMatch ? Number(yearMatch[0]) : null;
  }
  
  // Clean lot size - remove non-numeric characters and convert to number
  if (propertyData.lotSize) {
    cleanedData.lotSize = Number(propertyData.lotSize.toString().replace(/[^0-9.]/g, ''));
  }
  
  // Clean property type
  if (propertyData.propertyType) {
    cleanedData.propertyType = propertyData.propertyType.trim();
  }
  
  // Clean HOA fees - remove non-numeric characters and convert to number
  if (propertyData.hoaFees) {
    cleanedData.hoaFees = Number(propertyData.hoaFees.toString().replace(/[^0-9.]/g, ''));
  }
  
  // Clean tax information - remove non-numeric characters and convert to number
  if (propertyData.taxInfo) {
    cleanedData.taxInfo = Number(propertyData.taxInfo.toString().replace(/[^0-9.]/g, ''));
  }
  
  return cleanedData;
};

/**
 * Extract property data from HTML content
 * @param {string} html - HTML content of the property page
 * @param {Object} selectors - CSS selectors for different property data fields
 * @returns {Object} - Extracted property data
 */
const extractPropertyData = (html, selectors) => {
  // This is a placeholder function
  // In a real implementation, this would use a library like cheerio to parse HTML
  // and extract data using the provided selectors
  
  console.log('Extracting property data from HTML...');
  console.log('HTML length:', html ? html.length : 0);
  console.log('Selectors:', selectors);
  
  // Return dummy data for now
  return {
    price: '$350,000',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    bedrooms: '3',
    bathrooms: '2',
    squareFootage: '1,500',
    yearBuilt: '2005',
    lotSize: '5,000',
    propertyType: 'Single Family',
    hoaFees: '$0',
    taxInfo: '$3,500'
  };
};

module.exports = {
  getRandomDelay,
  getRandomUserAgent,
  cleanPropertyData,
  extractPropertyData
};
