const dotenv = require('dotenv')
const express = require("express");
const session = require("express-session");
const path = require("path");
const pool = require('../db');
const bodyParser = require("body-parser");

const app = express();


// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
// Serve static files from public directory first
app.use(express.static('public'));




app.get('/', (req, res) => {
    res.render('index');
  });
  
  app.get('/login', (req, res) => {
    res.render('login');
  });
  
  app.get('/register', (req, res) => {
    res.render('register');
  });

  //api routes
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      console.log('Contact form submission:', { name, email, message });
      res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
      console.error('Error processing contact form:', error);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  });
  
  app.listen(PORT, () => {
    console.log(`Gym website running at http://localhost:${PORT}`);
  });
