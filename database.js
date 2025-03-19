const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables

console.log("🔍 Connecting to PostgreSQL at:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Railway public connections
  },
});

// Test the database connection
pool.connect()
  .then(() => console.log("✅ Connected to Railway PostgreSQL (Public Network)"))
  .catch((err) => {
    console.error("❌ Connection Error:", err);
    process.exit(1); // Exit if DB fails to connect
  });

module.exports = pool;