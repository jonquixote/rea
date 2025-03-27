const express = require('express');
const router = express.Router();
const { 
  generatePropertyInsights, 
  generateRentalEstimate, 
  generateInvestmentRecommendations,
  generateMarketAnalysis,
  generateCashFlowImprovements
} = require('../utils/googleAIUtils');

// Get AI-powered property insights
router.post('/property-insights', async (req, res) => {
  try {
    const { propertyData } = req.body;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google AI API key not configured' 
      });
    }
    
    if (!propertyData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property data is required' 
      });
    }
    
    const insights = await generatePropertyInsights(apiKey, propertyData);
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error generating property insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate property insights',
      error: error.message
    });
  }
});

// Get AI-powered rental estimate
router.post('/rental-estimate', async (req, res) => {
  try {
    const { propertyData, comparables } = req.body;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google AI API key not configured' 
      });
    }
    
    if (!propertyData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property data is required' 
      });
    }
    
    const rentalEstimate = await generateRentalEstimate(apiKey, propertyData, comparables || []);
    
    res.json({
      success: true,
      rentalEstimate
    });
  } catch (error) {
    console.error('Error generating rental estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rental estimate',
      error: error.message
    });
  }
});

// Get AI-powered investment recommendations
router.post('/investment-recommendations', async (req, res) => {
  try {
    const { userPreferences, availableProperties } = req.body;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google AI API key not configured' 
      });
    }
    
    if (!userPreferences || !availableProperties) {
      return res.status(400).json({ 
        success: false, 
        message: 'User preferences and available properties are required' 
      });
    }
    
    const recommendations = await generateInvestmentRecommendations(
      apiKey, 
      userPreferences, 
      availableProperties
    );
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error generating investment recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate investment recommendations',
      error: error.message
    });
  }
});

// Get AI-powered market analysis
router.post('/market-analysis', async (req, res) => {
  try {
    const { location, marketData } = req.body;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google AI API key not configured' 
      });
    }
    
    if (!location || !marketData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location and market data are required' 
      });
    }
    
    const analysis = await generateMarketAnalysis(apiKey, location, marketData);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error generating market analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate market analysis',
      error: error.message
    });
  }
});

// Get AI-powered cash flow improvement suggestions
router.post('/cash-flow-improvements', async (req, res) => {
  try {
    const { propertyData, financialData } = req.body;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google AI API key not configured' 
      });
    }
    
    if (!propertyData || !financialData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property data and financial data are required' 
      });
    }
    
    const improvements = await generateCashFlowImprovements(
      apiKey, 
      propertyData, 
      financialData
    );
    
    res.json({
      success: true,
      improvements
    });
  } catch (error) {
    console.error('Error generating cash flow improvements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow improvements',
      error: error.message
    });
  }
});

module.exports = router;
