import {
  handleRegistration,
  handleLogin,
  handle2FAVerification
} from '../services/auth.service.js';

export const showRegisterForm = (req, res) => res.render('register');
export const showLoginForm = (req, res) => res.render('login');
export const show2FAForm = (req, res) => res.render('verify-2fa');

export const registerUser = async (req, res, next) => {
  try {
    await handleRegistration(req.body);
    res.json({ success: true, message: 'Registration successful!' });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  console.log('loginUser function called');
  try {
    await handleLogin(req, res); // all error rendering is done inside handleLogin
  } catch (error) {
    next(error);
  }
};

export const verify2FA = async (req, res, next) => {
  try {
    await handle2FAVerification(req);
    res.send(`Welcome, ${req.session.user.name}! 2FA complete.`);
  } catch (error) {
    next(error);
  }
};
