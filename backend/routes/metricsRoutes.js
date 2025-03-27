const express = require('express');
const router = express.Router();
const {
  calculateInvestmentMetrics,
  getPropertiesByInvestmentCriteria,
  getMetricsSummaryStats
} = require('../controllers/metricsController');

// @route   POST /api/metrics/calculate/:propertyId
// @desc    Calculate investment metrics for a property
// @access  Public
router.post('/calculate/:propertyId', calculateInvestmentMetrics);

// @route   GET /api/metrics/properties
// @desc    Get properties by investment criteria
// @access  Public
router.get('/properties', getPropertiesByInvestmentCriteria);

// @route   GET /api/metrics/summary
// @desc    Get investment metrics summary statistics
// @access  Public
router.get('/summary', getMetricsSummaryStats);

module.exports = router;
