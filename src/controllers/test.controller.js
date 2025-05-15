import { prisma } from '../utils/database.js';

export const testDatabase = async (req, res, next) => {
  try {
    // Use Prisma instead of raw query for better security
    const result = await prisma.$queryRaw`SELECT NOW()`;
    
    // Don't expose database details in production
    res.json({ 
      success: true, 
      message: process.env.NODE_ENV === 'development' 
        ? 'Connected to Railway PostgreSQL'
        : 'Database connection successful',
      time: result[0].now
    });
  } catch (error) {
    // Don't expose error details in production
    next(process.env.NODE_ENV === 'development' ? error : new Error('Internal server error'));
  }
};