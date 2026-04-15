import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const VALID_CLEANUP_TYPES = ['litter', 'leaf_removal', 'brush_clearing', 'weeding', 'other'] as const;

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { description, cleanup_type, added_by } = body as {
    description?: string;
    cleanup_type: string;
    added_by: string;
  };

  if (!cleanup_type || !added_by) {
    return new Response(JSON.stringify({ error: 'Missing required fields: cleanup_type, added_by' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!VALID_CLEANUP_TYPES.includes(cleanup_type as typeof VALID_CLEANUP_TYPES[number])) {
    return new Response(JSON.stringify({ error: `Invalid cleanup_type. Must be one of: ${VALID_CLEANUP_TYPES.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify spot exists
  const spot = await env.DB.prepare('SELECT id FROM spots WHERE id = ?').bind(id).first();
  if (!spot) {
    return new Response(JSON.stringify({ error: 'Spot not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const task = await env.DB.prepare(
    'INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(id, description ?? null, cleanup_type, added_by).first();

  return new Response(JSON.stringify(task), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
