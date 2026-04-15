import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { MAX_LENGTHS, validateStringLength, validateEmail, jsonError } from '../../../../lib/validation';

export const prerender = false;

const VALID_CLEANUP_TYPES = ['litter', 'leaf_removal', 'brush_clearing', 'weeding', 'other'] as const;

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON');
  }

  const { description, cleanup_type, added_by } = body as {
    description?: string;
    cleanup_type: string;
    added_by: string;
  };

  if (!cleanup_type || !added_by) {
    return jsonError('Missing required fields: cleanup_type, added_by');
  }

  const descErr = validateStringLength(description, 'description', MAX_LENGTHS.description);
  if (descErr) return jsonError(descErr);

  const emailErr = validateEmail(added_by);
  if (emailErr) return jsonError(emailErr);

  if (!VALID_CLEANUP_TYPES.includes(cleanup_type as typeof VALID_CLEANUP_TYPES[number])) {
    return jsonError(`Invalid cleanup_type. Must be one of: ${VALID_CLEANUP_TYPES.join(', ')}`);
  }

  // Verify spot exists
  const spot = await env.DB.prepare('SELECT id FROM spots WHERE id = ?').bind(id).first();
  if (!spot) {
    return jsonError('Spot not found', 404);
  }

  const task = await env.DB.prepare(
    'INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(id, description ?? null, cleanup_type, added_by).first();

  return new Response(JSON.stringify(task), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
