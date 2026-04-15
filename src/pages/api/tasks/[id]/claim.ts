import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

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

  const { volunteer_name, volunteer_email, planned_date } = body as {
    volunteer_name: string;
    volunteer_email: string;
    planned_date?: string;
  };

  if (!volunteer_name || !volunteer_email) {
    return new Response(JSON.stringify({ error: 'Missing required fields: volunteer_name, volunteer_email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  const signup = await env.DB.prepare(
    'INSERT INTO signups (task_id, volunteer_name, volunteer_email, planned_date) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(id, volunteer_name, volunteer_email, planned_date ?? null).first();

  await env.DB.prepare(
    "UPDATE tasks SET status = 'claimed' WHERE id = ?"
  ).bind(id).run();

  return new Response(JSON.stringify(signup), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
