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
  validateLogin(req.body);
  const { email, password, 'h-captcha-response': hcaptchaResponse } = req.body;

  if (!await verifyCaptcha(hcaptchaResponse)) {
    throw new Error('CAPTCHA verification failed');
  }

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || !await comparePasswords(password, user.password)) {
    throw new Error('Invalid email or password');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  req.session.regenerate(async (err) => {
    if (err) throw new Error('Session regeneration failed');
    
    req.session.tempUser = { id: user.id, name: user.name, email: user.email };
    req.session.twoFACode = code;
    req.session.twoFAExpires = Date.now() + 5 * 60 * 1000;
    
    await send2FACode(user.email, code);
    res.redirect('/auth/verify-2fa');
    
  });
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