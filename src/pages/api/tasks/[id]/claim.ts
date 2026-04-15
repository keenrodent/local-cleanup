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

  const { volunteer_name, volunteer_email, planned_date } = body as {
    volunteer_name: string;
    volunteer_email: string;
    planned_date?: string;
  };

  if (!volunteer_name || !volunteer_email) {
    return jsonError('Missing required fields: volunteer_name, volunteer_email');
  }

  const nameErr = validateStringLength(volunteer_name, 'volunteer_name', MAX_LENGTHS.name);
  if (nameErr) return jsonError(nameErr);

  const emailErr = validateEmail(volunteer_email);
  if (emailErr) return jsonError(emailErr);

  const task = await env.DB.prepare(
    'SELECT id, status FROM tasks WHERE id = ?'
  ).bind(id).first();

  if (!task) {
    return jsonError('Task not found', 404);
  }

  if (task.status === 'done') {
    return jsonError('This task has already been completed');
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
