require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;


// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Needed for Railway-managed PostgreSQL
    },
});

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// API Route to test DB connection
app.get("/api/posts", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts");
        res.json(result.rows);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});


// Serve index.html for all routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
