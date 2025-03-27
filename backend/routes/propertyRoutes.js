const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  getPropertiesByLocation,
  getTopInvestmentProperties,
  generateAIInsightsForProperty
} = require('../controllers/propertyController');

// @route   GET /api/properties
// @desc    Get all properties with pagination and filtering
// @access  Public
router.get('/', getProperties);

// @route   GET /api/properties/:id
// @desc    Get a single property by ID
// @access  Public
router.get('/:id', getPropertyById);

// @route   GET /api/properties/location/:location
// @desc    Get properties by location (city, state, or zip)
// @access  Public
router.get('/location/:location', getPropertiesByLocation);

// @route   GET /api/properties/investment/top
// @desc    Get top investment properties based on rent-to-price ratio
// @access  Public
router.get('/investment/top', getTopInvestmentProperties);

// @route   GET /api/properties/:id/insights
// @desc    Generate AI insights for a property
// @access  Public
router.get('/:id/insights', generateAIInsightsForProperty);

module.exports = router;
