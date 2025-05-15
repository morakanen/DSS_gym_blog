import { prisma } from '../utils/database.js';
import { send2FACode } from './email.service.js';
import { verifyCaptcha } from './captcha.service.js';
import { hashPassword, comparePasswords } from '../utils/auth.js';
import { validateRegistration, validateLogin } from '../validators/auth.validator.js';

export const handleRegistration = async (body) => {
  validateRegistration(body);
  const { name, email, password } = body;
  const hashedPassword = await hashPassword(password);
  
  await prisma.users.create({
    data: { name, email, password: hashedPassword }
  });
};

// Artificial delay to prevent timing attacks
const addArtificialDelay = async () => {
  const MIN_DELAY = 1000; // 1 second minimum delay
  const RANDOM_DELAY = 500; // Up to 0.5 seconds additional random delay
  const delay = MIN_DELAY + Math.random() * RANDOM_DELAY;
  await new Promise(resolve => setTimeout(resolve, delay));
};

export const handleLogin = async (req, res, next) => {
  try {
    validateLogin(req.body);
    const { email, password, 'h-captcha-response': hcaptchaResponse } = req.body;

    // ✅ CAPTCHA verification
    const captchaValid = await verifyCaptcha(hcaptchaResponse);
    if (!captchaValid) {
      return res.status(401).render('login-error', {
        errorType: 'invalid-credentials' // Or use 'captcha-failed' if you want separate handling
      });
    }

    // ✅ User lookup
    const user = await prisma.users.findUnique({ where: { email } });

    // ✅ Password check with timing attack protection
    const startTime = Date.now();
    const passwordMatch = user && await comparePasswords(password, user.password);
    
    // Add artificial delay to prevent timing attacks
    await addArtificialDelay();
    
    if (!passwordMatch) {
      return res.status(401).render('login-error', {
        errorType: 'invalid-credentials'
      });
    }

    // ✅ Generate 2FA code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Session regeneration and 2FA setup
    req.session.regenerate(async (err) => {
      if (err) {
        return next(new Error('Session regeneration failed'));
      }

      req.session.tempUser = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      req.session.userId = user.id;
      req.session.twoFACode = code;
      req.session.twoFAExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

      await send2FACode(user.email, code);
      res.redirect('/auth/verify-2fa');
    });

  } catch (err) {
    // ✅ Validation or unexpected error
    console.error('Login error:', err);
    return res.status(401).render('login-error', {
      errorType: 'invalid-credentials'
    });
  }
};

export const handle2FAVerification = (req) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('--- Starting 2FA Verification ---');
      console.log('Request body:', req.body);
      
      const { code } = req.body;
      console.log('2FA Code from form:', code);
      
      console.log('Session ID:', req.sessionID);
      console.log('Session data before verification:', JSON.stringify(req.session, null, 2));
      
      const { tempUser, twoFACode, twoFAExpires } = req.session;

      console.log('2FA Verification - Session data:', {
        hasTempUser: !!tempUser,
        tempUser: tempUser ? { id: tempUser.id, email: tempUser.email } : null,
        hasTwoFACode: !!twoFACode,
        twoFACode: twoFACode,
        twoFAExpires: twoFAExpires ? new Date(twoFAExpires).toISOString() : null,
        currentTime: new Date().toISOString(),
        isExpired: twoFAExpires ? Date.now() > twoFAExpires : true
      });

      if (!tempUser || !twoFACode || !twoFAExpires) {
        throw new Error('Session expired or invalid');
      }

      if (Date.now() > twoFAExpires) {
        throw new Error('2FA code expired');
      }

      if (code !== twoFACode) {
        throw new Error('Invalid 2FA code');
      }

      // Set the user in session
      req.session.user = tempUser;
      req.session.userId = tempUser.id;
      
      // Clean up temporary 2FA data
      delete req.session.tempUser;
      delete req.session.twoFACode;
      delete req.session.twoFAExpires;

      // Save the session
      req.session.save((err) => {
        if (err) {
          console.error('Failed to save session after 2FA:', err);
          return reject(new Error('Failed to save session'));
        }
        console.log('2FA verification successful for user:', tempUser.email);
        resolve();
      });
    } catch (error) {
      console.error('2FA verification error:', error);
      reject(error);
    }
  });
};
