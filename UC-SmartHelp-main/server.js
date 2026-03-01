const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uc_smarthelp',
});

app.post('/api/tickets', async (req, res) => {
  const { subject, description, department, sender_id } = req.body;
  if (!subject || !description || !department || !sender_id) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO tickets (subject, description, department, user_id, status) VALUES (?, ?, ?, ?, ?)',
      [subject, description, department, sender_id, 'pending']
    );
    res.status(201).json({ message: "Success", ticketId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Database Error", details: error.sqlMessage });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ id: user.id, role: user.role, fullName: user.full_name });
    } else res.status(401).json({ error: "Invalid" });
  } catch (error) { res.status(500).json({ error: "Error" }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend on port ${PORT}`));
