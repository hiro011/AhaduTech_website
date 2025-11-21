// netlify/functions/forgot-password.js
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { action, email, answer1, answer2, newPassword } = JSON.parse(event.body);

  try {
    const client = await pool.connect();

    if (action === 'verify') {
      const result = await client.query(
        `SELECT security_answer_1, security_answer_2, security_question_1, security_question_2 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Email not found' }) };
      }

      const user = result.rows[0];

      const match1 = user.security_answer_1 === answer1;
      const match2 = user.security_answer_2 === answer2;

      if (match1 && match2) {
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } else {
        return { statusCode: 400, body: JSON.stringify({ error: 'Wrong answers' }) };
      }
    }

    if (action === 'reset') {
      const hash = await bcrypt.hash(newPassword, 10);
      await client.query(
        `UPDATE users SET password = $1 WHERE email = $2`,
        [hash, email]
      );
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}