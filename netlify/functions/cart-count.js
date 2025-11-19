import { neon } from '@netlify/neon';
const sql = neon();

export default async (req) => {
  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');

  const result = await sql`
    SELECT COALESCE(SUM(quantity), 0) as count 
    FROM cart WHERE user_id = ${user_id}
  `;

  return new Response(JSON.stringify({ count: Number(result[0].count) }));
};

export const config = { path: '/api/cart/count' };