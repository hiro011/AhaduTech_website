import { neon } from '@netlify/neon';

export default async () => {
    const sql = neon();
    const [stats] = await sql`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM product_comments) as comments
  `;
    return new Response(JSON.stringify(stats));
};

export const config = { path: '/api/admin/stats' };