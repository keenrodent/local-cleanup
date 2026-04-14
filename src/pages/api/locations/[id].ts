import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const location = await env.DB.prepare(
    'SELECT * FROM locations WHERE id = ?'
  ).bind(id).first();

  if (!location) {
    return new Response(JSON.stringify({ error: 'Location not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const signups = await env.DB.prepare(
    'SELECT * FROM signups WHERE location_id = ? ORDER BY signed_up_at DESC'
  ).bind(id).all();

  const completion = await env.DB.prepare(
    'SELECT * FROM completions WHERE location_id = ? ORDER BY completed_at DESC LIMIT 1'
  ).bind(id).first();

  return new Response(JSON.stringify({
    ...location,
    signups: signups.results,
    completion: completion ?? null,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
