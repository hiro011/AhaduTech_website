// netlify/functions/product-detail.js
import { neon } from '@netlify/neon';
const sql = neon();

export default async (req, { params }) => {
  const { id } = params;
  const result = await sql`SELECT * FROM products WHERE id = ${id}`;
  if (result.length === 0) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(result[0]), { status: 200 });
};

export const config = { path: '/api/products/:id' }; 