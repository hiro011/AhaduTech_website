if (req.method === 'DELETE') {
  const { comment_id, user_id } = await req.json();

  // Only allow owner to delete
  const result = await sql`
    DELETE FROM product_comments 
    WHERE id = ${comment_id} AND user_id = ${user_id}
    RETURNING id
  `;

  if (result.length === 0) {
    return new Response(JSON.stringify({ error: 'Not authorized or comment not found' }), { status: 403 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}