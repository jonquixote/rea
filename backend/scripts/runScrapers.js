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
    name: 'example-test', // Add a simple test case
    url: 'https://example.com',
    filters: {}, // No filters needed
    listingPrompt: 'Extract the main heading (h1) text from this page as json like {"heading": "text"}' // Simple prompt
  },
  {
    name: 'zillow',
    url: 'https://www.zillow.com/homes/for_sale/',
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
    url: 'https://www.realtor.com/realestateandhomes-search/',
    filters: {
      city: 'Chicago',
      state: 'IL',
      minPrice: 300000,
      maxPrice: 800000,
      bedrooms: 3,
      bathrooms: 2
    }
  }
];

const rentalSources = [
  {
    name: 'apartments',
    url: 'https://www.apartments.com/apartments/',
    filters: {
      city: 'San Francisco',
      state: 'CA',
      bedrooms: 2,
      bathrooms: 1
    }
  },
  {
    name: 'zillow-rentals',
    url: 'https://www.zillow.com/homes/for_rent/',
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
    try {
      console.log(`Running property scraping job for ${source.name}...`);
      const result = await scraperManager.runPropertyScrapingJob(source.name, source.url, source.filters);
      console.log(`Property scraping job for ${source.name} completed:`, result);
    } catch (error) {
      console.error(`Error running property scraping job for ${source.name}:`, error.message);
    }
  }
  
  console.log('All property scraping jobs completed');
}

// Run rental scraping jobs
async function runRentalScrapingJobs() {
  console.log('Starting rental scraping jobs...');
  
  for (const source of rentalSources) {
    try {
      console.log(`Running rental scraping job for ${source.name}...`);
      const result = await scraperManager.runRentalScrapingJob(source.name, source.url, source.filters);
      console.log(`Rental scraping job for ${source.name} completed:`, result);
    } catch (error) {
      console.error(`Error running rental scraping job for ${source.name}:`, error.message);
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
