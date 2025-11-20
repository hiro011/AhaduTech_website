// netlify/functions/update-stock.js
import { neon } from '@netlify/neon';

export default async (req, { params }) => {
  const sql = neon();
  const { id } = params;
  const { stock } = await req.json();

  await sql`UPDATE products SET stock = ${stock} WHERE id = ${id}`;
  return new Response('OK', { status: 200 });
};

export const config = { path: '/api/products/:id/stock' };