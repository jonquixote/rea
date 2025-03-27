// Simplified ML Rental Estimator
// Due to disk space constraints, this is a JavaScript implementation
// that simulates ML functionality with a rule-based approach

const fs = require('fs');
const path = require('path');
const { RentalTrainingData } = require('../models/mongoSchemas');

class RentalEstimator {
  constructor() {
    this.features = [
      'bedrooms',
      'bathrooms',
      'squareFootage',
      'yearBuilt',
      'propertyType',
      'location'
    ];
    
    this.locationFactors = {
      // City factors (higher values = higher rent)
      'San Francisco': 2.5,
      'New York': 2.7,
      'Los Angeles': 2.0,
      'Chicago': 1.7,
      'Boston': 2.1,
      'Seattle': 2.0,
      'Washington': 2.0,
      'Miami': 1.8,
      'Austin': 1.7,
      'Denver': 1.7,
      'Portland': 1.6,
      'San Diego': 1.9,
      
      // State factors (used as fallback)
      'CA': 1.8,
      'NY': 2.0,
      'IL': 1.5,
      'MA': 1.8,
      'WA': 1.7,
      'DC': 1.9,
      'FL': 1.5,
      'TX': 1.4,
      'CO': 1.5,
      'OR': 1.4
    };
    
    this.propertyTypeFactors = {
      'Single Family': 1.2,
      'Condo': 1.0,
      'Townhouse': 1.1,
      'Multi-Family': 1.3,
      'Apartment': 0.9
    };
    
    // Base rent by number of bedrooms (national average)
    this.bedroomBaseRent = {
      0: 800,   // Studio
      1: 1000,  // 1 bedroom
      2: 1300,  // 2 bedrooms
      3: 1700,  // 3 bedrooms
      4: 2200,  // 4 bedrooms
      5: 2800   // 5+ bedrooms
    };
    
    // Coefficients for our simplified model
    this.coefficients = {
      intercept: 500,
      bedroomCoef: 300,
      bathroomCoef: 200,
      sqftCoef: 0.5,
      yearBuiltCoef: 0.5
    };
    
    // Cache for training data
    this.trainingData = null;
  }
  
  /**
   * Load training data from MongoDB
   * @returns {Promise<Array>} - Array of rental training data
   */
  async loadTrainingData() {
    try {
      if (this.trainingData) {
        return this.trainingData;
      }
      
      console.log('Loading rental training data from MongoDB...');
      const data = await RentalTrainingData.find({}).lean();
      
      if (data.length === 0) {
        console.log('No training data found, using default model');
        return [];
      }
      
      console.log(`Loaded ${data.length} rental training data records`);
      this.trainingData = data;
      return data;
    } catch (error) {
      console.error('Error loading training data:', error.message);
      return [];
    }
  }
  
  /**
   * Save the model to a JSON file
   * @param {string} filePath - Path to save the model
   * @returns {Promise<boolean>} - Success status
   */
  async saveModel(filePath = path.join(__dirname, '../data/rental_model.json')) {
    try {
      // Create a simplified model representation
      const model = {
        coefficients: this.coefficients,
        locationFactors: this.locationFactors,
        propertyTypeFactors: this.propertyTypeFactors,
        bedroomBaseRent: this.bedroomBaseRent,
        features: this.features,
        timestamp: new Date().toISOString(),
        trainingDataSize: this.trainingData ? this.trainingData.length : 0
      };
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save model to file
      fs.writeFileSync(filePath, JSON.stringify(model, null, 2));
      console.log(`Model saved to ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error saving model:', error.message);
      return false;
    }
  }
  
  /**
   * Load the model from a JSON file
   * @param {string} filePath - Path to load the model from
   * @returns {Promise<boolean>} - Success status
   */
  async loadModel(filePath = path.join(__dirname, '../data/rental_model.json')) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log('Model file not found, using default model');
        return false;
      }
      
      const modelData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Update model parameters
      this.coefficients = modelData.coefficients || this.coefficients;
      this.locationFactors = modelData.locationFactors || this.locationFactors;
      this.propertyTypeFactors = modelData.propertyTypeFactors || this.propertyTypeFactors;
      this.bedroomBaseRent = modelData.bedroomBaseRent || this.bedroomBaseRent;
      this.features = modelData.features || this.features;
      
      console.log(`Model loaded from ${filePath}`);
      console.log(`Model was trained on ${modelData.trainingDataSize || 'unknown'} samples`);
      return true;
    } catch (error) {
      console.error('Error loading model:', error.message);
      return false;
    }
  }
  
  /**
   * Train the model using rental training data
   * @returns {Promise<Object>} - Training results
   */
  async trainModel() {
    try {
      const trainingData = await this.loadTrainingData();
      
      if (trainingData.length === 0) {
        console.log('No training data available, using default model');
        return {
          success: false,
          message: 'No training data available',
          model: {
            coefficients: this.coefficients,
            locationFactors: this.locationFactors,
            propertyTypeFactors: this.propertyTypeFactors
          }
        };
      }
      
      console.log(`Training model on ${trainingData.length} samples...`);
      
      // In a real ML implementation, we would use a regression algorithm
      // For this simplified version, we'll update our coefficients based on averages
      
      // Calculate average rent by bedrooms
      const rentByBedrooms = {};
      trainingData.forEach(item => {
        const bedrooms = item.bedrooms || 0;
        if (!rentByBedrooms[bedrooms]) {
          rentByBedrooms[bedrooms] = {
            sum: 0,
            count: 0
          };
        }
        rentByBedrooms[bedrooms].sum += item.actualRent;
        rentByBedrooms[bedrooms].count += 1;
      });
      
      // Update bedroom base rent
      Object.keys(rentByBedrooms).forEach(bedrooms => {
        const avg = rentByBedrooms[bedrooms].sum / rentByBedrooms[bedrooms].count;
        this.bedroomBaseRent[bedrooms] = Math.round(avg);
      });
      
      // Calculate average rent by location
      const rentByLocation = {};
      trainingData.forEach(item => {
        const city = item.city;
        const state = item.state;
        
        if (city && !rentByLocation[city]) {
          rentByLocation[city] = {
            sum: 0,
            count: 0
          };
        }
        
        if (state && !rentByLocation[state]) {
          rentByLocation[state] = {
            sum: 0,
            count: 0
          };
        }
        
        if (city) {
          rentByLocation[city].sum += item.actualRent;
          rentByLocation[city].count += 1;
        }
        
        if (state) {
          rentByLocation[state].sum += item.actualRent;
          rentByLocation[state].count += 1;
        }
      });
      
      // Update location factors
      Object.keys(rentByLocation).forEach(location => {
        if (rentByLocation[location].count >= 5) {
          const avgRent = rentByLocation[location].sum / rentByLocation[location].count;
          const nationalAvg = 1500; // Assumed national average rent
          this.locationFactors[location] = avgRent / nationalAvg;
        }
      });
      
      // Calculate average rent by property type
      const rentByPropertyType = {};
      trainingData.forEach(item => {
        const propertyType = item.propertyType;
        if (propertyType && !rentByPropertyType[propertyType]) {
          rentByPropertyType[propertyType] = {
            sum: 0,
            count: 0
          };
        }
        
        if (propertyType) {
          rentByPropertyType[propertyType].sum += item.actualRent;
          rentByPropertyType[propertyType].count += 1;
        }
      });
      
      // Update property type factors
      Object.keys(rentByPropertyType).forEach(propertyType => {
        if (rentByPropertyType[propertyType].count >= 5) {
          const avgRent = rentByPropertyType[propertyType].sum / rentByPropertyType[propertyType].count;
          const nationalAvg = 1500; // Assumed national average rent
          this.propertyTypeFactors[propertyType] = avgRent / nationalAvg;
        }
      });
      
      // Save the updated model
      await this.saveModel();
      
      return {
        success: true,
        message: `Model trained on ${trainingData.length} samples`,
        model: {
          coefficients: this.coefficients,
          locationFactors: this.locationFactors,
          propertyTypeFactors: this.propertyTypeFactors,
          bedroomBaseRent: this.bedroomBaseRent
        }
      };
    } catch (error) {
      console.error('Error training model:', error.message);
      return {
        success: false,
        message: `Error training model: ${error.message}`,
        model: null
      };
    }
  }
  
  /**
   * Predict rental price for a property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} - Prediction results
   */
  async predict(property) {
    try {
      // Load model if not already loaded
      await this.loadModel();
      
      // Extract features
      const bedrooms = property.bedrooms || 0;
      const bathrooms = property.bathrooms || 0;
      const squareFootage = property.squareFootage || 0;
      const yearBuilt = property.yearBuilt || 2000;
      const propertyType = property.propertyType || 'Apartment';
      
      // Extract location information
      let city = '';
      let state = '';
      
      if (property.city) {
        city = property.city;
      }
      
      if (property.state) {
        state = property.state;
      }
      
      if (property.location && !city && !state) {
        // Try to parse location string
        const locationParts = property.location.split(',').map(part => part.trim());
        if (locationParts.length >= 2) {
          city = locationParts[0];
          state = locationParts[locationParts.length - 1];
        }
      }
      
      // Get base rent by bedrooms
      let baseRent = this.bedroomBaseRent[bedrooms] || this.bedroomBaseRent[3]; // Default to 3 bedrooms if not found
      
      // Apply location factor
      let locationFactor = 1.0;
      if (this.locationFactors[city]) {
        locationFactor = this.locationFactors[city];
      } else if (this.locationFactors[state]) {
        locationFactor = this.locationFactors[state];
      }
      
      // Apply property type factor
      let propertyTypeFactor = 1.0;
      if (this.propertyTypeFactors[propertyType]) {
        propertyTypeFactor = this.propertyTypeFactors[propertyType];
      }
      
      // Calculate additional factors
      const bathroomFactor = bathrooms * this.coefficients.bathroomCoef;
      const sqftFactor = squareFootage * this.coefficients.sqftCoef;
      const yearBuiltFactor = (yearBuilt - 1950) * this.coefficients.yearBuiltCoef;
      
      // Calculate estimated rent
      let estimatedRent = baseRent * locationFactor * propertyTypeFactor;
      estimatedRent += bathroomFactor + sqftFactor + yearBuiltFactor;
      
      // Add some randomness to simulate real-world variation
      const randomFactor = Math.random() * 200 - 100; // -100 to +100
      const finalEstimate = Math.max(500, Math.round(estimatedRent + randomFactor));
      
      // Calculate confidence score based on available data
      let confidenceScore = 75; // Base confidence
      
      if (city && this.locationFactors[city]) confidenceScore += 5;
      if (state && this.locationFactors[state]) confidenceScore += 3;
      if (propertyType && this.propertyTypeFactors[propertyType]) confidenceScore += 5;
      if (yearBuilt) confidenceScore += 3;
      if (squareFootage > 0) confidenceScore += 4;
      
      // Cap confidence score at 95
      confidenceScore = Math.min(confidenceScore, 95);
      
      return {
        estimatedRent: finalEstimate,
        confidenceScore,
        method: 'simplified-ml',
        factors: {
          baseRent,
          locationFactor,
          propertyTypeFactor,
          bathroomFactor,
          sqftFactor,
          yearBuiltFactor
        }
      };
    } catch (error) {
      console.error('Error predicting rental price:', error.message);
      
      // Return a fallback estimate
      return {
        estimatedRent: property.price ? property.price * 0.008 : 1500, // 0.8% of property price as a fallback
        confidenceScore: 60,
        method: 'fallback',
        error: error.message
      };
    }
  }
  
  /**
   * Evaluate model performance on test data
   * @param {Array} testData - Test data array
   * @returns {Promise<Object>} - Evaluation results
   */
  async evaluateModel(testData) {
    try {
      if (!testData || testData.length === 0) {
        // If no test data provided, use 20% of training data
        const allData = await this.loadTrainingData();
        if (allData.length === 0) {
          return {
            success: false,
            message: 'No data available for evaluation',
            metrics: null
          };
        }
        
        // Shuffle and split data
        const shuffled = [...allData].sort(() => 0.5 - Math.random());
        const splitIndex = Math.floor(shuffled.length * 0.8);
        const trainData = shuffled.slice(0, splitIndex);
        testData = shuffled.slice(splitIndex);
        
        // Update training data and retrain
        this.trainingData = trainData;
        await this.trainModel();
      }
      
      console.log(`Evaluating model on ${testData.length} samples...`);
      
      // Make predictions on test data
      const predictions = [];
      let totalError = 0;
      let totalAbsError = 0;
      let totalSquaredError = 0;
      
      for (const item of testData) {
        const prediction = await this.predict(item);
        const actualRent = item.actualRent;
        const predictedRent = prediction.estimatedRent;
        const error = predictedRent - actualRent;
        
        predictions.push({
          actual: actualRent,
          predicted: predictedRent,
          error,
          percentError: (error / actualRent) * 100
        });
        
        totalError += error;
        totalAbsError += Math.abs(error);
        totalSquaredError += error * error;
      }
      
      // Calculate evaluation metrics
      const meanError = totalError / testData.length;
      const meanAbsError = totalAbsError / testData.length;
      const rootMeanSquaredError = Math.sqrt(totalSquaredError / testData.length);
      
      // Calculate R-squared
      const meanActual = testData.reduce((sum, item) => sum + item.actualRent, 0) / testData.length;
      const totalSS = testData.reduce((sum, item) => sum + Math.pow(item.actualRent - meanActual, 2), 0);
      const residualSS = totalSquaredError;
      const rSquared = 1 - (residualSS / totalSS);
      
      return {
        success: true,
        message: `Model evaluated on ${testData.length} samples`,
        metrics: {
          meanError,
          meanAbsError,
          rootMeanSquaredError,
          rSquared
        },
        predictions: predictions.slice(0, 10) // Return first 10 predictions as examples
      };
    } catch (error) {
      console.error('Error evaluating model:', error.message);
      return {
        success: false,
        message: `Error evaluating model: ${error.message}`,
        metrics: null
      };
    }
  }
}

module.exports = RentalEstimator;
