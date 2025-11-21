// netlify/functions/cart-count.js
import { neon } from '@netlify/neon'
const sql = neon()

export default async (req) => {
    try {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return new Response(JSON.stringify({ count: 0 }), { status: 200 })
        }

        const rows = await sql`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM cart_items
      WHERE user_id = ${Number(userId)}
    `

        const count = Number(rows[0]?.total || 0)
        return new Response(JSON.stringify({ count }), { status: 200 })

    } catch (err) {
        console.error('cart-count error:', err)
        return new Response(JSON.stringify({ count: 0 }), { status: 200 })
    }
}

export const config = { path: "/api/cart-count" }  // ← matches fetch URL