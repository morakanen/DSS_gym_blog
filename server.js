import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import { query } from "./database.js"; // Using your own query wrapper from pg

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use cookie-parser
app.use(cookieParser());

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

// Middleware
app.set('view engine', 'pug');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

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

// Login user
app.post('/logininfo', async (req, res) => {
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

    req.session.regenerate(err => {
      if (err) {
        return res.status(500).send('Session regeneration failed');
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      // Session rotation every 30 minutes
      setInterval(() => {
        req.session.regenerate(err => {
          if (err) {
            console.error('Session rotation failed');
          } else {
            console.log('Session rotated successfully');
          }
        });
      }, 1000 * 60 * 30); // Rotate every 30 minutes

      res.send(`Welcome, ${user.name}!`);
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Something went wrong');
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
