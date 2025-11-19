import { sql } from 'https://cdn.jsdelivr.net/npm/@neondatabase/serverless@0.10.0/+esm';

export default async (req) => {
  const client = sql(process.env.NETLIFY_DATABASE_URL);

  try {
    const data = await client`
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
    `;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = { path: '/api/comments' };