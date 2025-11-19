// netlify/functions/get-comments.js   ← exact path & filename

import { neon } from '@netlify/neon';

export default async () => {
  const sql = neon(); // automatically reads NETLIFY_DATABASE_URL – no config needed!

  try {
    const comments = await sql`
      SELECT 
        c.id,
        c.comment,
        c.rating,
        c.created_at AS date,
        u.name,
        u.email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `;

    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('DB Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = { path: '/api/comments' };