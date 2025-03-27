import express from "express";
import session from "express-session";
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

// Handles form submission
app.post('/registerinfo', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    //encrypts password before storing
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

app.post('/logininfo', async (req,res)=>{
    const { email, password } = req.body;

    try {
      // Finds user by email
      const user = await prisma.users.findUnique({ where: { email } });
  
      if (!user) {
        return res.status(400).send('Invalid email or password');
      }
  
      // Compares passwords using bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).send('Invalid email or password');
      }
  
      
      res.send(`Welcome, ${user.name}!`);
      
     
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