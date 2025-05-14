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

    // ✅ Password check
    const passwordMatch = user && await comparePasswords(password, user.password);
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
  const { code } = req.body;
  const { tempUser, twoFACode, twoFAExpires } = req.session;

  if (!tempUser || !twoFACode || !twoFAExpires) {
    throw new Error('Session expired');
  }

  if (Date.now() > twoFAExpires) {
    throw new Error('2FA code expired');
  }

  if (code !== twoFACode) {
    throw new Error('Invalid 2FA code');
  }

  req.session.user = tempUser;
  delete req.session.tempUser;
  delete req.session.twoFACode;
  delete req.session.twoFAExpires;
};
