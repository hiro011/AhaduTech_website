// netlify/functions/cart.js
import { neon } from '@netlify/neon';

export default async (req) => {
    const sql = neon();

    try {
        const body = await req.json();
        const { action, sessionId, userId, productId, quantity = 1 } = body;

        if (!sessionId || !productId) {
            return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400 });
        }

        const cleanSessionId = String(sessionId);
        const cleanProductId = Number(productId);
        const cleanQty = Number(quantity);

        // Helper: get cart
        const getCart = async () => {
            const rows = await sql`
        SELECT 
          ci.id, ci.product_id, ci.quantity,
          p.name, p.price, p.image, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.session_id = ${cleanSessionId}
        ${userId !== null && userId !== undefined ? sql`OR ci.user_id = ${Number(userId)}` : sql``}
        ORDER BY ci.created_at DESC
      `;
            return rows;
        };

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
                // Safe UPDATE – never use ${userId} directly when it can be null
                if (userId !== null && userId !== undefined) {
                    await sql`
            UPDATE cart_items 
            SET quantity = ${newQty}, user_id = ${Number(userId)}
            WHERE session_id = ${cleanSessionId} AND product_id = ${cleanProductId}
          `;
                } else {
                    await sql`
            UPDATE cart_items 
            SET quantity = ${newQty}, user_id = NULL
            WHERE session_id = ${cleanSessionId} AND product_id = ${cleanProductId}
          `;
                }
            } else {
                // Safe INSERT
                if (userId !== null && userId !== undefined) {
                    await sql`
            INSERT INTO cart_items (session_id, user_id, product_id, quantity)
            VALUES (${cleanSessionId}, ${Number(userId)}, ${cleanProductId}, ${newQty})
          `;
                } else {
                    await sql`
            INSERT INTO cart_items (session_id, user_id, product_id, quantity)
            VALUES (${cleanSessionId}, NULL, ${cleanProductId}, ${newQty})
          `;
                }
            }

            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        if (action === 'get') {
            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

    } catch (err) {
        console.error('Cart error:', err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};

export const config = { path: '/api/cart' };