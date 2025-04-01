const mongoose = require('mongoose');
const { Pool } = require('pg');
// const { initPostgresSchema } = require('./dbInit'); // Reverted: Remove import
// const path = require('path'); // Import path module - Not needed when relying on Docker Compose env vars
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Specify path to .env - Docker Compose injects env vars

// MongoDB Connection
const connectMongoDB = async () => {
  // Ensure MONGO_URI is provided by the environment (Docker Compose)
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI environment variable is not set.');
    process.exit(1);
  }
  try {
    // Connect using the environment variable ONLY. No fallback to localhost.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // Deprecated, but included for compatibility if needed
      useUnifiedTopology: true, // Deprecated, but included for compatibility if needed
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// PostgreSQL Connection with PostGIS
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI, // Use the connection URI
});

// Test PostgreSQL Connection
// Test PostgreSQL Connection
const connectPostgreSQL = async () => {
  try {
    const client = await pgPool.connect();
    console.log('PostgreSQL Connected');
    client.release(); // Release client after testing connection
    return pgPool;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  } 
  // Removed finally block as client release is handled in try block now
};

module.exports = { connectMongoDB, connectPostgreSQL, pgPool };
