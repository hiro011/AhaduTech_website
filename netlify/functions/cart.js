// netlify/functions/cart.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async (req) => {
    if (req.method !== 'POST') {
        return new Response('Only POST allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { userId, productId, quantity = 1 } = body;

        console.log('Received cart request:', body); // ← This will show in Netlify logs

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
        const productResult = await sql`SELECT stock FROM products WHERE id = ${pid}`;
        if (productResult.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'Product not found' }), { status: 404 });
        }
        if (productResult[0].stock < qty) {
            return new Response(JSON.stringify({ success: false, error: 'Not enough stock' }), { status: 400 });
        }

        // Add to cart (upsert)
        await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${uid}, ${pid}, ${qty})
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + ${qty}
    `;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('CART FUNCTION CRASH:', err);
        return new Response(JSON.stringify({ success: false, error: 'Server error', details: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const config = { path: "/api/cart" };