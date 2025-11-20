// netlify/functions/product-comments.js  ← ONLY THIS ONE
import { neon } from '@netlify/neon';

const sql = neon();

export default async (req) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get('id');

  try {
    // GET: Load comments
    if (req.method === 'GET') {
      if (!productId) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

      const comments = await sql`
        SELECT 
          pc.id, pc.comment, pc.rating, pc.created_at AS date,
          pc.user_id, u.name, u.email
        FROM product_comments pc
        LEFT JOIN users u ON pc.user_id = u.id
        WHERE pc.product_id = ${productId}
        ORDER BY pc.created_at DESC
      `;

      return new Response(JSON.stringify(comments), { status: 200 });
    }

    // POST: Add new comment
    if (req.method === 'POST') {
      const { user_id, product_id, comment, rating } = await req.json();

      if (!user_id) return new Response(JSON.stringify({ error: 'Login required' }), { status: 401 });
      if (!comment?.trim()) return new Response(JSON.stringify({ error: 'Comment required' }), { status: 400 });
      if (!rating || rating < 1 || rating > 5) return new Response(JSON.stringify({ error: 'Rating 1–5' }), { status: 400 });

      await sql`
        INSERT INTO product_comments (user_id, product_id, comment, rating)
        VALUES (${user_id}, ${product_id}, ${comment}, ${rating})
      `;

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // DELETE: Owner OR admin (id 8 or 9)
    if (req.method === 'DELETE') {
      const { comment_id, user_id } = await req.json();
      const userIdStr = String(user_id);

      const result = await sql`
        DELETE FROM product_comments 
        WHERE id = ${comment_id} 
          AND (user_id::text = ${userIdStr} OR ${userIdStr} IN ('8', '9'))
        RETURNING id
      `;

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const config = { path: '/api/product-comments' };