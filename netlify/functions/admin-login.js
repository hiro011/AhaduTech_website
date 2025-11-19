// https://bcrypt-generator.com/
import { neon } from '@netlify/neon';
import { pbkdf2Sync } from 'crypto';

export default async (req) => {
  const sql = neon();

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find admin
    const result = await sql`
      SELECT id, name, email, password_hash 
      FROM admin_users 
      WHERE email = ${email.trim().toLowerCase()}
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const admin = result[0];

    const parts = admin.password_hash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2:sha256:600000') {
      return new Response(JSON.stringify({ error: 'Invalid hash format' }), { status: 500 });
    }

    const salt = Buffer.from(parts[2], 'base64');
    const storedHash = parts[3];

    // Generate hash from input password
    const key = pbkdf2Sync(password, salt, 600000, 32, 'sha256');
    const inputHash = key.toString('base64');

    if (inputHash !== storedHash) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SUCCESS — remove password
    const { password_hash, ...safeAdmin } = admin;

    return new Response(JSON.stringify({
      success: true,
      admin: safeAdmin
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/api/admin/login' };