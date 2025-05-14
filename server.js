import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import { query } from "./database.js";
import nodemailer from "nodemailer"; // === 2FA EMAIL START ===

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 1000 * 60 * 60,
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('view engine', 'pug');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// === 2FA EMAIL START ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// === 2FA EMAIL END ===

app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// === 2FA EMAIL START ===
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
// === 2FA EMAIL END ===

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
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send('Invalid email or password');
    }

    // === 2FA EMAIL START ===
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.tempUser = { id: user.id, name: user.name, email: user.email };
    req.session.twoFACode = code;
    req.session.twoFAExpires = Date.now() + 5 * 60 * 1000;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your 2FA Code',
      text: `Your 2FA code is: ${code}`
    });

    return res.redirect('/verify-2fa');
    // === 2FA EMAIL END ===


  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Something went wrong');
  }
});

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
