const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 🔴 PostgreSQL Connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "dustbin_db",
  password: "sql", // your password
  port: 5432,
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

// Routes

app.get("/", (req, res) => {
  res.send("Smart Dustbin Backend Running");
});

// 🔴 INSERT DATA INTO DATABASE
app.post("/data", async (req, res) => {
  try {
    let { bin_id, fill_percentage, battery } = req.body;

    // 🔴 FIX: Convert to numbers safely
    fill_percentage = Math.round(parseFloat(fill_percentage));
    battery = battery !== undefined ? Math.round(parseFloat(battery)) : null;

    // Validation
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

// 🔴 FETCH DATA FROM DATABASE
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
