import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import crypto from "crypto";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
const db = new Database(path.join(dbDir, 'app.db'));

try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT UNIQUE");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN is_mentor INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN hide_location INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN hide_history INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE threads ADD COLUMN is_flagged INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE replies ADD COLUMN is_flagged INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE kites ADD COLUMN is_read INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE kites ADD COLUMN read_at DATETIME");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    facility TEXT,
    location TEXT,
    bio TEXT,
    avatar_url TEXT
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id TEXT,
    expires_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS mentorships (
    id TEXT PRIMARY KEY,
    mentor_id TEXT,
    mentee_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, active, completed, declined
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(mentor_id) REFERENCES users(id),
    FOREIGN KEY(mentee_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    category TEXT,
    file_name TEXT,
    file_type TEXT,
    file_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    is_felony_friendly INTEGER DEFAULT 1,
    posted_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(posted_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS housing (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    location TEXT,
    contact_info TEXT,
    description TEXT,
    posted_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(posted_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS kites (
    id TEXT PRIMARY KEY,
    sender_id TEXT,
    receiver_id TEXT,
    content TEXT,
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS parole_officers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    agency TEXT,
    phone TEXT,
    district TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    author_id TEXT,
    title TEXT,
    content TEXT,
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY,
    thread_id TEXT,
    author_id TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES threads(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    content TEXT,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    company TEXT,
    position TEXT,
    date_applied TEXT,
    status TEXT DEFAULT 'applied',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS legal_cases (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    case_number TEXT,
    court TEXT,
    status TEXT,
    next_hearing_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS moderation_logs (
    id TEXT PRIMARY KEY,
    moderator_id TEXT,
    action TEXT,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(moderator_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    requester_id TEXT,
    receiver_id TEXT,
    status TEXT DEFAULT 'connected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(requester_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id),
    UNIQUE(requester_id, receiver_id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(" ")[1];
    const session = db.prepare("SELECT user_id FROM sessions WHERE token = ?").get(token) as any;
    if (!session) return res.status(401).json({ error: "Invalid token" });
    
    const user = db.prepare("SELECT is_suspended FROM users WHERE id = ?").get(session.user_id) as any;
    if (user && user.is_suspended === 1) {
      return res.status(403).json({ error: "Account suspended" });
    }
    
    req.userId = session.user_id;
    next();
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { username, email, password, facility, location, bio } = req.body;
    try {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, username, email, password, facility, location, bio) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, username, email, password, facility, location, bio);
      const token = crypto.randomUUID();
      db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, id);
      res.json({ token, user: { id, username, email, facility, location, bio } });
    } catch (e) {
      res.status(400).json({ error: "Username or email taken, or invalid data" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.is_suspended === 1) return res.status(403).json({ error: "Account suspended" });
    
    const token = crypto.randomUUID();
    db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, user.id);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, facility: user.facility, location: user.location, bio: user.bio, role: user.role === 'user' && user.is_admin === 1 ? 'super_admin' : user.role, avatar_url: user.avatar_url } });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const user = db.prepare("SELECT id, username, email, facility, location, bio, is_admin, role, avatar_url FROM users WHERE id = ?").get(req.userId) as any;
    if (user) {
      user.role = user.role === 'user' && user.is_admin === 1 ? 'super_admin' : user.role;
    }
    res.json({ user });
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    res.json({ success: true });
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
    
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration
      
      db.prepare("INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)").run(
        resetToken, user.id, expiresAt.toISOString()
      );
      
      // In a real app, send an email here. For this environment, we'll return it in the response for testing/demo purposes.
      console.log(`Password reset token for ${email}: ${resetToken}`);
      res.json({ success: true, message: "If an account exists, a reset link has been sent.", _devToken: resetToken });
    } else {
      // Always return success to prevent email enumeration
      res.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { token, newPassword } = req.body;
    
    const reset = db.prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?").get(token) as any;
    
    if (!reset) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    
    if (new Date(reset.expires_at) < new Date()) {
      db.prepare("DELETE FROM password_resets WHERE token = ?").run(token);
      return res.status(400).json({ error: "Reset token has expired" });
    }
    
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, reset.user_id);
    db.prepare("DELETE FROM password_resets WHERE token = ?").run(token);
    
    // Also invalidate all existing sessions for security
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(reset.user_id);
    
    res.json({ success: true });
  });

  // Data Routes
  app.get("/api/users", requireAuth, (req: any, res) => {
    const users = db.prepare("SELECT id, username as name, facility as history, location, bio, is_mentor, hide_location, hide_history, is_admin, role, avatar_url FROM users WHERE id != ?").all(req.userId);
    // Filter out hidden fields
    const sanitizedUsers = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      bio: u.bio,
      is_mentor: u.is_mentor,
      is_admin: u.is_admin,
      role: u.role === 'user' && u.is_admin === 1 ? 'super_admin' : u.role,
      history: u.hide_history ? "Hidden" : u.history,
      location: u.hide_location ? "Hidden" : u.location,
      avatar_url: u.avatar_url
    }));
    res.json(sanitizedUsers);
  });

  app.get("/api/users/profile", requireAuth, (req: any, res) => {
    const user = db.prepare("SELECT id, username as name, facility as history, location, bio, is_mentor, hide_location, hide_history, is_admin, role, avatar_url FROM users WHERE id = ?").get(req.userId);
    if (user) {
      (user as any).role = (user as any).role === 'user' && (user as any).is_admin === 1 ? 'super_admin' : (user as any).role;
    }
    res.json(user);
  });

  app.put("/api/users/profile", requireAuth, (req: any, res) => {
    const { history, location, bio, hide_location, hide_history, avatar_url } = req.body;
    if (avatar_url !== undefined) {
      db.prepare("UPDATE users SET facility = ?, location = ?, bio = ?, hide_location = ?, hide_history = ?, avatar_url = ? WHERE id = ?").run(
        history, location, bio, hide_location ? 1 : 0, hide_history ? 1 : 0, avatar_url, req.userId
      );
    } else {
      db.prepare("UPDATE users SET facility = ?, location = ?, bio = ?, hide_location = ?, hide_history = ? WHERE id = ?").run(
        history, location, bio, hide_location ? 1 : 0, hide_history ? 1 : 0, req.userId
      );
    }
    res.json({ success: true });
  });

  // Connections routes
  app.get("/api/connections", requireAuth, (req: any, res) => {
    try {
      const connections = db.prepare("SELECT receiver_id FROM connections WHERE requester_id = ?").all(req.userId) as { receiver_id: string }[];
      res.json(connections.map(c => c.receiver_id));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/connections", requireAuth, (req: any, res) => {
    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }
    if (receiverId === req.userId) {
      return res.status(400).json({ error: "Cannot connect to yourself" });
    }
    try {
      const id = crypto.randomUUID();
      db.prepare("INSERT OR IGNORE INTO connections (id, requester_id, receiver_id) VALUES (?, ?, ?)").run(id, req.userId, receiverId);
      
      // Send notification to receiver
      const sender = db.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as { username: string } | undefined;
      const notificationId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, content, link, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(
        notificationId,
        receiverId,
        'connection',
        `${sender?.username || 'Someone'} connected with you in The Yard.`,
        'yard'
      );

      res.json({ success: true, connected: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/connections/:receiverId", requireAuth, (req: any, res) => {
    const { receiverId } = req.params;
    try {
      db.prepare("DELETE FROM connections WHERE requester_id = ? AND receiver_id = ?").run(req.userId, receiverId);
      res.json({ success: true, connected: false });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Jobs Routes
  app.get("/api/jobs", requireAuth, (req: any, res) => {
    const jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
    res.json(jobs);
  });

  app.get("/api/job-applications", requireAuth, (req: any, res) => {
    const apps = db.prepare("SELECT * FROM job_applications WHERE user_id = ? ORDER BY created_at DESC").all(req.userId);
    res.json(apps);
  });

  app.post("/api/job-applications", requireAuth, (req: any, res) => {
    const { company, position, date_applied, status, notes } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO job_applications (id, user_id, company, position, date_applied, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, req.userId, company, position, date_applied, status || 'applied', notes
    );
    res.json({ success: true, id });
  });

  app.put("/api/job-applications/:id", requireAuth, (req: any, res) => {
    const { company, position, date_applied, status, notes } = req.body;
    db.prepare("UPDATE job_applications SET company = ?, position = ?, date_applied = ?, status = ?, notes = ? WHERE id = ? AND user_id = ?").run(
      company, position, date_applied, status, notes, req.params.id, req.userId
    );
    res.json({ success: true });
  });

  app.delete("/api/job-applications/:id", requireAuth, (req: any, res) => {
    db.prepare("DELETE FROM job_applications WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  app.get("/api/legal-cases", requireAuth, (req: any, res) => {
    const cases = db.prepare("SELECT * FROM legal_cases WHERE user_id = ? ORDER BY created_at DESC").all(req.userId);
    res.json(cases);
  });

  app.post("/api/legal-cases", requireAuth, (req: any, res) => {
    const { case_number, court, status, next_hearing_date, notes } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO legal_cases (id, user_id, case_number, court, status, next_hearing_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, req.userId, case_number, court, status, next_hearing_date, notes
    );
    res.json({ success: true, id });
  });

  app.put("/api/legal-cases/:id", requireAuth, (req: any, res) => {
    const { case_number, court, status, next_hearing_date, notes } = req.body;
    db.prepare("UPDATE legal_cases SET case_number = ?, court = ?, status = ?, next_hearing_date = ?, notes = ? WHERE id = ? AND user_id = ?").run(
      case_number, court, status, next_hearing_date, notes, req.params.id, req.userId
    );
    res.json({ success: true });
  });

  app.delete("/api/legal-cases/:id", requireAuth, (req: any, res) => {
    db.prepare("DELETE FROM legal_cases WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  app.post("/api/jobs", requireAuth, (req: any, res) => {
    const { title, company, location, description, is_felony_friendly } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO jobs (id, title, company, location, description, is_felony_friendly, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, title, company, location, description, is_felony_friendly ? 1 : 0, req.userId
    );
    res.json({ success: true, id });
  });

  // Housing Routes
  app.get("/api/housing", requireAuth, (req: any, res) => {
    const housing = db.prepare("SELECT * FROM housing ORDER BY created_at DESC").all();
    res.json(housing);
  });

  app.post("/api/housing", requireAuth, (req: any, res) => {
    const { name, type, location, contact_info, description } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO housing (id, name, type, location, contact_info, description, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, name, type, location, contact_info, description, req.userId
    );
    res.json({ success: true, id });
  });

  // Documents Routes
  app.get("/api/documents", requireAuth, (req: any, res) => {
    const docs = db.prepare("SELECT id, title, category, file_name, file_type, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC").all(req.userId);
    res.json(docs);
  });

  app.post("/api/documents", requireAuth, (req: any, res) => {
    const { title, category, file_name, file_type, file_data } = req.body;
    if (!title || !file_name || !file_data) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO documents (id, user_id, title, category, file_name, file_type, file_data) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, req.userId, title, category, file_name, file_type, file_data
    );
    res.json({ success: true, id });
  });

  app.get("/api/documents/:id/download", requireAuth, (req: any, res) => {
    const doc = db.prepare("SELECT file_name, file_type, file_data FROM documents WHERE id = ? AND user_id = ?").get(req.params.id, req.userId) as any;
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ file_data: doc.file_data, file_name: doc.file_name, file_type: doc.file_type });
  });

  app.delete("/api/documents/:id", requireAuth, (req: any, res) => {
    db.prepare("DELETE FROM documents WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  app.get("/api/avatar/:docId", (req: any, res) => {
    try {
      const doc = db.prepare("SELECT file_type, file_data FROM documents WHERE id = ?").get(req.params.docId) as any;
      if (!doc || !doc.file_data) {
        return res.status(404).send("Avatar not found");
      }
      let base64Data = doc.file_data;
      if (base64Data.includes(";base64,")) {
        base64Data = base64Data.split(";base64,")[1];
      }
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", doc.file_type || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(buffer);
    } catch (err) {
      console.error("Error serving avatar:", err);
      res.status(500).send("Error rendering image");
    }
  });

  app.put("/api/users/mentor-status", requireAuth, (req: any, res) => {
    const { is_mentor } = req.body;
    db.prepare("UPDATE users SET is_mentor = ? WHERE id = ?").run(is_mentor ? 1 : 0, req.userId);
    res.json({ success: true });
  });

  // Mentorship Routes
  app.get("/api/mentors", requireAuth, (req: any, res) => {
    const mentors = db.prepare(`
      SELECT id, username as name, facility as history, location, bio 
      FROM users 
      WHERE is_mentor = 1 AND id != ?
    `).all(req.userId);
    res.json(mentors);
  });

  app.get("/api/mentorships", requireAuth, (req: any, res) => {
    const mentorships = db.prepare(`
      SELECT m.*, 
             u1.username as mentor_name, 
             u2.username as mentee_name
      FROM mentorships m
      JOIN users u1 ON m.mentor_id = u1.id
      JOIN users u2 ON m.mentee_id = u2.id
      WHERE m.mentor_id = ? OR m.mentee_id = ?
      ORDER BY m.updated_at DESC
    `).all(req.userId, req.userId);
    res.json(mentorships);
  });

  app.post("/api/mentorships/request", requireAuth, (req: any, res) => {
    const { mentorId, message } = req.body;
    
    // Check if already requested
    const existing = db.prepare("SELECT id FROM mentorships WHERE mentor_id = ? AND mentee_id = ? AND status IN ('pending', 'active')").get(mentorId, req.userId);
    if (existing) {
      return res.status(400).json({ error: "Mentorship already requested or active" });
    }

    const id = crypto.randomUUID();
    db.prepare("INSERT INTO mentorships (id, mentor_id, mentee_id, status) VALUES (?, ?, ?, 'pending')").run(id, mentorId, req.userId);
    
    const mentee = db.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    const notifId = crypto.randomUUID();
    db.prepare("INSERT INTO notifications (id, user_id, type, content, link) VALUES (?, ?, ?, ?, ?)").run(
      notifId, mentorId, 'mentorship_request', `${mentee.username} has requested you as a mentor.`, 'mentorship'
    );

    if (message && message.trim()) {
      const kiteId = crypto.randomUUID();
      db.prepare("INSERT INTO kites (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)").run(kiteId, req.userId, mentorId, message.trim());
      
      const kiteNotifId = crypto.randomUUID();
      db.prepare("INSERT INTO notifications (id, user_id, type, content, link) VALUES (?, ?, ?, ?, ?)").run(
        kiteNotifId, mentorId, 'kite', `New kite from ${mentee.username}`, 'kites'
      );
    }

    res.json({ success: true });
  });

  app.put("/api/mentorships/:id/status", requireAuth, (req: any, res) => {
    const { status } = req.body; // active, completed, declined
    const mentorship = db.prepare("SELECT * FROM mentorships WHERE id = ?").get(req.params.id) as any;
    
    if (!mentorship) return res.status(404).json({ error: "Not found" });
    
    // Only mentor can accept/decline. Both can complete.
    if (status === 'active' || status === 'declined') {
      if (mentorship.mentor_id !== req.userId) return res.status(403).json({ error: "Unauthorized" });
    }

    db.prepare("UPDATE mentorships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
    
    // Notify the other party
    const otherUserId = req.userId === mentorship.mentor_id ? mentorship.mentee_id : mentorship.mentor_id;
    const actor = db.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    const notifId = crypto.randomUUID();
    
    let actionText = '';
    if (status === 'active') actionText = 'accepted your mentorship request';
    else if (status === 'declined') actionText = 'declined your mentorship request';
    else if (status === 'completed') actionText = 'marked your mentorship as completed';

    db.prepare("INSERT INTO notifications (id, user_id, type, content, link) VALUES (?, ?, ?, ?, ?)").run(
      notifId, otherUserId, 'mentorship_update', `${actor.username} ${actionText}.`, 'mentorship'
    );

    res.json({ success: true });
  });

  app.get("/api/kites/conversations", requireAuth, (req: any, res) => {
    const conversations = db.prepare(`
      SELECT 
        u.id as other_user_id,
        u.username as other_user_name,
        k.content as last_message,
        k.timestamp as last_message_time,
        k.sender_id,
        (SELECT COUNT(*) FROM kites WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      JOIN (
        SELECT *, MAX(timestamp) as max_ts
        FROM kites
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      ) k ON u.id = CASE WHEN k.sender_id = ? THEN k.receiver_id ELSE k.sender_id END
      ORDER BY k.timestamp DESC
    `).all(req.userId, req.userId, req.userId, req.userId, req.userId, req.userId);
    res.json(conversations);
  });

  app.get("/api/kites/thread/:otherUserId", requireAuth, (req: any, res) => {
    const messages = db.prepare(`
      SELECT k.*, u.username as sender_name
      FROM kites k
      JOIN users u ON k.sender_id = u.id
      WHERE (k.sender_id = ? AND k.receiver_id = ?)
         OR (k.sender_id = ? AND k.receiver_id = ?)
      ORDER BY k.timestamp ASC
    `).all(req.userId, req.params.otherUserId, req.params.otherUserId, req.userId);
    res.json(messages);
  });

  app.post("/api/kites/read/:otherUserId", requireAuth, (req: any, res) => {
    db.prepare(`
      UPDATE kites 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(req.params.otherUserId, req.userId);
    res.json({ success: true });
  });

  app.get("/api/kites", requireAuth, (req: any, res) => {
    const kites = db.prepare(`
      SELECT k.id, k.content, k.timestamp as time, u.username as 'from', k.sender_id
      FROM kites k
      JOIN users u ON k.sender_id = u.id
      WHERE k.receiver_id = ?
      ORDER BY k.timestamp DESC
    `).all(req.userId);
    res.json(kites);
  });

  app.post("/api/kites", requireAuth, (req: any, res) => {
    const { receiverId, content } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO kites (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)").run(id, req.userId, receiverId, content);
    
    const sender = db.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    const notifId = crypto.randomUUID();
    db.prepare("INSERT INTO notifications (id, user_id, type, content, link) VALUES (?, ?, ?, ?, ?)").run(
      notifId, receiverId, 'kite', `New kite from ${sender.username}`, 'kites'
    );

    res.json({ success: true });
  });

  app.get("/api/parole-officers", requireAuth, (req: any, res) => {
    const officers = db.prepare("SELECT * FROM parole_officers WHERE user_id = ? ORDER BY name ASC").all(req.userId);
    res.json(officers);
  });

  app.post("/api/parole-officers", requireAuth, (req: any, res) => {
    const { name, agency, phone, district } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO parole_officers (id, user_id, name, agency, phone, district) VALUES (?, ?, ?, ?, ?, ?)").run(id, req.userId, name, agency, phone, district);
    
    const notifId = crypto.randomUUID();
    db.prepare("INSERT INTO notifications (id, user_id, type, content, link) VALUES (?, ?, ?, ?, ?)").run(
      notifId, req.userId, 'po_update', `Added new parole officer: ${name}`, 'tools'
    );

    res.json({ success: true, officer: { id, user_id: req.userId, name, agency, phone, district } });
  });

  app.delete("/api/parole-officers/:id", requireAuth, (req: any, res) => {
    db.prepare("DELETE FROM parole_officers WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  // Forum Routes
  app.get("/api/threads", requireAuth, (req: any, res) => {
    const threads = db.prepare(`
      SELECT t.*, u.username as author_name,
      (SELECT COUNT(*) FROM replies WHERE thread_id = t.id) as reply_count
      FROM threads t
      JOIN users u ON t.author_id = u.id
      ORDER BY t.timestamp DESC
    `).all();
    res.json(threads);
  });

  app.post("/api/threads", requireAuth, (req: any, res) => {
    const { title, content, category } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO threads (id, author_id, title, content, category) VALUES (?, ?, ?, ?, ?)").run(id, req.userId, title, content, category || 'general');
    res.json({ success: true, id });
  });

  app.get("/api/threads/:id", requireAuth, (req: any, res) => {
    const thread = db.prepare(`
      SELECT t.*, u.username as author_name, u.facility as author_history, u.location as author_location
      FROM threads t
      JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!thread) return res.status(404).json({ error: "Not found" });

    const replies = db.prepare(`
      SELECT r.*, u.username as author_name
      FROM replies r
      JOIN users u ON r.author_id = u.id
      WHERE r.thread_id = ?
      ORDER BY r.timestamp ASC
    `).all(req.params.id);

    res.json({ thread, replies });
  });

  app.post("/api/threads/:id/flag", requireAuth, (req: any, res) => {
    db.prepare("UPDATE threads SET is_flagged = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/threads/:id/replies", requireAuth, (req: any, res) => {
    const { content } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO replies (id, thread_id, author_id, content) VALUES (?, ?, ?, ?)").run(id, req.params.id, req.userId, content);
    
    const thread = db.prepare("SELECT author_id, title FROM threads WHERE id = ?").get(req.params.id) as any;
    if (thread && thread.author_id !== req.userId) {
      const replier = db.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
      const notifId = crypto.randomUUID();
      db.prepare("INSERT INTO notifications (id, user_id, type, content, link) VALUES (?, ?, ?, ?, ?)").run(
        notifId, thread.author_id, 'reply', `${replier.username} replied to your thread "${thread.title}"`, 'forum'
      );
    }

    res.json({ success: true });
  });

  // Notification Routes
  app.post("/api/replies/:id/flag", requireAuth, (req: any, res) => {
    db.prepare("UPDATE replies SET is_flagged = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/notifications", requireAuth, (req: any, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50").all(req.userId);
    res.json(notifications);
  });

  app.put("/api/notifications/:id/read", requireAuth, (req: any, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  app.put("/api/notifications/read-all", requireAuth, (req: any, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.userId);
    res.json({ success: true });
  });

  // Global Search Route
  app.get("/api/search", requireAuth, (req: any, res) => {
    const q = req.query.q;
    if (!q || typeof q !== 'string') return res.json({ users: [], jobs: [], housing: [], posts: [] });
    
    const likeQ = `%${q}%`;
    const users = db.prepare("SELECT id, username as name, bio, location FROM users WHERE username LIKE ? OR bio LIKE ? OR location LIKE ? LIMIT 10").all(likeQ, likeQ, likeQ);
    const jobs = db.prepare("SELECT id, title, company, location FROM jobs WHERE title LIKE ? OR company LIKE ? OR description LIKE ? LIMIT 10").all(likeQ, likeQ, likeQ);
    const housing = db.prepare("SELECT id, name, type, location FROM housing WHERE name LIKE ? OR description LIKE ? OR location LIKE ? LIMIT 10").all(likeQ, likeQ, likeQ);
    const posts = db.prepare("SELECT id, title, content, category FROM threads WHERE title LIKE ? OR content LIKE ? LIMIT 10").all(likeQ, likeQ);
    
    res.json({ users, jobs, housing, posts });
  });

  // Admin Routes
  const requireRole = (allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      const user = db.prepare("SELECT role, is_admin FROM users WHERE id = ?").get(req.userId) as any;
      if (!user) return res.status(403).json({ error: "Forbidden" });
      
      const userRole = (user.role === 'user' && user.is_admin === 1) ? 'super_admin' : user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      
      req.userRole = userRole;
      next();
    };
  };

  app.get("/api/admin/stats", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const jobCount = db.prepare("SELECT COUNT(*) as count FROM jobs").get() as any;
    const housingCount = db.prepare("SELECT COUNT(*) as count FROM housing").get() as any;
    const postCount = db.prepare("SELECT COUNT(*) as count FROM threads").get() as any;

    res.json({
      users: userCount.count,
      jobs: jobCount.count,
      housing: housingCount.count,
      posts: postCount.count
    });
  });

  app.get("/api/admin/users", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    const users = db.prepare("SELECT id, username as name, email, created_at, is_admin, is_mentor, role, is_suspended FROM users ORDER BY created_at DESC").all();
    const mappedUsers = users.map((u: any) => ({
      ...u,
      role: u.role === 'user' && u.is_admin === 1 ? 'super_admin' : u.role
    }));
    res.json(mappedUsers);
  });

  app.put("/api/admin/users/:id/suspend", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    const { suspend } = req.body;
    if (req.params.id === req.userId) return res.status(400).json({ error: "Cannot suspend yourself" });
    
    const targetUser = db.prepare("SELECT role, is_admin FROM users WHERE id = ?").get(req.params.id) as any;
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    
    const targetRole = targetUser.role === 'user' && targetUser.is_admin === 1 ? 'super_admin' : targetUser.role;
    
    if (req.userRole === 'moderator' && ['admin', 'super_admin'].includes(targetRole)) {
      return res.status(403).json({ error: "Moderators cannot suspend admins" });
    }
    if (req.userRole === 'admin' && targetRole === 'super_admin') {
      return res.status(403).json({ error: "Admins cannot suspend super admins" });
    }
    
    db.prepare("UPDATE users SET is_suspended = ? WHERE id = ?").run(suspend ? 1 : 0, req.params.id);
    
    // Log the action
    db.prepare("INSERT INTO moderation_logs (id, moderator_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)").run(
      crypto.randomUUID(), req.userId, suspend ? 'suspend_user' : 'unsuspend_user', 'user', req.params.id
    );
    
    res.json({ success: true });
  });

  app.get("/api/admin/flagged", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    const threads = db.prepare("SELECT t.id, t.title, t.content, t.category, t.timestamp, u.username as author_name, 'thread' as type FROM threads t JOIN users u ON t.author_id = u.id WHERE t.is_flagged = 1 ORDER BY t.timestamp DESC").all();
    const replies = db.prepare("SELECT r.id, r.content, r.timestamp, u.username as author_name, 'reply' as type, r.thread_id FROM replies r JOIN users u ON r.author_id = u.id WHERE r.is_flagged = 1 ORDER BY r.timestamp DESC").all();
    res.json({ threads, replies });
  });

  app.post("/api/admin/flagged/:type/:id/dismiss", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    if (!['thread', 'reply'].includes(req.params.type)) return res.status(400).json({ error: "Invalid type" });
    const table = req.params.type === 'thread' ? 'threads' : 'replies';
    db.prepare(`UPDATE ${table} SET is_flagged = 0 WHERE id = ?`).run(req.params.id);
    
    // Log the action
    db.prepare("INSERT INTO moderation_logs (id, moderator_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)").run(
      crypto.randomUUID(), req.userId, 'dismiss_flag', req.params.type, req.params.id
    );
    
    res.json({ success: true });
  });

  app.delete("/api/admin/flagged/:type/:id", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    if (!['thread', 'reply'].includes(req.params.type)) return res.status(400).json({ error: "Invalid type" });
    const table = req.params.type === 'thread' ? 'threads' : 'replies';
    if (table === 'threads') {
      db.prepare(`DELETE FROM replies WHERE thread_id = ?`).run(req.params.id);
    }
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    
    // Log the action
    db.prepare("INSERT INTO moderation_logs (id, moderator_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)").run(
      crypto.randomUUID(), req.userId, 'delete_content', req.params.type, req.params.id
    );
    
    res.json({ success: true });
  });

  app.get("/api/admin/logs", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    const logs = db.prepare(`
      SELECT l.*, u.username as moderator_name 
      FROM moderation_logs l
      LEFT JOIN users u ON l.moderator_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 100
    `).all();
    res.json(logs);
  });

  app.put("/api/admin/users/:id/role", requireAuth, requireRole(['super_admin']), (req: any, res) => {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    
    // Log the action
    db.prepare("INSERT INTO moderation_logs (id, moderator_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)").run(
      crypto.randomUUID(), req.userId, 'change_role', 'user', req.params.id, JSON.stringify({ new_role: role })
    );
    
    res.json({ success: true });
  });

  app.delete("/api/admin/users/:id", requireAuth, requireRole(['admin', 'super_admin']), (req: any, res) => {
    if (req.params.id === req.userId) return res.status(400).json({ error: "Cannot delete yourself" });
    const userId = req.params.id;
    
    // Delete user's replies
    db.prepare("DELETE FROM replies WHERE author_id = ?").run(userId);
    
    // Delete replies to user's threads
    db.prepare("DELETE FROM replies WHERE thread_id IN (SELECT id FROM threads WHERE author_id = ?)").run(userId);
    
    // Delete user's threads
    db.prepare("DELETE FROM threads WHERE author_id = ?").run(userId);
    
    // Delete user's documents
    db.prepare("DELETE FROM documents WHERE user_id = ?").run(userId);
    
    // Delete user's sessions
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    
    // Delete user's password resets
    db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(userId);
    
    // Delete user's parole officers
    db.prepare("DELETE FROM parole_officers WHERE user_id = ?").run(userId);
    
    // Delete user's notifications
    db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
    
    // Delete user's kites (messages)
    db.prepare("DELETE FROM kites WHERE sender_id = ? OR receiver_id = ?").run(userId, userId);
    
    // Delete user's mentorships
    db.prepare("DELETE FROM mentorships WHERE mentor_id = ? OR mentee_id = ?").run(userId, userId);
    
    // Delete user's jobs
    db.prepare("DELETE FROM jobs WHERE posted_by = ?").run(userId);
    
    // Delete user's housing
    db.prepare("DELETE FROM housing WHERE posted_by = ?").run(userId);
    
    // Finally, delete the user
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    
    // Log the action
    db.prepare("INSERT INTO moderation_logs (id, moderator_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)").run(
      crypto.randomUUID(), req.userId, 'delete_user', 'user', userId
    );
    
    res.json({ success: true });
  });

  app.delete("/api/admin/jobs/:id", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/housing/:id", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    db.prepare("DELETE FROM housing WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/posts/:id", requireAuth, requireRole(['moderator', 'admin', 'super_admin']), (req: any, res) => {
    db.prepare("DELETE FROM replies WHERE thread_id = ?").run(req.params.id);
    db.prepare("DELETE FROM threads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
