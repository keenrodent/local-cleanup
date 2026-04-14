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

  const { location_id, volunteer_name, volunteer_email, planned_date } = body as {
    location_id: number;
    volunteer_name: string;
    volunteer_email: string;
    planned_date?: string;
  };

  if (!location_id || !volunteer_name || !volunteer_email) {
    return new Response(JSON.stringify({ error: 'Missing required fields: location_id, volunteer_name, volunteer_email' }), {
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
    return new Response(JSON.stringify({ error: 'This location has already been cleaned' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const signup = await env.DB.prepare(
    'INSERT INTO signups (location_id, volunteer_name, volunteer_email, planned_date) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(location_id, volunteer_name, volunteer_email, planned_date ?? null).first();

  await env.DB.prepare(
    "UPDATE locations SET status = 'claimed' WHERE id = ?"
  ).bind(location_id).run();

  return new Response(JSON.stringify(signup), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
