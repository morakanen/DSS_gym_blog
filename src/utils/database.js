import pg from 'pg'
import dotenv from 'dotenv';
import { PrismaClient } from "@prisma/client";
dotenv.config();


// Initialize Prisma Client
const prisma = new PrismaClient();


console.log("🔍 Connecting to PostgreSQL at:", process.env.DATABASE_URL);

const pool = new pg.Pool({
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

export const query = (text, params) => pool.query(text, params);

export { pool, prisma };