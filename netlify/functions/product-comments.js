if (req.method === 'DELETE') {
  const { comment_id, user_id } = await req.json();

  // Convert user_id to string for safe comparison
  const userIdStr = String(user_id);

  const result = await sql`
    DELETE FROM product_comments 
    WHERE id = ${comment_id} 
      AND (
        user_id = ${userIdStr}::bigint    -- match owner
        OR ${userIdStr} = '0'             -- allow admin id 0 to delete ANY comment
      )
    RETURNING id
  `;

  if (result.length === 0) {
    return new Response(JSON.stringify({ error: 'Not authorized or comment not found' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}