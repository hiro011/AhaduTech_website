// netlify/functions/admin-login.js
import { neon } from '@netlify/neon';

const hashPassword = async (pass) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), { name: 'PBKDF2' }, false, ['deriveBits']);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    key, 256
  );
  return `pbkdf2:sha256:600000$${btoa(String.fromCharCode(...salt))}$${btoa(String.fromCharCode(...new Uint8Array(bits)))}`;
};

const verifyPassword = async (pass, hash) => {
  const [algo, iterations, saltB64, hashB64] = hash.split('$');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), { name: 'PBKDF2' }, false, ['deriveBits']);
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: parseInt(iterations), hash: 'SHA-256' },
    key, 256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === hashB64;
};

export default async (req) => {
  const sql = neon();
  const { email, password } = await req.json();

  const admins = await sql`SELECT * FROM admin_users WHERE email = ${email}`;
  if (admins.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  const admin = admins[0];
  const valid = await verifyPassword(password, admin.password_hash);

  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  const { password_hash, ...safeAdmin } = admin;
  return new Response(JSON.stringify({ success: true, admin: safeAdmin }));
};

export const config = { path: '/api/admin/login' };