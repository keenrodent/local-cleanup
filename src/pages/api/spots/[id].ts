import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const spot = await env.DB.prepare(
    'SELECT id, latitude, longitude, title, location_type, created_at FROM spots WHERE id = ?'
  ).bind(id).first();

  if (!spot) {
    return new Response(JSON.stringify({ error: 'Spot not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tasks = await env.DB.prepare(
    'SELECT id, spot_id, description, cleanup_type, status, added_at, completed_at, completion_notes FROM tasks WHERE spot_id = ? ORDER BY added_at DESC'
  ).bind(id).all();

  // Fetch signups for all tasks in this spot
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
