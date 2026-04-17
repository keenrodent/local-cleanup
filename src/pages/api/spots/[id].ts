import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ADMIN_TOKEN } from 'astro:env/server';
import { jsonError } from '../../../lib/validation';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const spot = await env.DB.prepare(
    'SELECT id, latitude, longitude, title, location_type, created_at, hidden FROM spots WHERE id = ?'
  ).bind(id).first();

  if (!spot || (spot.hidden && !isAdmin(null))) {
    return jsonError('Spot not found', 404);
  }

  const tasks = await env.DB.prepare(
    'SELECT id, spot_id, description, cleanup_type, status, added_at, completed_at, completion_notes FROM tasks WHERE spot_id = ? ORDER BY added_at DESC'
  ).bind(id).all();

  const taskIds = tasks.results.map((t: Record<string, unknown>) => t.id);
  let signupsByTask: Record<number, Record<string, unknown>[]> = {};

  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => '?').join(',');
    const signups = await env.DB.prepare(
      `SELECT id, task_id, volunteer_name, signed_up_at, planned_date FROM signups WHERE task_id IN (${placeholders}) ORDER BY signed_up_at DESC`
    ).bind(...taskIds).all();

    for (const s of signups.results as Record<string, unknown>[]) {
      const tid = s.task_id as number;
      if (!signupsByTask[tid]) signupsByTask[tid] = [];
      signupsByTask[tid].push(s);
    }
  }

  const tasksWithSignups = tasks.results.map((t: Record<string, unknown>) => ({
    ...t,
    signups: signupsByTask[t.id as number] ?? [],
  }));

  return new Response(JSON.stringify({
    ...spot,
    tasks: tasksWithSignups,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token || token !== ADMIN_TOKEN) {
    return jsonError('Unauthorized', 401);
  }

  const { id } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON');
  }

  if (typeof body.hidden !== 'boolean') {
    return jsonError('Must provide { hidden: true/false }');
  }

  const spot = await env.DB.prepare('SELECT id FROM spots WHERE id = ?').bind(id).first();
  if (!spot) {
    return jsonError('Spot not found', 404);
  }

  await env.DB.prepare(
    'UPDATE spots SET hidden = ? WHERE id = ?'
  ).bind(body.hidden ? 1 : 0, id).run();

  return new Response(JSON.stringify({ id, hidden: body.hidden }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function isAdmin(_token: string | null): boolean {
  // For GET requests, we don't pass the token -- hidden spots just 404
  return false;
}
