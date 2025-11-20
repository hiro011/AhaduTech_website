// netlify/functions/product-comments.js
import { neon } from '@netlify/neon';

export default async (req) => {
  const sql = neon();
  const url = new URL(req.url);
  const productId = url.searchParams.get('id');

  // GET comments
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    const comments = await sql`
    SELECT 
      pc.id,
      pc.comment,
      pc.rating,
      pc.created_at AS date,
      pc.user_id,           
      u.name,
      u.email        
    FROM product_comments pc
    LEFT JOIN users u ON pc.user_id = u.id
    WHERE pc.product_id = ${productId}
    ORDER BY pc.created_at DESC
  `;

    return new Response(JSON.stringify(comments), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // === POST: Submit new review (login required) ===
  if (req.method === 'POST') {
    const body = await req.json();
    const { user_id, product_id, comment, rating } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Login required' }), { status: 401 });
    }
    if (!comment?.trim()) {
      return new Response(JSON.stringify({ error: 'Comment is required' }), { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Valid rating (1–5) required' }), { status: 400 });
    }

    await sql`
      INSERT INTO product_comments (user_id, product_id, comment, rating)
      VALUES (${user_id}, ${product_id}, ${comment}, ${rating})
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/product-comments' };