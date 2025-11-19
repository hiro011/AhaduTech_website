// netlify/functions/product-comments.js
import { neon } from '@netlify/neon';

const sql = neon(); // Your Neon DB connection

export default async (req) => {
  try {
    // GET: Load comments
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const productId = url.searchParams.get('id');

      if (!productId) {
        return new Response(JSON.stringify({ error: 'Missing product id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const comments = await sql`
        SELECT 
          pc.id,
          pc.comment,
          pc.rating,
          pc.created_at AS date,
          pc.user_id,
          u.name
        FROM product_comments pc
        LEFT JOIN users u ON pc.user_id = u.id
        WHERE pc.product_id = ${productId}
        ORDER BY pc.created_at DESC
      `;

      return new Response(JSON.stringify(comments), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST: Add new comment
    if (req.method === 'POST') {
      const { user_id, product_id, comment, rating } = await req.json();

      const result = await sql`
        INSERT INTO product_comments (user_id, product_id, comment, rating)
        VALUES (${user_id}, ${product_id}, ${comment}, ${rating})
        RETURNING id, date
      `;

      return new Response(JSON.stringify({ success: true, comment: result[0] }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // DELETE: Remove comment (owner or admin id 0)
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { comment_id, user_id } = body;

      if (!comment_id || user_id === undefined) {
        return new Response(JSON.stringify({ error: 'Missing data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const userIdStr = String(user_id);

      const result = await sql`
        DELETE FROM product_comments 
        WHERE id = ${comment_id} 
          AND (user_id::text = ${userIdStr} OR ${userIdStr} = '0')
        RETURNING id
      `;

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Not authorized or comment not found' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// IMPORTANT: This tells Netlify the URL
export const config = {
  path: '/api/product-comments'
};