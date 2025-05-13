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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],  // Allow Bootstrap JS
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],  // Allow inline styles and Bootstrap
      imgSrc: ["'self'", "https://images.unsplash.com", "data:"],  // Allow your images
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],  // Fonts from Bootstrap CDN
      objectSrc: ["'none'"],  // No Flash, Java, etc.
      upgradeInsecureRequests: []  // Forces HTTPS
    }
  }
}));
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
    if (!hcaptchaResponse) {
      return res.render('login', {
        error: 'Please complete the CAPTCHA verification',
        title: 'Login Page',
        email: email,
        hcaptchatoken: process.env.hcaptcha_token || 'YOUR_SITE_KEY'
      });
    }

    
    const verifyResult = await verify(process.env.hcaptcha_secret, hcaptchaResponse);
    if (!verifyResult.success) {
      return res.render('login', {
        error: 'CAPTCHA verification failed',
        title: 'Login Page',
        email: email,
        hcaptchatoken: process.env.hcaptcha_token || 'YOUR_SITE_KEY'
      });
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isMatch = bcrypt.compare(password, user.password);//removed await
    if (!isMatch) {
      return res.status(400).send('Invalid email or password');
    }

    req.session.regenerate(err => {
      if (err) return res.status(500).send('Session regeneration failed');

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      res.send(`Welcome, ${user.name}!`);
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Something went wrong');
  }
});


//email tool
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SMTP config
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendOTPEmail(to, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your 2FA Code',
    text: `Your verification code is: ${code}`
  });
}

//2FA authentication
function generateOTP() {
  return speakeasy.totp({
    secret: process.env.TWO_FA_SECRET || 'staticsecret',
    encoding: 'ascii',
    step: 300 // valid for 5 minutes
  })};

  function verifyOTP(token) {
    return speakeasy.totp.verify({
      secret: process.env.TWO_FA_SECRET || 'staticsecret',
      encoding: 'ascii',
      token,
      window: 1
    })};


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
