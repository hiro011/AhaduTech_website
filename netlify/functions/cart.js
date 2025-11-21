// netlify/functions/cart.js
import { neon } from '@netlify/neon';

export default async (req) => {
    const sql = neon(process.env.DATABASE_URL);

    try {
        const body = await req.json();
        const { action, sessionId, userId, productId, quantity } = body;

        // Helper: get cart (used by multiple actions)
        const getCart = async () => {
            const items = await sql`
        SELECT 
          ci.id,
          ci.product_id,
          ci.quantity,
          p.name,
          p.price,
          p.img,
          p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.session_id = ${sessionId}
          ${userId ? sql`OR ci.user_id = ${userId}` : sql``}
        ORDER BY ci.created_at DESC
      `;
            return items;
        };

        // ADD / UPDATE ITEM
        if (action === 'add') {
            const product = await sql`SELECT stock FROM products WHERE id = ${productId}`;
            if (product.length === 0) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });

            const current = await sql`
        SELECT quantity FROM cart_items 
        WHERE session_id = ${sessionId} AND product_id = ${productId}
      `;

            const newQty = (current[0]?.quantity || 0) + (quantity || 1);
            if (newQty > product[0].stock) {
                return new Response(JSON.stringify({ error: `Only ${product[0].stock} in stock` }), { status: 400 });
            }

            if (current.length > 0) {
                await sql`
          UPDATE cart_items 
          SET quantity = ${newQty}, user_id = ${userId || null}
          WHERE session_id = ${sessionId} AND product_id = ${productId}
        `;
            } else {
                await sql`
          INSERT INTO cart_items (session_id, user_id, product_id, quantity)
          VALUES (${sessionId}, ${userId || null}, ${productId}, ${newQty})
        `;
            }

            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        // REMOVE ITEM
        if (action === 'remove') {
            await sql`
        DELETE FROM cart_items 
        WHERE session_id = ${sessionId} AND product_id = ${productId}
      `;
            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        // CHANGE QUANTITY
        if (action === 'update') {
            const product = await sql`SELECT stock FROM products WHERE id = ${productId}`;
            if (quantity > product[0].stock) {
                return new Response(JSON.stringify({ error: 'Not enough stock' }), { status: 400 });
            }
            if (quantity <= 0) {
                await sql`DELETE FROM cart_items WHERE session_id = ${sessionId} AND product_id = ${productId}`;
            } else {
                await sql`
          UPDATE cart_items 
          SET quantity = ${quantity}, user_id = ${userId || null}
          WHERE session_id = ${sessionId} AND product_id = ${productId}
        `;
            }
            const cart = await getCart();
            return new Response(JSON.stringify({ success: true, cart }));
        }

        // GET CART (on page load)
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