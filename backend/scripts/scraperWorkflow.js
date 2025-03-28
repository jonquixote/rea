// Scraper Workflow Manager
const PropertyScraper = require('./propertyScraper');
const RentalEstimatorScraper = require('./rentalScraper');
const { ScrapingJob } = require('../models/mongoSchemas');
const { calculateRentToPriceRatio, calculateSqftToPriceRatio, calculateMonthlyExpenses, calculateCashFlow } = require('../utils/metricsUtils');
const { pgPool, connectMongoDB } = require('../config/db'); // Import connectMongoDB
// const dotenv = require('dotenv'); // Redundant in Docker context

// Load environment variables - Redundant in Docker context
// dotenv.config();

/**
 * Scraper Workflow Manager Class
 * Manages the workflow of scraping property and rental data
 */
class ScraperWorkflowManager {
  constructor() {
    this.propertyScraper = new PropertyScraper();
    this.rentalScraper = new RentalEstimatorScraper();
    // Base template for consistent structure, especially for list-based extractions
    this.extractionTemplate = { 
      items: [] 
    };
    // Define headers to be used
    this.headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };
  }

  /**
   * Run a property scraping job
   * @param {string} source - Source website name (e.g., 'zillow', 'realtor')
   * @param {string} url - Base URL to scrape
   * @param {Object} filters - Search filters
   * @param {string} listingPrompt - The specific prompt for extracting listings
   * @returns {Promise<Object>} - Job results including success status and data/error
   */
  async runPropertyScrapingJob(source, url, filters = {}, listingPrompt) {
    console.log(`[DEBUG] Starting extraction for ${source}`);
    console.log(`[DEBUG] URL: ${url}`);
    console.log(`[DEBUG] Prompt length: ${listingPrompt?.length || 0}`);
    console.log(`[DEBUG] Using headers:`, this.headers); // Log headers being used

    let scrapingJob; // Define scrapingJob here to access in finally block if needed

    try {
      // Validate URL and prompt
      if (!url || !listingPrompt) {
        throw new Error('Missing required URL or prompt for property scraping job.');
      }

      // Ensure MongoDB is connected
      await connectMongoDB();

      // Create scraping job record
      scrapingJob = new ScrapingJob({
        jobType: 'property',
        status: 'in_progress',
        source,
        url,
        parameters: filters,
        startTime: new Date()
      });
      await scrapingJob.save();

      // Enhance the prompt with structure hints
      const enhancedPrompt = `
INSTRUCTIONS:
${listingPrompt}

REQUIREMENTS:
1. Return valid JSON only.
2. The top-level structure MUST contain an "items" array, even if empty.
3. Each object within the "items" array must have all the fields requested in the prompt (use null if a value cannot be found).
4. Ensure no additional text, comments, or markdown formatting surrounds the JSON output.

EXAMPLE OUTPUT (Structure):
${JSON.stringify(this.extractionTemplate, null, 2)}
      `;

      // Scrape property listings using the enhanced prompt and headers
      // Note: scrapeListings needs to accept 'headers' in its options object
      const listingsData = await this.propertyScraper.scrapeListings({
        source,
        url,
        filters,
        listingPrompt: enhancedPrompt,
        headers: this.headers // Pass headers here
      });

      console.log(`[DEBUG] Extraction result type: ${typeof listingsData}`);
      console.log(`[DEBUG] Extraction result (raw):`, listingsData);

      // Ensure the result has the expected structure (object with 'items' array)
      let finalData = this.extractionTemplate; // Default to empty template
      if (listingsData && typeof listingsData === 'object' && Array.isArray(listingsData.items)) {
          finalData = listingsData;
          console.log(`[DEBUG] Valid listing data structure received. Items count: ${finalData.items.length}`);
      } else {
          console.warn(`[DEBUG] Received unexpected data structure or null. Defaulting to empty template. Received:`, listingsData);
      }

      const listings = finalData.items; // Extract the array for processing

      // Initialize results counters
      let processedItems = 0;
      let successItems = 0;
      let failedItems = 0;

      // Process each listing (if any)
      for (const listing of listings) {
        // Basic check for a URL before proceeding
        if (!listing || !listing.url) {
            console.warn(`[DEBUG] Skipping listing due to missing URL:`, listing);
            failedItems++;
            continue;
        }
        try {
          processedItems++;
          // Scrape detailed property data (assuming scrapePropertyDetails exists and works)
          const propertyDetails = await this.propertyScraper.scrapePropertyDetails(listing.url);
          // Save property data (assuming savePropertyData exists and works)
          const savedProperty = await this.propertyScraper.savePropertyData(propertyDetails);
          // Get rental estimate (assuming estimateRental exists and works)
          const rentalEstimate = await this.estimateRental(savedProperty);
          // Save rental estimate (assuming saveRentalEstimate exists and works)
          await this.rentalScraper.saveRentalEstimate(
            savedProperty.pgPropertyId,
            rentalEstimate.estimatedRent,
            rentalEstimate.method,
            rentalEstimate.confidenceScore
          );
          // Calculate and save metrics (assuming calculateAndSaveMetrics exists and works)
          await this.calculateAndSaveMetrics(savedProperty.pgPropertyId, savedProperty, rentalEstimate.estimatedRent);
          successItems++;
        } catch (error) {
          console.error(`[DEBUG] Error processing individual property listing (${listing.url}): ${error.message}`, error.stack);
          failedItems++;
        }
      }

      // Update job status to completed
      scrapingJob.status = 'completed';
      scrapingJob.results = {
        totalItems: listings.length, // Count items from the extracted array
        processedItems,
        successItems,
        failedItems
      };
      scrapingJob.endTime = new Date();
      await scrapingJob.save();

      console.log(`Property scraping job completed: ${successItems} successful, ${failedItems} failed out of ${listings.length} potential listings.`);

      // Return structure indicating overall job success and the extracted data
      return {
        jobId: scrapingJob._id,
        status: 'completed',
        results: scrapingJob.results
        // Consider if returning 'finalData' itself is useful here
      };

    } catch (error) {
      console.error(`[DEBUG] Critical error running property scraping job for ${source}: ${error.message}`, error.stack);
      // Update job status to failed if the job record was created
      if (scrapingJob && scrapingJob._id) {
          await ScrapingJob.findByIdAndUpdate(scrapingJob._id, {
              status: 'failed',
              error: error.message,
              endTime: new Date()
          });
      }
      // Re-throw or return error structure
      // throw error; // Option 1: Re-throw
      return { // Option 2: Return error structure
          jobId: scrapingJob ? scrapingJob._id : null,
          status: 'failed',
          error: error.message
      };
    }
  }


  /**
   * Run a rental scraping job
   * @param {string} source - Source website (e.g., 'zillow', 'apartments')
   * @param {string} url - Base URL to scrape
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Job results
   */
  async runRentalScrapingJob(source, url, filters = {}) {
    console.log(`Starting rental scraping job from ${source}`);
    
    try {
      // Ensure MongoDB is connected for this script execution
      await connectMongoDB(); 

      // Create scraping job record
      const scrapingJob = new ScrapingJob({
        jobType: 'rental',
        status: 'in_progress',
        source,
        url,
        parameters: filters,
        startTime: new Date()
      });
      
      await scrapingJob.save();
      
      // Scrape rental listings
      const listings = await this.rentalScraper.scrapeRentalListings({ url, filters }); // Pass args as single object
      
      // Initialize results
      let processedItems = 0;
      let successItems = 0;
      let failedItems = 0;
      
      // Process each listing
      for (const listing of listings) {
        try {
          processedItems++;
          
          // Scrape detailed rental data
          const rentalDetails = await this.rentalScraper.scrapeRentalDetails(listing.url);
          
          // Save rental data to database for training
          await this.rentalScraper.saveRentalData(rentalDetails);
          
          successItems++;
        } catch (error) {
          console.error(`Error processing rental listing: ${error.message}`);
          failedItems++;
        }
      }
      
      // Update job status
      scrapingJob.status = 'completed';
      scrapingJob.results = {
        totalItems: listings.length,
        processedItems,
        successItems,
        failedItems
      };
      scrapingJob.endTime = new Date();
      
      await scrapingJob.save();
      
      console.log(`Rental scraping job completed: ${successItems} successful, ${failedItems} failed`);
      
      return {
        jobId: scrapingJob._id,
        status: 'completed',
        results: scrapingJob.results
      };
    } catch (error) {
      console.error(`Error running rental scraping job: ${error.message}`);
      
      // Update job status on error
      await ScrapingJob.findOneAndUpdate(
        { jobType: 'rental', source, url },
        {
          status: 'failed',
          error: error.message,
          endTime: new Date()
        }
      );
      
      throw error;
    }
  }

  /**
   * Estimate rental price for a property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} - Rental estimate
   */
  async estimateRental(property) {
    console.log(`Estimating rental price for property: ${property.address}`);
    
    try {
      // In a real implementation, this would use a trained ML model
      // For now, we'll use a simple formula based on property attributes
      
      // Base rent calculation
      let baseRent = 0;
      
      // Adjust base rent by location (zip code)
      if (['94102', '94103', '94104', '94105', '94107', '94108', '94109', '94110', '94111', '94112', '94114', '94115', '94116', '94117', '94118', '94121', '94122', '94123', '94124', '94127', '94129', '94130', '94131', '94132', '94133', '94134', '94158'].includes(property.zip)) {
        // San Francisco
        baseRent = 3000;
      } else if (['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10009', '10010', '10011', '10012', '10013', '10014', '10016', '10017', '10018', '10019', '10020', '10021', '10022', '10023', '10024', '10025', '10026', '10027', '10028', '10029', '10030', '10031', '10032', '10033', '10034', '10035', '10036', '10037', '10038', '10039', '10040', '10044', '10065', '10069', '10075', '10128', '10280', '10282'].includes(property.zip)) {
        // New York City
        baseRent = 3500;
      } else if (['90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008', '90010', '90011', '90012', '90013', '90014', '90015', '90016', '90017', '90018', '90019', '90020', '90021', '90023', '90024', '90025', '90026', '90027', '90028', '90029', '90031', '90032', '90033', '90034', '90035', '90036', '90037', '90038', '90039', '90041', '90042', '90043', '90044', '90045', '90046', '90047', '90048', '90049', '90056', '90057', '90058', '90059', '90061', '90062', '90063', '90064', '90065', '90066', '90067', '90068', '90069', '90071', '90077', '90089', '90090', '90094', '90095', '90210', '90212', '90230', '90232', '90245', '90247', '90248', '90272', '90290', '90291', '90292', '90293', '90402', '90405', '90501', '90502', '90710', '90717', '90731', '90732', '90744', '90745', '90810', '90813'].includes(property.zip)) {
        // Los Angeles
        baseRent = 2500;
      } else if (['60601', '60602', '60603', '60604', '60605', '60606', '60607', '60608', '60609', '60610', '60611', '60612', '60613', '60614', '60615', '60616', '60617', '60618', '60619', '60620', '60621', '60622', '60623', '60624', '60625', '60626', '60628', '60629', '60630', '60631', '60632', '60633', '60634', '60636', '60637', '60638', '60639', '60640', '60641', '60642', '60643', '60644', '60645', '60646', '60647', '60649', '60651', '60652', '60653', '60654', '60655', '60656', '60657', '60659', '60660', '60661', '60706', '60707', '60827'].includes(property.zip)) {
        // Chicago
        baseRent = 2000;
      } else {
        // Default for other areas
        baseRent = 1200;
      }
      
      // Adjust for property attributes
      const bedroomFactor = property.bedrooms * 350;
      const bathroomFactor = property.bathrooms * 200;
      const sqftFactor = property.squareFootage * 0.5;
      
      // Calculate estimated rent
      const estimatedRent = Math.round(baseRent + bedroomFactor + bathroomFactor + sqftFactor);
      
      // Add some randomness to simulate real-world variation
      const randomFactor = Math.random() * 200 - 100; // -100 to +100
      const finalEstimate = Math.max(500, Math.round(estimatedRent + randomFactor));
      
      console.log(`Estimated rental price: $${finalEstimate}`);
      
      return {
        estimatedRent: finalEstimate,
        method: 'formula-based',
        confidenceScore: 75 + Math.floor(Math.random() * 15) // 75-90
      };
    } catch (error) {
      console.error(`Error estimating rental price: ${error.message}`);
      
      // Return a fallback estimate
      return {
        estimatedRent: property.price * 0.008, // 0.8% of property price as a fallback
        method: 'price-percentage',
        confidenceScore: 60
      };
    }
  }

  /**
   * Calculate and save investment metrics for a property
   * @param {number} propertyId - PostgreSQL property ID
   * @param {Object} property - Property data
   * @param {number} estimatedRent - Estimated monthly rent
   * @returns {Promise<Object>} - Saved metrics
   */
  async calculateAndSaveMetrics(propertyId, property, estimatedRent) {
    console.log(`Calculating investment metrics for property ID: ${propertyId}`);
    
    try {
      // Calculate rent-to-price ratio
      const rentToPriceRatio = calculateRentToPriceRatio(estimatedRent, property.price);
      
      // Calculate square footage to price ratio
      const sqftToPriceRatio = calculateSqftToPriceRatio(property.squareFootage, property.price);
      
      // Estimate expenses
      const expenses = {
        propertyTax: property.taxInfo || property.price * 0.01, // 1% of property price if not available
        insurance: property.price * 0.0035, // 0.35% of property price
        maintenance: 1, // 1% of property value annually
        vacancy: 5, // 5% of rental income
        propertyManagement: 8, // 8% of rental income
        utilities: 0, // Assume tenant pays utilities
        hoa: property.hoaFees || 0
      };
      
      const estimatedMonthlyExpenses = calculateMonthlyExpenses(expenses, property.price, estimatedRent);
      
      // Calculate cash flow
      const cashFlow = calculateCashFlow(estimatedRent, estimatedMonthlyExpenses);
      
      // Start a PostgreSQL transaction
      const pgClient = await pgPool.connect();
      
      try {
        await pgClient.query('BEGIN');
        
        // Insert into PostgreSQL investment_metrics table
        const pgQuery = `
          INSERT INTO investment_metrics (
            property_id, rent_to_price_ratio, sqft_to_price_ratio,
            estimated_monthly_expenses, cash_flow
          ) VALUES (
            $1, $2, $3, $4, $5
          ) RETURNING id;
        `;
        
        const pgResult = await pgClient.query(pgQuery, [
          propertyId,
          rentToPriceRatio,
          sqftToPriceRatio,
          estimatedMonthlyExpenses,
          cashFlow
        ]);
        
        const metricsId = pgResult.rows[0].id;
        
        // Insert into property_expenses table
        const expensesQuery = `
          INSERT INTO property_expenses (
            property_id, property_tax, insurance, maintenance_percent,
            vacancy_percent, property_management_percent, utilities, hoa
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          ) RETURNING id;
        `;
        
        const expensesResult = await pgClient.query(expensesQuery, [
          propertyId,
          expenses.propertyTax,
          expenses.insurance,
          expenses.maintenance,
          expenses.vacancy,
          expenses.propertyManagement,
          expenses.utilities,
          expenses.hoa
        ]);
        
        const expensesId = expensesResult.rows[0].id;
        
        // Commit PostgreSQL transaction
        await pgClient.query('COMMIT');
        
        console.log(`Investment metrics saved successfully with ID: ${metricsId}`);
        
        return {
          metricsId,
          expensesId,
          rentToPriceRatio,
          sqftToPriceRatio,
          estimatedMonthlyExpenses,
          cashFlow
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
      console.error(`Error calculating and saving investment metrics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ScraperWorkflowManager;
