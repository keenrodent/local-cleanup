import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { location_id, signup_id, notes } = body as {
    location_id: number;
    signup_id?: number;
    notes?: string;
  };

  if (!location_id) {
    return new Response(JSON.stringify({ error: 'Missing required field: location_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const location = await env.DB.prepare(
    'SELECT id, status FROM locations WHERE id = ?'
  ).bind(location_id).first();

  if (!location) {
    return new Response(JSON.stringify({ error: 'Location not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (location.status === 'cleaned') {
    return new Response(JSON.stringify({ error: 'This location has already been marked as cleaned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const completion = await env.DB.prepare(
    'INSERT INTO completions (location_id, signup_id, notes) VALUES (?, ?, ?) RETURNING *'
  ).bind(location_id, signup_id ?? null, notes ?? null).first();

  await env.DB.prepare(
    "UPDATE locations SET status = 'cleaned' WHERE id = ?"
  ).bind(location_id).run();

  return new Response(JSON.stringify(completion), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
