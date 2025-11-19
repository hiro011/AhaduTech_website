// netlify/functions/auth.js
import { neon } from '@netlify/neon';

export default async (req) => {
  const sql = neon();

  // Helper: Hash password with PBKDF2 (Node.js native)
  const hashPassword = async (password) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return btoa(String.fromCharCode(...new Uint8Array(derived))) + '|' + btoa(String.fromCharCode(...salt));
  };

  // Helper: Verify password
  const verifyPassword = async (password, hash) => {
    const [hashed, saltStr] = hash.split('|');
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return btoa(String.fromCharCode(...new Uint8Array(derived))) === hashed;
  };

  try {
    const { action, name, email, password } = await req.json();

    // REGISTER
    if (action === 'register') {
      if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Fill all fields. Password min 6 chars.' }), { status: 400 });
      }

      // First check if email already exists
      const existing = await sql`SELECT id FROM users WHERE email = ${email.trim().toLowerCase()}`;
      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: 'This email is already registered!' }), { status: 409 });
      }

      const password_hash = await hashPassword(password);

      const result = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${password_hash})
        RETURNING id, name, email
      `;

      return new Response(JSON.stringify({ success: true, user: result[0] }));
    }

    // LOGIN
    if (action === 'login') {
      if (!email?.trim() || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
      }

      const users = await sql`
        SELECT id, name, email, password_hash
        FROM users WHERE email = ${email.trim().toLowerCase()}
      `;

      if (users.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      const user = users[0];
      const valid = await verifyPassword(password, user.password_hash);

      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      const { password_hash, ...safeUser } = user;
      return new Response(JSON.stringify({ success: true, user: safeUser }));
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

  } catch (err) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
};

export const config = { path: '/api/auth' };