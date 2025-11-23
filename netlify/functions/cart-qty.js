// netlify/functions/cart-qty.js
import { neon } from '@netlify/neon'
const sql = neon()

export default async (req) => {
  if (req.method !== 'POST') return new Response('Only POST', { status: 405 })

  try {
    const { userId, productId, change } = await req.json()
    const uid = Number(userId)
    const pid = Number(productId)

    // Get current quantity and stock
    const [cartItem] = await sql`
      SELECT c.quantity, p.stock 
      FROM cart_items c 
      JOIN products p ON p.id = c.product_id 
      WHERE c.user_id = ${uid} AND c.product_id = ${pid}
    `

    if (!cartItem) {
      return new Response(JSON.stringify({ success: false, error: 'Item not in cart' }), { status: 400 })
    }

    const newQty = cartItem.quantity + change

    if (newQty < 1) {
      // Remove if goes to 0
      await sql`DELETE FROM cart_items WHERE user_id = ${uid} AND product_id = ${pid}`
    } else if (newQty > cartItem.stock) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Only ${cartItem.stock} in stock!` 
      }), { status: 400 })
    } else {
      // Update quantity
      await sql`
        UPDATE cart_items 
        SET quantity = ${newQty} 
        WHERE user_id = ${uid} AND product_id = ${pid}
      `
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 })
  }
}

export const config = { path: "/api/cart-qty" }