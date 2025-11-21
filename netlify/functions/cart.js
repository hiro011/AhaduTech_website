// netlify/functions/cart.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { userId, productId, quantity = 1 } = await req.json();

        if (!userId || !productId) {
            return new Response(JSON.stringify({ success: false, error: 'Login required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const uid = Number(userId);
        const pid = Number(productId);
        const qty = Number(quantity);

        if (isNaN(uid) || isNaN(pid) || qty < 1) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid data' }), { status: 400 });
        }

        // Check stock
        const [product] = await sql`SELECT stock FROM products WHERE id = ${pid}`;
        if (!product || product.stock < qty) {
            return new Response(JSON.stringify({ success: false, error: 'Out of stock' }), { status: 400 });
        }

        // UPSERT into cart
        await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${uid}, ${pid}, ${qty})
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET 
        quantity = cart_items.quantity + ${qty},
        updated_at = NOW()
    `;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Cart function error:', err);
        return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const config = { path: '/api/cart' };