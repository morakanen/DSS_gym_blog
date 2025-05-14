import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit"; // New: rate limiting middleware
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import { query } from "./database.js"; // Using your own query wrapper from pg
import {verify} from "hcaptcha";
import nodemailer from "nodemailer";
import speakeasy from "speakeasy";
import csurf from 'csurf';
import helmet from 'helmet';




dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//  Set a Content Security Policy to reduce XSS risk


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://www.google.com",
        "https://www.gstatic.com",
        "https://cdn.gingersoftware.com",
        "https://js.hcaptcha.com", // Add hCaptcha
      ],
      // Optional: If you also need frame-src for hCaptcha's iframe
      frameSrc: ["'self'", "https://hcaptcha.com", "https://*.hcaptcha.com"],
    },
  })
);
//anthony needs to test on actual browser

// Use cookie-parser
app.use(cookieParser());
// csurf' middleware generates a unique token per session,
const csrfProtection = csurf({ cookie: true }); // Enable token-based CSRF using cookies



// Set up session middleware with security settings
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key', // Secret key for session encryption
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,              // Can't be accessed via JavaScript
    secure: process.env.NODE_ENV === 'production',  // Only use cookies over HTTPS in production
    sameSite: 'Lax',             // Prevent CSRF attacks
    maxAge: 1000 * 60 * 60,      // Session expiration in 1 hour
  }
}));

// Set up a rate limiter for the login route (15 minutes window, max 5 attempts per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: "Too many login attempts, please try again after 15 minutes.",
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false,  
});

// Middleware
app.set('view engine', 'pug');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const hcaptcha_token= process.env.hcaptcha_token;
const hcaptcha_secret=process.env.hcaptcha_secret;



/// 2FA

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.get('/verify-2fa', (req, res) => {
  if (!req.session.tempUser) return res.redirect('/login');
  res.render('verify-2fa');
});

app.post('/verify-2fa', (req, res) => {
  const { code } = req.body;
  const { tempUser, twoFACode, twoFAExpires } = req.session;

  if (!tempUser || !twoFACode || !twoFAExpires) {
    return res.redirect('/login');
  }

  if (Date.now() > twoFAExpires) {
    return res.status(401).send("2FA code expired. Please log in again.");
  }

  if (code !== twoFACode) {
    return res.status(401).send("Invalid 2FA code.");
  }

  req.session.user = tempUser;
  delete req.session.tempUser;
  delete req.session.twoFACode;
  delete req.session.twoFAExpires;

  res.send(`Welcome, ${req.session.user.name}! 2FA complete.`);
});

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Register user
app.post('/registerinfo', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    res.json({ success: true, message: 'Registration successful!' });
  } catch (error) {
    console.error('Error processing registration:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/logininfo', loginLimiter, async (req, res) => {
  const { email, password, 'h-captcha-response': hcaptchaResponse } = req.body;

  try {
    // CAPTCHA verification
    if (!hcaptchaResponse) {
      return res.render('login', {
        error: 'Please complete the CAPTCHA verification',
        title: 'Login Page',
        email: email,
        hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
      });
    }

    const verifyResult = await verify(process.env.HCAPTCHA_SECRET, hcaptchaResponse);
    if (!verifyResult.success) {
      return res.render('login', {
        error: 'CAPTCHA verification failed',
        title: 'Login Page',
        email: email,
        hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
      });
    }

    // User verification
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.render('login', {
        error: 'Invalid email or password',
        title: 'Login Page',
        email: email,
        hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
      });
    }

    // Password verification
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        error: 'Invalid email or password',
        title: 'Login Page',
        email: email,
        hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
      });
    }

    // Generate 2FA code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Regenerate session before storing sensitive data
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.render('login', {
          error: 'Login failed. Please try again.',
          title: 'Login Page',
          email: email,
          hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
        });
      }

      // Store temp user and 2FA data in the NEW session
      req.session.tempUser = { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      };
      req.session.twoFACode = code;
      req.session.twoFAExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

      // Send 2FA email
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Your 2FA Code',
          text: `Your 2FA code is: ${code}`,
          html: `<p>Your 2FA code is: <strong>${code}</strong></p>`
        });

        return res.redirect('/verify-2fa');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        return res.render('login', {
          error: 'Error sending 2FA code. Please try again.',
          title: 'Login Page',
          email: email,
          hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
        });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.render('login', {
      error: 'An unexpected error occurred. Please try again.',
      title: 'Login Page',
      email: email,
      hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
    });
  }
});



// Test Database
app.get("/test-db", async (req, res) => {
  try {
    const result = await query("SELECT NOW()");
    res.json({ success: true, message: "Connected to Railway PostgreSQL", time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Gym website running at http://localhost:${PORT}`);
});
