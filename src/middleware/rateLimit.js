import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    errorType: 'rate-limit',
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('login-error', {
      errorType: 'rate-limit'
    });
  }
});

// Rate limiter for 2FA attempts
export const twoFactorLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts per window
  message: {
    errorType: 'rate-limit',
    message: 'Too many 2FA attempts. Please try again in 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('login-error', {
      errorType: 'rate-limit',
      message: 'Too many 2FA attempts. Please try again in 5 minutes.'
    });
  }
});
