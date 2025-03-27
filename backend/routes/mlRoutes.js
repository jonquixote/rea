// API integration for the rental estimator
const express = require('express');
const router = express.Router();
const RentalEstimator = require('../scripts/rentalEstimator');
const { pgPool } = require('../config/db');

// Initialize rental estimator
const rentalEstimator = new RentalEstimator();

// Middleware to load the model
const loadModel = async (req, res, next) => {
  try {
    await rentalEstimator.loadModel();
    next();
  } catch (error) {
    console.error('Error loading rental estimator model:', error.message);
    next();
  }
};

// Apply middleware to all routes
router.use(loadModel);

// @route   POST /api/ml/estimate
// @desc    Get ML-based rental estimate for a property
// @access  Public
router.post('/estimate', async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Validate required fields
    if (!propertyData.bedrooms || !propertyData.bathrooms || !propertyData.squareFootage) {
      return res.status(400).json({
        success: false,
        error: 'Bedrooms, bathrooms, and square footage are required'
      });
    }
    
    // Get prediction from model
    const prediction = await rentalEstimator.predict(propertyData);
    
    res.status(200).json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error getting ML rental estimate:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST /api/ml/train
// @desc    Train the rental estimator model
// @access  Public
router.post('/train', async (req, res) => {
  try {
    // Train the model
    const result = await rentalEstimator.trainModel();
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error training rental estimator model:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST /api/ml/evaluate
// @desc    Evaluate the rental estimator model
// @access  Public
router.post('/evaluate', async (req, res) => {
  try {
    // Evaluate the model
    const result = await rentalEstimator.evaluateModel();
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error evaluating rental estimator model:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST /api/ml/estimate/:propertyId
// @desc    Get ML-based rental estimate for a property by ID and save it
// @access  Public
router.post('/estimate/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const propertyCheck = await pgPool.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    const property = propertyCheck.rows[0];
    
    // Prepare property data for prediction
    const propertyData = {
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.square_footage,
      yearBuilt: property.year_built,
      propertyType: property.property_type,
      city: property.city,
      state: property.state,
      zip: property.zip,
      price: property.price
    };
    
    // Get prediction from model
    const prediction = await rentalEstimator.predict(propertyData);
    
    // Save prediction to database
    const estimateCheck = await pgPool.query('SELECT id FROM rental_estimates WHERE property_id = $1', [propertyId]);
    
    let result;
    if (estimateCheck.rows.length > 0) {
      // Update existing estimate
      result = await pgPool.query(`
        UPDATE rental_estimates
        SET estimated_rent = $1,
            estimation_method = $2,
            confidence_score = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE property_id = $4
        RETURNING id
      `, [
        prediction.estimatedRent,
        prediction.method,
        prediction.confidenceScore,
        propertyId
      ]);
    } else {
      // Insert new estimate
      result = await pgPool.query(`
        INSERT INTO rental_estimates (
          property_id,
          estimated_rent,
          estimation_method,
          confidence_score
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        propertyId,
        prediction.estimatedRent,
        prediction.method,
        prediction.confidenceScore
      ]);
    }
    
    res.status(200).json({
      success: true,
      id: result.rows[0].id,
      propertyId,
      prediction
    });
  } catch (error) {
    console.error('Error getting and saving ML rental estimate:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;
