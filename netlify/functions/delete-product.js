// netlify/functions/delete-product.js
import { neon } from '@netlify/neon';

export default async (req, { params }) => {
  const sql = neon();
  const { id } = params;

  await sql`DELETE FROM products WHERE id = ${id}`;
  return new Response('OK', { status: 200 });
};

export const config = { path: '/api/products/:id' };