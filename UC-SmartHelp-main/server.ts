import express, { Request, Response } from 'express';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

console.log("Starting server...");
console.log("DB Config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
});

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uc_smarthelp',
});

// --- TICKETS ROUTE (FORCE AUTO-INCREMENT) ---
app.post('/api/tickets', async (req: Request, res: Response) => {
  const { subject, description, department, sender_id } = req.body;
  
  if (!subject || !description || !department || !sender_id) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Explicitly listing columns and NOT mentioning ticket_id
    const sql = 'INSERT INTO tickets (subject, description, department, user_id, status) VALUES (?, ?, ?, ?, ?)';
    const params = [subject, description, department, sender_id, 'pending'];
    
    console.log("DEBUG - Executing SQL:", sql, params);

    const [result] = await db.query<ResultSetHeader>(sql, params);

    res.status(201).json({ 
      message: "Success", 
      ticketId: result.insertId 
    });
  } catch (error: any) {
    console.error("SQL ERROR:", error);
    res.status(500).json({ 
      error: "Database Error", 
      details: error.sqlMessage || error.message,
      code: error.code
    });
  }
});

// (Rest of server.ts identical)
const formatUserResponse = (user: any) => ({
  id: user.id || user.userId || user.user_id,
  userId: user.id || user.userId || user.user_id,
  user_id: user.id || user.userId || user.user_id,
  role: user.role,
  firstName: user.first_name,
  lastName: user.last_name,
  fullName: user.full_name
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password)) res.json(formatUserResponse(user));
    else res.status(401).json({ error: "Invalid" });
  } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/google-auth', async (req: Request, res: Response) => {
  const { email, firstName, lastName } = req.body;
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    let user = rows[0];
    if (!user) {
      const [result] = await db.query<ResultSetHeader>('INSERT INTO users (full_name, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)', [`${firstName} ${lastName}`, email, 'GOOGLE_USER', 'student', firstName, lastName]);
      const [newRows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newRows[0];
    }
    res.json(formatUserResponse(user));
  } catch (error) { res.status(500).json({ error: "Auth Error" }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Ready! Backend on port ${PORT}`));
