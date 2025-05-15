import session from 'express-session';

// Simple in-memory store for development
const MemoryStore = new session.MemoryStore();

export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
  resave: false,
  saveUninitialized: false,
  store: MemoryStore,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 1 // 1 hour
  }
};

export const sessionMiddleware = session(sessionConfig);
