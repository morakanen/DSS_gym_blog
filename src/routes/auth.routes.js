import { Router } from 'express';
import { loginLimiter } from '../config/ratelimiter.js';
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
router.post('/register',loginLimiter, registerUser);

// Login
router.get('/login', showLoginForm);
router.post('/login', loginUser);

// 2FA
router.get('/auth/verify-2fa', show2FAForm);
router.post('/verify-2fa', verify2FA);

export default router;