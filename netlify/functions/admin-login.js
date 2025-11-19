// https://bcrypt-generator.com/

// netlify/functions/admin-login.js — FIXED FOR 502
import { neon } from '@netlify/neon';

export default async (req) => {
  const sql = neon();

  // Helper: Hash (for future use) — but we use pre-hashed for now
  const hashPassword = (password, salt) => {
    return new Promise((resolve, reject) => {
      const key = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256');
      resolve(key.toString('hex'));
    });
  };

  // Helper: Verify password (matches your DB hash format)
  const verifyPassword = (password, storedHash) => {
    try {
      // For your pre-hashed format: assume storedHash is the full PBKDF2 string
      // Parse: pbkdf2:sha256:600000$salt$hash
      const parts = storedHash.split('$');
      if (parts.length !== 4) return false;
      const [, iterations, saltB64, hashB64] = parts;
      const salt = Buffer.from(atob(saltB64), 'base64');
      const key = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 32, 'sha256');
      const derived = key.toString('hex');
      const expected = Buffer.from(atob(hashB64), 'base64').toString('hex');
      return derived === expected;
    } catch {
      return false;
    }
  };

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const admins = await sql`SELECT * FROM admin_users WHERE email = ${email.trim().toLowerCase()}`;
    
    if (admins.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const admin = admins[0];
    const valid = verifyPassword(password, admin.password_hash);

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Safe response (no password)
    const { password_hash, ...safeAdmin } = admin;
    return new Response(JSON.stringify({ success: true, admin: safeAdmin }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Admin login error:', error);  // Logs to Netlify dashboard
    return new Response(JSON.stringify({ error: 'Server error: ' + error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

// Handle CORS for POST
export const config = { 
  path: '/api/admin/login' 
};