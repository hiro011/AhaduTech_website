import { neon } from '@netlify/neon';
const sql = neon();

export default async (req) => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    let query;
    if (id) {
        query = sql`SELECT * FROM products WHERE id = ${id}`;
    } else {
        query = sql`SELECT * FROM products ORDER BY id`;
    }

    const products = await query;
    return new Response(JSON.stringify(products), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const config = { path: '/api/products' };