// netlify/functions/cart.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async (req) => {
  // Only allow POST for add, GET for count/view
  if (req.method === 'POST') {
    return handleAddToCart(req);
  }
  if (req.method === 'GET') {
    return handleGetCart(req);
  }

  return new Response('Method not allowed', { status: 405 });
};

// ——————————————————— ADD TO CART ———————————————————
async function handleAddToCart(req) {
  try {
    const { userId, productId, quantity = 1 } = await req.json();

    if (!userId || !productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Login required' }),
        { status: 401 }
      );
    }

    const cleanUserId = Number(userId);
    const cleanProductId = Number(productId);
    const cleanQty = Number(quantity);

    if (isNaN(cleanUserId) || isNaN(cleanProductId) || cleanQty < 1) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid data' }),
        { status: 400 }
      );
    }

    // Check stock
    const [product] = await sql`
      SELECT stock FROM products WHERE id = ${cleanProductId}
    `;

    if (!product) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found' }),
        { status: 404 }
      );
    }

    if (cleanQty > product.stock) {
      return new Response(
        JSON.stringify({ success: false, error: `Only ${product.stock} left in stock` }),
        { status: 400 }
      );
    }

    // UPSERT: Add or increase quantity (this is the magic line)
    await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${cleanUserId}, ${cleanProductId}, ${cleanQty})
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET 
        quantity = cart_items.quantity + ${cleanQty},
        updated_at = NOW()
      WHERE cart_items.quantity + ${cleanQty} <= (SELECT stock FROM products WHERE id = ${cleanProductId})
    `;

    // Final stock check after update (in case someone else bought it)
    const [final] = await sql`
      SELECT stock FROM products WHERE id = ${cleanProductId}
    `;

    if (cleanQty > final.stock) {
      return new Response(
        JSON.stringify({ success: false, error: 'Item just sold out!' }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (err) {
    console.error('Add to cart error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500 }
    );
  }
}

// ——————————————————— GET CART COUNT (for navbar) ———————————————————
async function handleGetCart(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ count: 0 }));
    }

    const cleanUserId = Number(userId);
    if (isNaN(cleanUserId)) {
      return new Response(JSON.stringify({ count: 0 }));
    }

    const [result] = await sql`
      SELECT COALESCE(SUM(quantity), 0) AS count
      FROM cart_items
      WHERE user_id = ${cleanUserId}
    `;

    return new Response(JSON.stringify({ count: Number(result.count) }));

  } catch (err) {
    console.error('Get cart count error:', err);
    return new Response(JSON.stringify({ count: 0 }));
  }
}

export const config = { path: '/api/cart' };