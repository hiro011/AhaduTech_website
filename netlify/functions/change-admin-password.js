// netlify/functions/change-admin-password.js
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function handler(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405 };

    const { currentPassword, newPassword } = JSON.parse(event.body);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Get current admin (you can filter by allowed emails)
        const { rows } = await pool.query(
            `SELECT password_hash FROM users WHERE email = ANY($1)`,
            [['admin@ahadutech.com', 'superadmin@ahadutech.com']]
        );

        if (rows.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Admin not found' }) };
        }

        const admin = rows[0];
        const match = await bcrypt.compare(currentPassword, admin.password_hash);

        if (!match) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Current password is wrong' }) };
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE users SET password_hash = $1 WHERE email = ANY($2)`,
            [newHash, ['admin@ahadutech.com', 'superadmin@ahadutech.com']]
        );

        await pool.end();
        return { statusCode: 200, body: JSON.stringify({ success: true }) };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
    }
}