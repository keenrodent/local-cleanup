import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { MAX_LENGTHS, validateStringLength, jsonError } from '../../../../lib/validation';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { notes } = body as { notes?: string };

  const notesErr = validateStringLength(notes, 'notes', MAX_LENGTHS.notes);
  if (notesErr) return jsonError(notesErr);

  const task = await env.DB.prepare(
    'SELECT id, status FROM tasks WHERE id = ?'
  ).bind(id).first();

  if (!task) {
    return jsonError('Task not found', 404);
  }

  if (task.status === 'done') {
    return jsonError('This task has already been completed');
  }

  // Walk-up complete: accept open or claimed tasks
  const updated = await env.DB.prepare(
    "UPDATE tasks SET status = 'done', completed_at = datetime('now'), completion_notes = ? WHERE id = ? RETURNING *"
  ).bind(notes ?? null, id).first();

  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
