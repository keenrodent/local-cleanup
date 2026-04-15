import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

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

  const task = await env.DB.prepare(
    'SELECT id, status FROM tasks WHERE id = ?'
  ).bind(id).first();

  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (task.status === 'done') {
    return new Response(JSON.stringify({ error: 'This task has already been completed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
