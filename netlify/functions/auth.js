// netlify/functions/auth.js  ← EXACT PATH
import { neon } from '@netlify/neon';
import { hash, verify } from 'https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/dist/argon2-bundled.min.js';

export default async (req) => {
  const sql = neon();

  try {
    const body = await req.json();
    const { action, name, email, password } = body;

    // REGISTER
    if (action === 'register') {
      if (!name || !email || !password || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
      }

      const hashResult = await hash({ pass: password, salt: crypto.getRandomValues(new Uint8Array(16)), type: 2 });
      const password_hash = hashResult.hashHex;

      const result = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name}, ${email}, ${password_hash})
        ON CONFLICT (email) DO NOTHING
        RETURNING id, name, email
      `;

      if (!result.length) return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409 });

      return new Response(JSON.stringify({ success: true, user: result[0] }));
    }

    // LOGIN
    if (action === 'login') {
      const users = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email}`;
      if (!users.length) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

      const user = users[0];
      const valid = await verify({ pass: password, hash: user.password_hash });

      if (!valid) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

      delete user.password_hash;
      return new Response(JSON.stringify({ success: true, user }));
    }

  } catch (err) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const config = { path: '/api/auth' };