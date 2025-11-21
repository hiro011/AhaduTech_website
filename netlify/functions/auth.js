// netlify/functions/auth.js
import { neon } from '@netlify/neon';

export default async (req) => {
  const sql = neon();

  // ──── CRYPTO HELPERS (unchanged) ────
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
    // ──── READ BODY ONLY ONCE ────
    const body = await req.json();

    const { action } = body;

    // ──── REGISTER ────
    if (action === 'register') {
      const {
        name,
        email,
        password,
        security_question_1,
        security_answer_1,
        security_question_2,
        security_answer_2
      } = body;

      // Validation
      if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Fill all fields. Password min 6 chars.' }), { status: 400 });
      }
      if (!security_question_1 || !security_answer_1 || !security_question_2 || !security_answer_2) {
        return new Response(JSON.stringify({ error: 'Please answer both security questions' }), { status: 400 });
      }
      if (security_question_1 === security_question_2) {
        return new Response(JSON.stringify({ error: 'Please choose two different questions' }), { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check duplicate
      const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: 'This email is already registered!' }), { status: 409 });
      }

      const password_hash = await hashPassword(password);

      const result = await sql`
        INSERT INTO users (
          name, email, password_hash,
          security_question_1, security_answer_1,
          security_question_2, security_answer_2
        ) VALUES (
          ${name.trim()},
          ${cleanEmail},
          ${password_hash},
          ${security_question_1},
          ${security_answer_1.toLowerCase().trim()},
          ${security_question_2},
          ${security_answer_2.toLowerCase().trim()}
        )
        RETURNING id, name, email
      `;

      return new Response(JSON.stringify({ success: true, user: result[0] }));
    }

    // ──── LOGIN ────
    if (action === 'login') {
      const { email, password } = body;

      if (!email?.trim() || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const users = await sql`
        SELECT id, name, email, password_hash
        FROM users WHERE email = ${cleanEmail}
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
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const config = { path: '/api/auth' };