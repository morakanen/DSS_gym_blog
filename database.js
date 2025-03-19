const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables

// Create a new PostgreSQL pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use environment variable for security
  ssl: {
    rejectUnauthorized: false // Required for Railway PostgreSQL
  }
});

// Test the database connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL Database'))
  .catch(err => console.error('❌ Connection Error:', err));

module.exports = pool;