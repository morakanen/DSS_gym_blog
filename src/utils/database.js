import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma Client with logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test the database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

// Test the connection when this module is imported
testConnection().catch(console.error);

// Handle process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };