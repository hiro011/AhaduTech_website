// netlify/functions/change-admin-password.js
import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

const ADMINS = ['admin@ahadutech.com', 'superadmin@ahadutech.com'];

export default async (req) => {
    const sql = neon();
    const { currentPassword, newPassword } = await req.json();

    const result = await sql`SELECT password_hash FROM users WHERE email = ANY(${ADMINS})`;
    if (result.length === 0) return new Response(JSON.stringify({ error: 'Admin not found' }), { status: 400 });

    const match = await bcrypt.compare(currentPassword, result[0].password_hash);
    if (!match) return new Response(JSON.stringify({ error: 'Wrong current password' }), { status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    await sql`UPDATE users SET password_hash = ${hash} WHERE email = ANY(${ADMINS})`;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const config = { path: '/api/change-admin-password' };