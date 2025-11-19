import { neon } from '@netlify/neon';
const sql = neon();

export default async (req) => {
  const { user_id, product_id } = await req.json();

  // Get current cart qty + product stock
  const [cartItem, product] = await Promise.all([
    sql`SELECT quantity FROM cart WHERE user_id = ${user_id} AND product_id = ${product_id}`,
    sql`SELECT stock FROM products WHERE id = ${product_id}`
  ]);

  const currentQty = cartItem[0]?.quantity || 0;
  const stock = product[0]?.stock || 0;

  if (currentQty >= stock) {
    return new Response(JSON.stringify({ full: true }), { status: 200 });
  }

  await sql`
    INSERT INTO cart (user_id, product_id, quantity)
    VALUES (${user_id}, ${product_id}, ${currentQty + 1})
    ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = ${currentQty + 1}
  `;

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const config = { path: '/api/cart/add' };