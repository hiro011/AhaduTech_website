// netlify/functions/change-password.js
import { neon } from '@netlify/neon';

// Same verify + hash as your auth.js
const verifyPassword = async (password, hash) => {
    const [hashed, saltStr] = hash.split('|');
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256
    );
    return btoa(String.fromCharCode(...new Uint8Array(derived))) === hashed;
};

const hashPassword = async (password) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256
    );
    return btoa(String.fromCharCode(...new Uint8Array(derived))) + '|' + btoa(String.fromCharCode(...salt));
};

export default async (req) => {
    const sql = neon();
    const { currentPassword, newPassword, email } = await req.json();   // ← get email from frontend!

    if (!email) return new Response(JSON.stringify({ error: 'No email' }), { status: 400 });

    const rows = await sql`SELECT password_hash FROM users WHERE email = ${email}`;
    if (!rows.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

    const valid = await verifyPassword(currentPassword, rows[0].password_hash);
    if (!valid) return new Response(JSON.stringify({ error: 'Wrong current password' }), { status: 400 });

    const newHash = await hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE email = ${email}`;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const config = { path: '/api/change-password' };