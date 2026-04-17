import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { MAX_LENGTHS, validateStringLength, validateEmail, jsonError } from '../../../lib/validation';

export const prerender = false;

const VALID_LOCATION_TYPES = ['roadside', 'park', 'lot', 'playground', 'waterway', 'other'] as const;
const VALID_CLEANUP_TYPES = ['litter', 'leaf_removal', 'brush_clearing', 'weeding', 'other'] as const;

export const GET: APIRoute = async () => {
  // Expire stale claims (older than 14 days)
  await env.DB.prepare(
    "UPDATE tasks SET status = 'open', claimed_at = NULL WHERE status = 'claimed' AND claimed_at IS NOT NULL AND claimed_at < datetime('now', '-14 days')"
  ).run();

  const results = await env.DB.prepare(`
    SELECT s.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN t.status = 'claimed' THEN 1 ELSE 0 END) as claimed_count,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count,
      (SELECT GROUP_CONCAT(DISTINCT t2.cleanup_type) FROM tasks t2 WHERE t2.spot_id = s.id AND t2.status != 'done') as active_cleanup_types
    FROM spots s
    LEFT JOIN tasks t ON t.spot_id = s.id
    WHERE s.hidden = 0
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all();

  const spots = results.results.map((s: Record<string, unknown>) => {
    const open = s.open_count as number;
    const claimed = s.claimed_count as number;
    const total = s.task_count as number;

    let pin_status: string;
    if (total === 0) pin_status = 'empty';
    else if (open > 0) pin_status = 'needs_help';
    else if (claimed > 0) pin_status = 'in_progress';
    else pin_status = 'all_done';

    return { ...s, pin_status };
  });

  return new Response(JSON.stringify(spots), {
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

  const { latitude, longitude, title, location_type, created_by } = body as {
    latitude: number;
    longitude: number;
    title: string;
    location_type: string;
    created_by: string;
  };

  if (!latitude || !longitude || !title || !location_type || !created_by) {
    return jsonError('Missing required fields: latitude, longitude, title, location_type, created_by');
  }

  const titleErr = validateStringLength(title, 'title', MAX_LENGTHS.title);
  if (titleErr) return jsonError(titleErr);

  const emailErr = validateEmail(created_by);
  if (emailErr) return jsonError(emailErr);

  if (!VALID_LOCATION_TYPES.includes(location_type as typeof VALID_LOCATION_TYPES[number])) {
    return new Response(JSON.stringify({ error: `Invalid location_type. Must be one of: ${VALID_LOCATION_TYPES.join(', ')}` }), {
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

  // Support both: tasks array or single description + cleanup_type
  let taskInputs: Array<{ description?: string; cleanup_type: string }>;
  if (Array.isArray(body.tasks)) {
    taskInputs = body.tasks as Array<{ description?: string; cleanup_type: string }>;
  } else if (body.cleanup_type) {
    taskInputs = [{ description: body.description as string | undefined, cleanup_type: body.cleanup_type as string }];
  } else {
    return new Response(JSON.stringify({ error: 'Must provide either tasks array or cleanup_type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate each task
  for (const task of taskInputs) {
    if (!task.cleanup_type || !VALID_CLEANUP_TYPES.includes(task.cleanup_type as typeof VALID_CLEANUP_TYPES[number])) {
      return jsonError(`Invalid cleanup_type. Must be one of: ${VALID_CLEANUP_TYPES.join(', ')}`);
    }
    const descErr = validateStringLength(task.description, 'description', MAX_LENGTHS.description);
    if (descErr) return jsonError(descErr);
  }

  // Create spot + tasks atomically
  const spotStmt = env.DB.prepare(
    'INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES (?, ?, ?, ?, ?) RETURNING *'
  ).bind(latitude, longitude, title, location_type, created_by);

  const results = await env.DB.batch([spotStmt]);
  const spot = (results[0].results as Record<string, unknown>[])[0];
  const spotId = spot.id as number;

  // Insert tasks
  const taskStmts = taskInputs.map((t) =>
    env.DB.prepare(
      'INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(spotId, t.description ?? null, t.cleanup_type, created_by)
  );

  const taskResults = await env.DB.batch(taskStmts);
  const tasks = taskResults.map((r) => (r.results as Record<string, unknown>[])[0]);

  return new Response(JSON.stringify({ ...spot, tasks }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
