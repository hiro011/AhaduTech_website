// netlify/functions/admin-update-product.js
import { neon } from '@netlify/neon';
const sql = neon(process.env.DATABASE_URL);

const ADMIN_TOKEN = process.env.ADMIN_SECRET_KEY; // Set in Netlify > Environment Variables

export default async (req, { params }) => {
  // Admin-only protection
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (req.method !== 'PUT') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { id } = params;
  const body = await req.json();

  const { name, price, stock, description, image } = body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name'); values.push(name); }
  if (price !== undefined) { updates.push('price'); values.push(price); }
  if (stock !== undefined) { updates.push('stock'); values.push(stock); }
  if (description !== undefined) { updates.push('description'); values.push(description); }
  if (image !== undefined) { updates.push('image'); values.push(image); }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: 'No changes' }), { status: 400 });
  }

  const setClause = updates.map((col, i) => `${col} = $${i + 1}`).join(', ');
  const query = `UPDATE products SET ${setClause} WHERE id = $${updates.length + 1} RETURNING id`;

  const result = await sql(query, [...values, id]);

  if (result.length === 0) {
    return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const config = {
  path: '/api/admin/products/:id',
  method: 'PUT'
};