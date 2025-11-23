// netlify/functions/cart-items.js
import { neon } from '@netlify/neon'
const sql = neon()

export default async (req) => {
  const userId = req.url.split('userId=')[1]
  const rows = await sql`
    SELECT c.product_id as id, p.name, p.price, p.image, p.stock, c.quantity
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ${userId}
  `
  return new Response(JSON.stringify(rows))
}

export const config = { path: "/api/cart-items" }