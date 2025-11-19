// netlify/functions/product-comments.js
import { neon } from '@netlify/neon';

export default async (req) => {
  const sql = neon();
  const url = new URL(req.url);
  const productId = url.searchParams.get('id');

  // GET = Load comments for product
  if (req.method === 'GET') {
    try {
      const comments = await sql`
        SELECT c.id, c.name, c.comment, c.rating, c.created_at AS date
        FROM product_comments c
        WHERE c.product_id = ${productId}
        ORDER BY c.created_at DESC
      `;
      return new Response(JSON.stringify(comments), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // POST = Save new comment
  if (req.method === 'POST') {
    const body = await req.json();
    const { product_id, name, comment, rating } = body;

    try {
      await sql`
        INSERT INTO product_comments (product_id, name, comment, rating)
        VALUES (${product_id}, ${name}, ${comment}, ${rating})
      `;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/product-comments' };