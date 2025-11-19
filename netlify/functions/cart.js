import { neon } from '@netlify/neon';

export default async (req) => {
    const sql = neon();
    const { sessionId, userId, productId, quantity } = await req.json();

    if (req.method === 'POST') {
        await sql`
      INSERT INTO cart_items (session_id, user_id, product_id, quantity)
      VALUES (${sessionId}, ${userId || null}, ${productId}, ${quantity || 1})
      ON CONFLICT (session_id, product_id) DO UPDATE SET quantity = cart_items.quantity + 1
    `;
        return new Response(JSON.stringify({ success: true }));
    }

    if (req.method === 'GET') {
        const items = await sql`
      SELECT c.*, p.name, p.price, p.image 
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.session_id = ${sessionId}
    `;
        return new Response(JSON.stringify(items));
    }
};

export const config = { path: '/api/cart' };