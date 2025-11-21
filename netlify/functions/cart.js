// netlify/functions/cart.js
import { neon } from '@netlify/neon';

export default async (req) => {
    const sql = neon();

    try {
        const body = await req.json();
        const { action, sessionId, userId, productId, quantity = 1 } = body;

        // Always make sure these are the right types
        const cleanSessionId = String(sessionId || '');
        const cleanUserId = userId ? Number(userId) : null;
        const cleanProductId = Number(productId);
        const cleanQty = Number(quantity) || 1;

        if (!cleanSessionId || !cleanProductId) {
            return new Response(JSON.stringify({ error: 'Missing session or product' }), { status: 400 });
        }

        // Helper: return full cart
        const getCart = async () => {
            return await sql`
        SELECT 
          ci.id,
          ci.product_id,
          ci.quantity,
          p.name,
          p.price,
          p.image,
          p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.session_id = ${cleanSessionId}
          ${cleanUserId ? sql`OR ci.user_id = ${cleanUserId}` : sql``}
        ORDER BY ci.created_at DESC
      `;
        };

        // ADD / INCREASE
        if (action === 'add') {
            const product = await sql`SELECT stock FROM products WHERE id = ${cleanProductId}`;
            if (product.length === 0) {
                return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
            }

            const current = await sql`
        SELECT quantity FROM cart_items 
        WHERE session_id = ${cleanSessionId} AND product_id = ${cleanProductId}
      `;

            const newQty = (current[0]?.quantity || 0) + cleanQty;
            if (newQty > product[0].stock) {
                return new Response(JSON.stringify({ error: `Only ${product[0].stock} in stock` }), { status: 400 });
            }

            if (current.length > 0) {
                await sql`
          UPDATE cart_items 
          SET quantity = ${newQty}, user_id = ${cleanUserId}
          WHERE session_id = ${cleanSessionId} AND product_id = ${cleanProductId}
        `;
            } else {
                await sql`
          INSERT INTO cart_items (session_id, user_id, product_id, quantity)
          VALUES (${cleanSessionId}, ${cleanUserId}, ${cleanProductId}, ${newQty})
        `;
            }

            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        // GET CART
        if (action === 'get') {
            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

    } catch (err) {
        console.error('Cart error:', err);
        return new Response(JSON.stringify({ error: 'Server error', details: err.message }), { status: 500 });
    }
};

export const config = { path: '/api/cart' };