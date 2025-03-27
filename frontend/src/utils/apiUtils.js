import React from 'react';
import axios from 'axios';

// Create a custom axios instance with error handling
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
api.interceptors.request.use(
  config => {
    // You can add authentication tokens here if needed
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle different error types
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('Response error:', error.response.status, error.response.data);
      
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized access');
          // Handle authentication errors
          break;
        case 404:
          console.error('Resource not found');
          // Handle not found errors
          break;
        case 500:
          console.error('Server error');
          // Handle server errors
          break;
        default:
          console.error('API error:', error.response.status);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received');
    } else {
      // Error in setting up the request
      console.error('Request configuration error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API utility functions
const apiUtils = {
  // Properties
  getProperties: (params) => api.get('/properties', { params }),
  getPropertyById: (id) => api.get(`/properties/${id}`),
  searchProperties: (searchTerm) => api.get('/properties/search', { params: { q: searchTerm } }),
  
  // Metrics
  getInvestmentMetrics: (propertyId) => api.get(`/metrics/property/${propertyId}`),
  calculateMetrics: (propertyData) => api.post('/metrics/calculate', propertyData),
  
  // Rentals
  getRentalEstimate: (propertyData) => api.post('/rentals/estimate', propertyData),
  getComparableRentals: (propertyId) => api.get(`/rentals/comparables/${propertyId}`),
  
  // AI
  getPropertyInsights: (propertyData) => api.post('/ai/property-insights', propertyData),
  getCashFlowImprovements: (propertyData) => api.post('/ai/cash-flow-improvements', propertyData),
  getMarketAnalysis: (location) => api.post('/ai/market-analysis', { location }),
  
  // Map
  getPropertiesInBounds: (bounds) => api.post('/properties/in-bounds', bounds),
  getHeatmapData: (metric, bounds) => api.post('/properties/heatmap', { metric, bounds })
};

export default apiUtils;
