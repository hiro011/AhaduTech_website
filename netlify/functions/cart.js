// netlify/functions/cart.js
import { neon } from '@netlify/neon'
const sql = neon()

export default async (req) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

    try {
        const { userId, productId, quantity = 1 } = await req.json()

        if (!userId || !productId) {
            return new Response(JSON.stringify({ success: false, error: 'Login required' }), { status: 401 })
        }

        const uid = Number(userId)
        const pid = Number(productId)
        const qty = Number(quantity)

        // Check stock + current quantity in cart
        const productRows = await sql`SELECT stock FROM products WHERE id = ${pid}`
        if (productRows.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'Product not found' }), { status: 404 })
        }

        // Get how many this user already has in cart
        const cartRows = await sql`
            SELECT quantity FROM cart_items 
            WHERE user_id = ${uid} AND product_id = ${pid}
        `
        const currentInCart = cartRows.length > 0 ? cartRows[0].quantity : 0

        // If adding 1 more would exceed available stock
        if (currentInCart + qty > productRows[0].stock) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Maximum available quantity reached!'
            }), { status: 400 })
        }

        // Add to cart
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

export const config = { path: "/api/cart" }