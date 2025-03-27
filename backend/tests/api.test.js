const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const { Pool } = require('pg');

// Mock the Google AI API
jest.mock('../utils/googleAIUtils', () => ({
  getPropertyInsights: jest.fn().mockResolvedValue('Mock AI insights for property'),
  getRentalEstimate: jest.fn().mockResolvedValue('Mock rental estimate'),
  getInvestmentRecommendations: jest.fn().mockResolvedValue('Mock investment recommendations'),
  getMarketAnalysis: jest.fn().mockResolvedValue('Mock market analysis'),
  getCashFlowImprovements: jest.fn().mockResolvedValue('Mock cash flow improvement suggestions')
}));

describe('API Routes', () => {
  // Test property routes
  describe('Property Routes', () => {
    test('GET /api/properties should return properties', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    test('GET /api/properties/:id should return a property', async () => {
      // First get a list of properties to get a valid ID
      const propertiesRes = await request(app).get('/api/properties');
      const propertyId = propertiesRes.body[0]?.id || '123'; // Use mock ID if no properties exist
      
      const res = await request(app).get(`/api/properties/${propertyId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('address');
    });

    test('GET /api/properties/top-investments should return top investment properties', async () => {
      const res = await request(app).get('/api/properties/top-investments');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  // Test metrics routes
  describe('Metrics Routes', () => {
    test('GET /api/metrics/calculate should calculate investment metrics', async () => {
      const res = await request(app).post('/api/metrics/calculate').send({
        price: 500000,
        estimatedRent: 3000,
        expenses: {
          propertyTax: 500,
          insurance: 150,
          maintenance: 250,
          propertyManagement: 300,
          vacancy: 150,
          other: 100
        }
      });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('rentToPrice');
      expect(res.body).toHaveProperty('cashFlow');
      expect(res.body).toHaveProperty('capRate');
    });

    test('GET /api/metrics/filter should filter properties by metrics', async () => {
      const res = await request(app).post('/api/metrics/filter').send({
        minRentToPrice: 0.005,
        minCashFlow: 500
      });
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  // Test rental routes
  describe('Rental Routes', () => {
    test('POST /api/rentals/estimate should estimate rental price', async () => {
      const res = await request(app).post('/api/rentals/estimate').send({
        address: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1500,
        propertyType: 'single_family',
        yearBuilt: 2010,
        features: ['Updated Kitchen', 'Hardwood Floors']
      });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('estimatedRent');
    });
  });

  // Test AI routes
  describe('AI Routes', () => {
    test('POST /api/ai/property-insights should return AI insights', async () => {
      const res = await request(app).post('/api/ai/property-insights').send({
        propertyId: '123',
        address: '123 Test St',
        city: 'San Francisco',
        price: 750000,
        estimatedRent: 4000
      });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('insights');
    });

    test('POST /api/ai/cash-flow-improvements should return improvement suggestions', async () => {
      const res = await request(app).post('/api/ai/cash-flow-improvements').send({
        propertyId: '123',
        price: 750000,
        estimatedRent: 4000,
        expenses: {
          propertyTax: 750,
          insurance: 200,
          maintenance: 300,
          propertyManagement: 320,
          vacancy: 200,
          other: 100
        }
      });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('improvements');
    });
  });

  // Close database connections after all tests
  afterAll(async () => {
    await mongoose.connection.close();
    const pgPool = new Pool();
    await pgPool.end();
  });
});
