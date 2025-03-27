const mongoose = require('mongoose');
const { Pool } = require('pg');
const path = require('path'); // Import path module
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Specify path to .env

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/real-estate-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
const connectPostgreSQL = async () => {
  try {
    const client = await pgPool.connect();
    console.log('PostgreSQL Connected');
    client.release();
    return pgPool;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectMongoDB, connectPostgreSQL, pgPool };
