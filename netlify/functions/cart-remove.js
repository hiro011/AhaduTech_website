// netlify/functions/cart-remove.js
import { neon } from '@netlify/neon'
const sql = neon()

export default async (req) => {
  const { userId, productId } = await req.json()
  await sql`DELETE FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId}`
  return new Response(JSON.stringify({ success: true }))
}

export const config = { path: "/api/cart-remove" }