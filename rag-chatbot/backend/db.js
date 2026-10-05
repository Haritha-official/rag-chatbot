// This file's only job: create ONE reusable connection pool to Postgres,
// and export it so every other file (routes, scripts) can share it
// instead of each opening its own connection.

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

// Quick sanity check you can run with: node db.js
if (process.argv[1] && process.argv[1].endsWith("db.js")) {
  const res = await pool.query("SELECT NOW()");
  console.log("Connected to Postgres. Server time:", res.rows[0].now);
  await pool.end();
}
