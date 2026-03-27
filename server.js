const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ CONNECT TO RAILWAY POSTGRES (NO LOCALHOST)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test DB connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB Connection Error:", err);
  } else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});

// ROUTES

app.get("/", (req, res) => {
  res.send("Smart Dustbin Backend Running");
});

// INSERT DATA
app.post("/data", async (req, res) => {
  try {
    let { bin_id, fill_percentage, battery } = req.body;

    fill_percentage = Math.round(parseFloat(fill_percentage));
    battery = battery !== undefined ? Math.round(parseFloat(battery)) : null;

    if (!bin_id || isNaN(fill_percentage)) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const query = `
      INSERT INTO dustbin_data (bin_id, fill_percentage, battery)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [bin_id, fill_percentage, battery];

    const result = await pool.query(query, values);

    console.log("📦 Data Inserted:", result.rows[0]);

    res.status(201).json({
      message: "Data stored successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Insert Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// FETCH DATA
app.get("/data", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM dustbin_data ORDER BY timestamp DESC LIMIT 50",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ CORRECT PORT FOR RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
