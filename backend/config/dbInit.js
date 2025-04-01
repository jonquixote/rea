// Database initialization script

const { Pool } = require('pg');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const {
  createPropertyTableSchema,
  createRentalEstimatesTableSchema,
  createInvestmentMetricsTableSchema,
  createPropertyExpensesTableSchema,
  createNeighborhoodDataTableSchema,
  initPostGIS
} = require('../models/postgresSchemas');

// Load environment variables
dotenv.config();

// PostgreSQL connection
const pgPool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'real_estate',
  password: process.env.PG_PASSWORD || 'postgres',
  port: process.env.PG_PORT || 5432,
});

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/real-estate-app';

// Initialize PostgreSQL schema using a provided client
const initPostgresSchema = async (client) => {
  // Removed client creation, as it's passed in
  try {
    console.log('Initializing PostgreSQL schema using provided client...');
    
    // Initialize PostGIS extension
    console.log('Initializing PostGIS extension...');
    await client.query(initPostGIS);
    
    // Create property table
    console.log('Creating properties table...');
    await client.query(createPropertyTableSchema);
    
    // Create rental estimates table
    console.log('Creating rental_estimates table...');
    await client.query(createRentalEstimatesTableSchema);
    
    // Create investment metrics table
    console.log('Creating investment_metrics table...');
    await client.query(createInvestmentMetricsTableSchema);
    
    // Create property expenses table
    console.log('Creating property_expenses table...');
    await client.query(createPropertyExpensesTableSchema);
    
    // Create neighborhood data table
    console.log('Creating neighborhood_data table...');
    await client.query(createNeighborhoodDataTableSchema);
    
    console.log('PostgreSQL schema initialized successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL schema:', error);
    throw error;
  } // Removed finally block, client release handled in db.js
};

// Initialize MongoDB connection
const initMongoDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

// Main initialization function
const initDatabase = async () => {
  // This main initDatabase function is now primarily for standalone execution
  // We'll use the exported initPostgresSchema directly in db.js
  const client = await pgPool.connect(); // Need a client for standalone execution
  try {
    await initPostgresSchema(client); // Pass the client
    await initMongoDB();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) client.release(); // Release client used for standalone execution
    pgPool.end(); // End the pool used for standalone execution
    mongoose.connection.close();
  }
};

// Run initialization if script is executed directly
if (require.main === module) {
  initDatabase();
}

// Export initPostgresSchema for use in db.js
module.exports = { initDatabase, initPostgresSchema, pgPool };
