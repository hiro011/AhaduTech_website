// netlify/functions/change-admin-password.js

import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

const ADMINS = ['admin@ahadutech.com', 'superadmin@ahadutech.com'];

export default async (req) => {
  const sql = neon();
  const { currentPassword, newPassword } = await req.json();

  try {
    const admins = await sql`
      SELECT password_hash FROM users WHERE email = ANY(${ADMINS})
    `;

    if (admins.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin not found' }), { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, admins[0].password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Wrong current password' }), { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await sql`
      UPDATE users SET password_hash = ${hash} WHERE email = ANY(${ADMINS})
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const config = { path: '/api/change-admin-password' };