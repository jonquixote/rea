const express = require('express');
const router = express.Router();
const {
  getRentalEstimate,
  estimateRentalPrice,
  saveRentalEstimate,
  getRentalTrainingData
} = require('../controllers/rentalController');

// @route   GET /api/rentals/estimate/:propertyId
// @desc    Get rental estimate for a property
// @access  Public
router.get('/estimate/:propertyId', getRentalEstimate);

// @route   POST /api/rentals/estimate
// @desc    Estimate rental price for a property (without saving)
// @access  Public
router.post('/estimate', estimateRentalPrice);

// @route   POST /api/rentals/estimate/:propertyId
// @desc    Save rental estimate for a property
// @access  Public
router.post('/estimate/:propertyId', saveRentalEstimate);

// @route   GET /api/rentals/training-data
// @desc    Get rental training data
// @access  Public
router.get('/training-data', getRentalTrainingData);

module.exports = router;
