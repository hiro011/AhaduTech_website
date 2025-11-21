// NEW: netlify/functions/delete-product.js  ← USE THIS INSTEAD
import { neon } from '@netlify/neon';

const sql = neon();

export default async (req, { params }) => {
  const { id } = params;

  await sql`DELETE FROM products WHERE id = ${id}`;
  return new Response('Deleted', { status: 200 });
};

export const config = { path: '/api/admin/products/:id' };  // ← ADD /admin/ prefix!