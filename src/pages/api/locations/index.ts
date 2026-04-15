import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const VALID_LOCATION_TYPES = ['roadside', 'park', 'lot', 'playground', 'waterway', 'other'] as const;
const VALID_CLEANUP_TYPES = ['litter', 'leaf_removal', 'brush_clearing', 'weeding', 'other'] as const;

export const GET: APIRoute = async () => {
  const results = await env.DB.prepare(
    'SELECT id, latitude, longitude, title, description, location_type, cleanup_type, status, reported_by, reported_at FROM locations ORDER BY reported_at DESC'
  ).all();

  return new Response(JSON.stringify(results.results), {
    headers: { 'Content-Type': 'application/json' },
  });
};

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

  const { latitude, longitude, title, description, location_type, cleanup_type, reported_by } = body as {
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    location_type: string;
    cleanup_type: string;
    reported_by: string;
  };

  if (!latitude || !longitude || !title || !location_type || !cleanup_type || !reported_by) {
    return new Response(JSON.stringify({ error: 'Missing required fields: latitude, longitude, title, location_type, cleanup_type, reported_by' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!VALID_LOCATION_TYPES.includes(location_type as typeof VALID_LOCATION_TYPES[number])) {
    return new Response(JSON.stringify({ error: `Invalid location_type. Must be one of: ${VALID_LOCATION_TYPES.join(', ')}` }), {
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

  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return new Response(JSON.stringify({ error: 'latitude must be a number between -90 and 90' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return new Response(JSON.stringify({ error: 'longitude must be a number between -180 and 180' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await env.DB.prepare(
    'INSERT INTO locations (latitude, longitude, title, description, location_type, cleanup_type, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
  )
    .bind(latitude, longitude, title, description ?? null, location_type, cleanup_type, reported_by)
    .first();

  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
