const dotenv = require('dotenv')
const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

const app = express();


// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
// Serve static files from public directory first
app.use(express.static('public'));

// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Needed for Railway-managed PostgreSQL
    },
});

app.get('/', (req, res) => {
    res.render('index');
  });
  
  app.get('/login', (req, res) => {
    res.render('login');
  });
  
  app.get('/register', (req, res) => {
    res.render('register');
  });
  
  app.listen(PORT, () => {
    console.log(`Gym website running at http://localhost:${PORT}`);
  });
