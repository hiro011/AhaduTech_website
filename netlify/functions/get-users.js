import { neon } from '@netlify/neon';  // Uses NETLIFY_DATABASE_URL automatically

export default async (req) => {
  const sql = neon();  // Securely connects via env var

  try {
    // Example query: Fetch all users (create table first if needed via Neon console)
    const users = await sql`SELECT * FROM users`;
    
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Makes the function available at /api/get-users
export const config = { path: '/api/get-users' };