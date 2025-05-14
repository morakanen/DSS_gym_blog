import session from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

export const sessionConfig = session({
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'fallbackSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 60 * 1 // 1 hour
  }
});
