import { query } from '../utils/database.js';

export const testDatabase = async (req, res, next) => {
  try {
    const result = await query("SELECT NOW()");
    res.json({ 
      success: true, 
      message: "Connected to Railway PostgreSQL", 
      time: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
};