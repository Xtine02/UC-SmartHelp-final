import express, { Request, Response } from 'express';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';

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

interface DBColumn extends RowDataPacket {
  Field: string;
}

interface User extends RowDataPacket {
  id: number;
  user_id?: number;
  ID?: number;
  userId?: number;
  role: string;
  department?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email: string;
  password?: string;
}

// Verify database connection
db.getConnection()
  .then(async (connection) => {
    try {
      // Auto-migration: Ensure necessary columns exist
      const [columns] = await connection.query<DBColumn[]>("SHOW COLUMNS FROM tickets");
      const columnNames = columns.map((c) => c.Field);
      
      if (!columnNames.includes('subject')) {
        await connection.query("ALTER TABLE tickets ADD COLUMN subject VARCHAR(255) NOT NULL DEFAULT 'No Subject'");
      }
      if (!columnNames.includes('department')) {
        await connection.query("ALTER TABLE tickets ADD COLUMN department VARCHAR(100)");
      }

      // Auto-migration: Ensure users table has department column
      const [userColumns] = await connection.query<DBColumn[]>("SHOW COLUMNS FROM users");
      const userColumnNames = userColumns.map((c) => c.Field);
      if (!userColumnNames.includes('department')) {
        await connection.query("ALTER TABLE users ADD COLUMN department VARCHAR(100)");
      }

      // Create ticket_responses table if not exists
      // Check if tickets table has 'id' or 'ticket_id' to use as foreign key
      const ticketRefColumn = columnNames.includes('id') ? 'id' : (columnNames.includes('ticket_id') ? 'ticket_id' : 'id');

      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_responses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          user_id INT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(${ticketRefColumn}),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Create reviews table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          is_helpful BOOLEAN NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
    } catch (err: unknown) {
      // Error suppressed
    }
    connection.release();
  })
  .catch((err: unknown) => {
    // Error suppressed
  });

const formatUserResponse = (user: User) => {
  const id = user.id ?? user.user_id ?? user.ID ?? user.userId;
  return {
    id: id,
    userId: id,
    user_id: id,
    role: user.role,
    department: user.department,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    fullName: `${user.first_name || user.firstName} ${user.last_name || user.lastName}`,
    email: user.email
  };
};

app.post('/api/register', async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [existing] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    let user;
    if (existing.length > 0) {
      await db.query('UPDATE users SET first_name = ?, last_name = ?, password = ? WHERE email = ?', [firstName, lastName, hashedPassword, email]);
      const [updated] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
      user = updated[0];
    } else {
      // Check if this is the first user
      const [userCount] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    const role = (userCount[0] as { count: number }).count === 0 ? 'admin' : 'student';
      
    await db.query<ResultSetHeader>('INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email, hashedPassword, role]);
    const [inserted] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    user = inserted[0];
  }
  res.status(201).json(formatUserResponse(user as User));
} catch (error: unknown) {
  res.status(500).json({ error: "Registration failed", details: error instanceof Error ? error.message : String(error) });
}
});

app.post('/api/login', async (req: Request, res: Response) => {
const { email, password } = req.body;
try {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  let isMatch = false;
  // Try bcrypt first
  if (user.password && user.password.startsWith('$2')) {
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e: unknown) {
      // Fallback to plain text comparison handled below
    }
  }

  // Fallback to plain text comparison
  if (!isMatch) {
    isMatch = (password === user.password);
  }

  if (isMatch) {
    res.json(formatUserResponse(user as User));
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
} catch (error: unknown) {
  res.status(500).json({ error: "Login error" });
}
});

app.post('/api/update-profile', async (req: Request, res: Response) => {
const { userId, firstName, lastName } = req.body;
if (!userId || !firstName || !lastName) {
  return res.status(400).json({ error: "Missing required fields" });
}
try {
  let pkName = '';
  // Determine PK column
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (rows.length > 0) pkName = 'user_id';
  } catch (e: unknown) {
    // Ignore if column doesn't exist
  }
  
  if (!pkName) {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows.length > 0) pkName = 'id';
    } catch (e: unknown) {
      // Ignore if column doesn't exist
    }
  }

  if (!pkName) return res.status(404).json({ error: "User not found" });

  await db.query(`UPDATE users SET first_name = ?, last_name = ? WHERE ${pkName} = ?`, [firstName, lastName, userId]);
  
  const [updated] = await db.query<RowDataPacket[]>(`SELECT * FROM users WHERE ${pkName} = ?`, [userId]);
  res.json(formatUserResponse(updated[0] as User));
} catch (error: unknown) {
  res.status(500).json({ error: "Server error" });
}
});

app.post('/api/change-password', async (req: Request, res: Response) => {
const { userId, oldPassword, newPassword } = req.body;
if (!userId || !oldPassword || !newPassword) {
  return res.status(400).json({ error: "Missing required fields" });
}
try {
  let user: User | null = null;
  let pkName = '';
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (rows.length > 0) { user = rows[0] as User; pkName = 'user_id'; }
  } catch (e: unknown) {
    // Ignore if column doesn't exist
  }
  if (!user) {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows.length > 0) { user = rows[0] as User; pkName = 'id'; }
    } catch (e: unknown) {
      // Ignore if column doesn't exist
    }
  }
  if (!user) return res.status(404).json({ error: "User not found" });
  const isMatch = await bcrypt.compare(oldPassword, user.password || '');
  if (!isMatch) return res.status(401).json({ error: "Incorrect old password" });
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await db.query(`UPDATE users SET password = ? WHERE ${pkName} = ?`, [hashedNewPassword, userId]);
  res.json({ message: "Password updated successfully" });
} catch (error: unknown) {
  res.status(500).json({ error: "Server error" });
}
});

app.post('/api/google-auth', async (req: Request, res: Response) => {
const { email, firstName, lastName } = req.body;
try {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
  let user = rows[0];
  if (!user) {
    await db.query<ResultSetHeader>('INSERT INTO users (first_name, last_name, email, role) VALUES (?, ?, ?, ?)', [firstName, lastName, email, 'student']);
    const [inserted] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    user = inserted[0];
  }
  res.json(formatUserResponse(user as User));
} catch (error: unknown) {
  res.status(500).json({ error: "Auth Error" });
}
});

app.post('/api/tickets', async (req: Request, res: Response) => {
const { subject, description, department, sender_id } = req.body;
if (!subject || !description || !department || !sender_id) {
  return res.status(400).json({ error: "Missing required fields." });
}
try {
  const userId = parseInt(sender_id.toString());
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid sender_id. Must be a number." });
  }
  
  const [columns] = await db.query<DBColumn[]>("SHOW COLUMNS FROM tickets");
  const columnNames = columns.map((c) => c.Field);
  
  const query = 'INSERT INTO tickets (subject, description, department, user_id, status) VALUES (?, ?, ?, ?, ?)';
  const params = [subject, description, department, userId, 'pending'];

  const [result] = await db.execute<ResultSetHeader>(query, params);
  res.status(201).json({ message: "Success", ticketId: result.insertId });
} catch (error: unknown) {
  res.status(500).json({ error: "Database Error", details: error instanceof Error ? error.message : String(error) });
}
});

app.get('/api/tickets', async (req: Request, res: Response) => {
const { user_id, department } = req.query;

try {
  // 1. Identify the user and their actual role
  let actualRole = 'student';
  let detectedUserPk = 'id';
  
  const [userCols] = await db.query<DBColumn[]>("SHOW COLUMNS FROM users");
  detectedUserPk = userCols.find((c) => c.Field.toLowerCase() === 'id' || c.Field.toLowerCase() === 'user_id')?.Field || 'id';

  if (user_id) {
    const [userRows] = await db.query<RowDataPacket[]>(`SELECT role FROM users WHERE ${detectedUserPk} = ?`, [user_id]);
    if (userRows.length > 0) {
      actualRole = userRows[0].role.toLowerCase();
    }
  }

  const isStaffOrAdmin = actualRole === 'admin' || actualRole === 'staff';

  // 2. Determine ticket primary key
  const [ticketCols] = await db.query<DBColumn[]>("SHOW COLUMNS FROM tickets");
  const ticketColNames = ticketCols.map((c) => c.Field);
  const ticketPk = ticketColNames.includes('id') ? 'id' : (ticketColNames.includes('ticket_id') ? 'ticket_id' : 'id');
  const hasTicketNumber = ticketColNames.includes('ticket_number');

  let selectClause = `t.*, t.${ticketPk} as id`;
  if (!hasTicketNumber) {
    selectClause += `, t.${ticketPk} as ticket_number`;
  }

  // 3. Build query with strict server-side filtering
  let query = `
    SELECT ${selectClause}, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) AS full_name 
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.${detectedUserPk}
  `;
  
  const params: unknown[] = [];
  let whereAdded = false;

  if (isStaffOrAdmin && department) {
    // Staff/Admin requesting specific department tickets (Dashboard mode)
    query += ` WHERE (t.department = ? OR t.department LIKE ?)`;
    params.push(department, `%${department}%`);
    whereAdded = true;
  } else if (user_id) {
    // Default mode: Everyone (including students) sees ONLY their own tickets
    query += ` WHERE t.user_id = ?`;
    params.push(user_id);
    whereAdded = true;
  }

  if (!whereAdded) {
    // Safety fallback: if no user_id or authorized dept, return nothing
    return res.json([]);
  }

  query += ' ORDER BY t.created_at DESC';
  
  const [rows] = await db.query<RowDataPacket[]>(query, params);
  
  const normalizedRows = rows.map((r) => ({
    ...r,
    status: r.status?.toString().toLowerCase().trim().replace(/\s+/g, '_') || 'pending'
  }));
  
  res.json(normalizedRows);
} catch (error: unknown) {
  console.error("Database Error in GET /api/tickets:", error);
  res.status(500).json({ error: "Error fetching tickets" });
}
});

app.get('/api/tickets/:id/responses', async (req: Request, res: Response) => {
const { id } = req.params;
try {
  const [userCols] = await db.query<DBColumn[]>("SHOW COLUMNS FROM users");
  const userPk = userCols.find((c) => c.Field.toLowerCase() === 'id' || c.Field.toLowerCase() === 'user_id')?.Field || 'id';

  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT tr.*, u.first_name, u.last_name, u.role
    FROM ticket_responses tr
    JOIN users u ON tr.user_id = u.${userPk}
    WHERE tr.ticket_id = ?
    ORDER BY tr.created_at ASC
  `, [id]);
  res.json(rows);
} catch (error: unknown) {
  res.status(500).json({ error: "Error fetching responses", details: error instanceof Error ? error.message : String(error) });
}
});

app.post('/api/tickets/:id/responses', async (req: Request, res: Response) => {
const { id } = req.params;
const { user_id, message } = req.body;
if (!user_id || !message) return res.status(400).json({ error: "Missing fields" });
try {
  await db.execute('INSERT INTO ticket_responses (ticket_id, user_id, message) VALUES (?, ?, ?)', [id, user_id, message]);
  res.status(201).json({ message: "Response saved" });
} catch (error: unknown) {
  res.status(500).json({ error: "Error saving response", details: error instanceof Error ? error.message : String(error) });
}
});

app.post('/api/reviews', async (req: Request, res: Response) => {
const { user_id, is_helpful, comment } = req.body;
try {
  await db.execute('INSERT INTO reviews (user_id, is_helpful, comment) VALUES (?, ?, ?)', [user_id || null, is_helpful, comment || null]);
  res.status(201).json({ message: "Review saved" });
} catch (error: unknown) {
  res.status(500).json({ error: "Error saving review", details: error instanceof Error ? error.message : String(error) });
}
});

app.patch('/api/tickets/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Missing status" });
  
  try {
    const [ticketCols] = await db.query<DBColumn[]>("SHOW COLUMNS FROM tickets");
    const pkName = ticketCols.find((c) => c.Field.toLowerCase() === 'id' || c.Field.toLowerCase() === 'ticket_id')?.Field || 'id';

    // Business Rule: Cannot revert to pending if it's already in_progress or resolved
    if (status === 'pending') {
      const [current] = await db.query<RowDataPacket[]>(`SELECT status FROM tickets WHERE ${pkName} = ?`, [id]);
      if (current.length > 0 && current[0].status !== 'pending') {
        return res.status(400).json({ error: "Ticket is already processed and cannot return to pending status." });
      }
    }

    await db.execute(`UPDATE tickets SET status = ? WHERE ${pkName} = ?`, [status, id]);
    res.json({ message: "Status updated successfully" });
  } catch (error: unknown) {
    res.status(500).json({ error: "Error updating status", details: error instanceof Error ? error.message : String(error) });
  }
});

// New Specialized Endpoint for Opening a Ticket
app.patch('/api/tickets/:id/open', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [ticketCols] = await db.query<DBColumn[]>("SHOW COLUMNS FROM tickets");
    const pkName = ticketCols.find((c) => c.Field.toLowerCase() === 'id' || c.Field.toLowerCase() === 'ticket_id')?.Field || 'id';

    // SQL Query: Only update if current status is 'pending'
    const query = `UPDATE tickets SET status = 'in_progress', acknowledge_at = CURRENT_TIMESTAMP WHERE ${pkName} = ? AND status = 'pending'`;
    const [result] = await db.execute<ResultSetHeader>(query, [id]);

    // Fetch the latest state
    const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM tickets WHERE ${pkName} = ?`, [id]);
    
    res.json({ 
      success: true, 
      updated: result.affectedRows > 0,
      ticket: rows[0] 
    });
  } catch (error: unknown) {
    console.error("Error opening ticket:", error);
    res.status(500).json({ error: "Failed to open ticket" });
  }
});

app.delete('/api/tickets/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Attempting to delete ticket ID: ${id}`);
  try {
    const [ticketCols] = await db.query<DBColumn[]>("SHOW COLUMNS FROM tickets");
    const pkName = ticketCols.find((c) => c.Field.toLowerCase() === 'id' || c.Field.toLowerCase() === 'ticket_id')?.Field || 'id';

    // 1. Delete associated responses/messages
    await db.query('DELETE FROM ticket_responses WHERE ticket_id = ?', [id]);
    
    // 2. Delete associated reviews if the column exists
    try {
      await db.query('DELETE FROM reviews WHERE ticket_id = ?', [id]);
    } catch (e) {
      // Ignore if reviews doesn't have ticket_id
    }

    // 3. Delete the ticket itself
    const [result] = await db.query<ResultSetHeader>(`DELETE FROM tickets WHERE ${pkName} = ?`, [id]);
    
    if (result.affectedRows === 0) {
      console.warn(`Ticket with ${pkName}=${id} not found.`);
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    console.log(`Ticket ${id} deleted successfully.`);
    res.json({ message: "Ticket deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ 
      error: "Error deleting ticket", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.get('/api/users', async (req: Request, res: Response) => {
try {
  const [rows] = await db.query<RowDataPacket[]>('SELECT id, first_name, last_name, email, role, department FROM users');
  res.json(rows);
} catch (error: unknown) {
  res.status(500).json({ error: "Error fetching users" });
}
});

app.patch('/api/users/:id', async (req: Request, res: Response) => {
const { id } = req.params;
const { role, department } = req.body;
try {
  await db.execute('UPDATE users SET role = ?, department = ? WHERE id = ?', [role, department || null, id]);
  res.json({ message: "User updated" });
} catch (error: unknown) {
  res.status(500).json({ error: "Error updating user" });
}
});

const PORT = 3000;
app.listen(PORT, () => console.log(`server is running in port 3000`));

