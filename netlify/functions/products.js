import { neon } from '@netlify/neon';

export default async () => {
    const sql = neon();
    const products = await sql`SELECT * FROM products ORDER BY id`;
    return new Response(JSON.stringify(products), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const config = { path: '/api/products' };