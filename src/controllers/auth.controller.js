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

export const logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('sessionId');
    res.redirect('/login');
  });
};

export const verify2FA = async (req, res, next) => {
  try {
    console.log('--- verify2FA Controller ---');
    console.log('Session ID:', req.sessionID);
    
    await handle2FAVerification(req);
    
    console.log('2FA verification successful, redirecting to blog...');
    console.log('Session after verification:', JSON.stringify(req.session, null, 2));
    
    // Ensure session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session before redirect:', err);
        return next(err);
      }
      console.log('Session saved, redirecting to /blog');
      res.redirect('/blog');
    });
  } catch (error) {
    console.error('2FA verification error:', {
      message: error.message,
      stack: error.stack,
      session: req.session
    });
    
    // Render an error page or redirect back to 2FA with error
    res.status(400).render('verify-2fa', { 
      error: error.message,
      email: req.session.tempUser?.email 
    });
  }
};
