// netlify/functions/auth.js
import { neon } from '@netlify/neon';
import { hash, verify } from 'https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/+esm';

export default async (req) => {
  const sql = neon();

  try {
    const { action, name, email, password } = await req.json();

    // ====================== REGISTER ======================
    if (action === 'register') {
      if (!name || !email || !password) {
        return new Response(JSON.stringify({ error: 'All fields required' }), { status: 400 });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password too short' }), { status: 400 });
      }

      const password_hash = await hash({ pass: password, salt: crypto.getRandomValues(new Uint8Array(16)) });

      const result = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name}, ${email}, ${password_hash})
        ON CONFLICT (email) DO NOTHING
        RETURNING id, name, email
      `;

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409 });
      }

      return new Response(JSON.stringify({ success: true, user: result[0] }));
    }

    // ====================== LOGIN ======================
    if (action === 'login') {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
      }

      const users = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email}`;

      if (users.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      const user = users[0];
      const valid = await verify({ pass: password, hash: user.password_hash });

      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
      }

      // Remove password from response
      delete user.password_hash;

      return new Response(JSON.stringify({ success: true, user }));
    }

  } catch (err) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const config = { path: '/api/auth' };