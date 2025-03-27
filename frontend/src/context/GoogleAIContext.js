import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Create a context for Google AI services
const GoogleAIContext = React.createContext();

// Provider component
export const GoogleAIProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get property insights
  const getPropertyInsights = async (propertyData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/property-insights', { propertyData });
      setLoading(false);
      return response.data.insights;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to get property insights');
      setLoading(false);
      throw error;
    }
  };

  // Get rental estimate
  const getRentalEstimate = async (propertyData, comparables) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/rental-estimate', { propertyData, comparables });
      setLoading(false);
      return response.data.rentalEstimate;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to get rental estimate');
      setLoading(false);
      throw error;
    }
  };

  // Get investment recommendations
  const getInvestmentRecommendations = async (userPreferences, availableProperties) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/investment-recommendations', { 
        userPreferences, 
        availableProperties 
      });
      setLoading(false);
      return response.data.recommendations;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to get investment recommendations');
      setLoading(false);
      throw error;
    }
  };

  // Get market analysis
  const getMarketAnalysis = async (location, marketData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/market-analysis', { location, marketData });
      setLoading(false);
      return response.data.analysis;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to get market analysis');
      setLoading(false);
      throw error;
    }
  };

  // Get cash flow improvements
  const getCashFlowImprovements = async (propertyData, financialData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/cash-flow-improvements', { 
        propertyData, 
        financialData 
      });
      setLoading(false);
      return response.data.improvements;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to get cash flow improvements');
      setLoading(false);
      throw error;
    }
  };

  // Create value object
  const value = {
    loading,
    error,
    getPropertyInsights,
    getRentalEstimate,
    getInvestmentRecommendations,
    getMarketAnalysis,
    getCashFlowImprovements
  };

  return (
    <GoogleAIContext.Provider value={value}>
      {children}
    </GoogleAIContext.Provider>
  );
};

// Custom hook to use the Google AI context
export const useGoogleAI = () => {
  const context = React.useContext(GoogleAIContext);
  if (context === undefined) {
    throw new Error('useGoogleAI must be used within a GoogleAIProvider');
  }
  return context;
};

export default GoogleAIContext;
