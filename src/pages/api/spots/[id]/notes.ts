import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { MAX_LENGTHS, validateStringLength, validateEmail, jsonError } from '../../../../lib/validation';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON');
  }

  const { note, added_by } = body as {
    note: string;
    added_by: string;
  };

  if (!note || !added_by) {
    return jsonError('Missing required fields: note, added_by');
  }

  const noteErr = validateStringLength(note, 'note', MAX_LENGTHS.notes);
  if (noteErr) return jsonError(noteErr);

  const emailErr = validateEmail(added_by);
  if (emailErr) return jsonError(emailErr);

  const spot = await env.DB.prepare('SELECT id FROM spots WHERE id = ? AND hidden = 0').bind(id).first();
  if (!spot) {
    return jsonError('Spot not found', 404);
  }

  const result = await env.DB.prepare(
    'INSERT INTO spot_notes (spot_id, note, added_by) VALUES (?, ?, ?) RETURNING id, spot_id, note, added_at'
  ).bind(id, note, added_by).first();

  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
