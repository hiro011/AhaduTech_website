// netlify/functions/cart.js
import { neon } from '@netlify/neon'
const sql = neon()

export default async (req) => {
    if (req.method === 'POST') {
        return handleAdd(req)
    }
    if (req.method === 'GET') {
        return handleGetCount(req)
    }
    return new Response('Method not allowed', { status: 405 })
}

// ADD TO CART
async function handleAdd(req) {
    try {
        const { userId, productId, quantity = 1 } = await req.json()

        if (!userId || !productId) {
            return new Response(JSON.stringify({ success: false, error: 'Login required' }), { status: 401 })
        }

        const uid = Number(userId)
        const pid = Number(productId)
        const qty = Number(quantity)

        // Check stock
        const productRows = await sql`SELECT stock FROM products WHERE id = ${pid}`
        if (productRows.length === 0 || productRows[0].stock < qty) {
            return new Response(JSON.stringify({ success: false, error: 'Out of stock' }), { status: 400 })
        }

        // UPSERT
        await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${uid}, ${pid}, ${qty})
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + ${qty}
    `

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (err) {
        console.error('Add to cart error:', err)
        return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 })
    }
}

// GET CART COUNT (for navbar)
async function handleGetCount(req) {
    try {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')
        if (!userId) return new Response(JSON.stringify({ count: 0 }))

        const rows = await sql`
      SELECT COALESCE(SUM(quantity), 0) as total 
      FROM cart_items 
      WHERE user_id = ${Number(userId)}
    `

        const count = Number(rows[0]?.total || 0)
        return new Response(JSON.stringify({ count }), { status: 200 })

    } catch (err) {
        console.error('Count error:', err)
        return new Response(JSON.stringify({ count: 0 }))
    }
}

export const config = { path: "/api/cart" }