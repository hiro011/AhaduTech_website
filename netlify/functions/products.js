// netlify/functions/products.js
import { neon } from '@netlify/neon';

const sql = neon();

export default async (req) => {
    // POST = Add new product
    if (req.method === 'POST') {
        const { name, price, stock, image, description, phone } = await req.json();

        if (!name || !price || !image) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        await sql`
      INSERT INTO products (name, price, stock, image, description, phone)
      VALUES (${name}, ${price}, ${stock || 0}, ${image}, ${description || ''}, ${phone || '+251941057332'})
    `;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // GET = List all products (for dashboard)
    if (req.method === 'GET') {
        const products = await sql`SELECT * FROM products ORDER BY id DESC`;
        return new Response(JSON.stringify(products), { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/products' };