// Script to train and evaluate the rental estimator model
const RentalEstimator = require('./rentalEstimator');
const { connectMongoDB } = require('../config/db');
const { RentalTrainingData } = require('../models/mongoSchemas');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize rental estimator
const rentalEstimator = new RentalEstimator();

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Main function to train and evaluate the model
async function trainAndEvaluateModel() {
  try {
    console.log('Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('Loading training data...');
    const trainingData = await rentalEstimator.loadTrainingData();
    
    if (trainingData.length === 0) {
      console.log('No training data found. Creating synthetic data for testing...');
      await createSyntheticData();
      console.log('Synthetic data created. Reloading training data...');
      await rentalEstimator.loadTrainingData();
    }
    
    console.log('Training model...');
    const trainingResult = await rentalEstimator.trainModel();
    console.log('Training result:', trainingResult);
    
    console.log('Evaluating model...');
    const evaluationResult = await rentalEstimator.evaluateModel();
    console.log('Evaluation result:', evaluationResult);
    
    // Test prediction on a sample property
    const sampleProperty = {
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1500,
      yearBuilt: 2010,
      propertyType: 'Single Family',
      city: 'San Francisco',
      state: 'CA'
    };
    
    console.log('Testing prediction on sample property:', sampleProperty);
    const prediction = await rentalEstimator.predict(sampleProperty);
    console.log('Prediction result:', prediction);
    
    console.log('Model training and evaluation completed successfully');
    return {
      trainingResult,
      evaluationResult,
      samplePrediction: prediction
    };
  } catch (error) {
    console.error('Error training and evaluating model:', error.message);
    throw error;
  } finally {
    // Close MongoDB connection
    process.exit(0);
  }
}

// Function to create synthetic training data for testing
async function createSyntheticData() {
  try {
    console.log('Creating synthetic training data...');
    
    // Define cities and states with their base rents
    const locations = [
      { city: 'San Francisco', state: 'CA', baseRent: 3000 },
      { city: 'New York', state: 'NY', baseRent: 3500 },
      { city: 'Chicago', state: 'IL', baseRent: 1800 },
      { city: 'Los Angeles', state: 'CA', baseRent: 2500 },
      { city: 'Austin', state: 'TX', baseRent: 1700 },
      { city: 'Seattle', state: 'WA', baseRent: 2200 },
      { city: 'Miami', state: 'FL', baseRent: 1900 },
      { city: 'Denver', state: 'CO', baseRent: 1800 },
      { city: 'Boston', state: 'MA', baseRent: 2800 },
      { city: 'Portland', state: 'OR', baseRent: 1700 }
    ];
    
    // Define property types
    const propertyTypes = [
      'Single Family',
      'Condo',
      'Townhouse',
      'Apartment',
      'Multi-Family'
    ];
    
    // Generate 100 synthetic data points
    const syntheticData = [];
    
    for (let i = 0; i < 100; i++) {
      // Randomly select location
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Randomly select property type
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      
      // Generate random property attributes
      const bedrooms = Math.floor(Math.random() * 4) + 1; // 1-5 bedrooms
      const bathrooms = Math.floor(Math.random() * 3) + 1; // 1-4 bathrooms
      const squareFootage = Math.floor(Math.random() * 1500) + 500; // 500-2000 sqft
      const yearBuilt = Math.floor(Math.random() * 50) + 1970; // 1970-2020
      
      // Calculate rent based on attributes
      let rent = location.baseRent;
      rent += bedrooms * 350;
      rent += bathrooms * 200;
      rent += squareFootage * 0.5;
      
      if (propertyType === 'Single Family') rent += 300;
      else if (propertyType === 'Condo') rent += 200;
      else if (propertyType === 'Townhouse') rent += 250;
      else if (propertyType === 'Multi-Family') rent += 400;
      
      if (yearBuilt >= 2010) rent += 300;
      else if (yearBuilt >= 2000) rent += 200;
      else if (yearBuilt >= 1990) rent += 100;
      else if (yearBuilt >= 1980) rent += 0;
      else if (yearBuilt >= 1970) rent -= 50;
      else rent -= 100;
      
      // Add some random variation
      rent += (Math.random() * 400) - 200; // -200 to +200
      
      // Create synthetic data point
      syntheticData.push({
        address: `${1000 + i} Main St`,
        city: location.city,
        state: location.state,
        zip: `${Math.floor(Math.random() * 90000) + 10000}`,
        bedrooms,
        bathrooms,
        squareFootage,
        propertyType,
        yearBuilt,
        amenities: [],
        actualRent: Math.round(rent),
        listingDate: new Date(),
        source: 'synthetic',
        metadata: {
          scrapedAt: new Date(),
          lastUpdated: new Date()
        }
      });
    }
    
    // Save synthetic data to MongoDB
    await RentalTrainingData.deleteMany({ source: 'synthetic' });
    await RentalTrainingData.insertMany(syntheticData);
    
    console.log(`Created and saved ${syntheticData.length} synthetic data points`);
    return syntheticData;
  } catch (error) {
    console.error('Error creating synthetic data:', error.message);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  trainAndEvaluateModel().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  trainAndEvaluateModel,
  createSyntheticData
};
