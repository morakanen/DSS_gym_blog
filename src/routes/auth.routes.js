import { Router } from 'express';
import { loginLimiter, twoFactorLimiter } from '../middleware/rateLimit.js';
import {
  showRegisterForm,
  registerUser,
  showLoginForm,
  loginUser,
  show2FAForm,
  verify2FA
} from '../controllers/auth.controller.js';

console.log('auth routes registered');

const router = Router();

// Registration
router.get('/register', showRegisterForm);
router.post('/register', registerUser); // ❌ Don't rate-limit registration unless needed

// Login
router.get('/login', showLoginForm);
router.post('/login', loginLimiter, loginUser); // ✅ Apply limiter here

// 2FA
router.get('/auth/verify-2fa', show2FAForm);
router.post('/verify-2fa', twoFactorLimiter, verify2FA);

export default router;
