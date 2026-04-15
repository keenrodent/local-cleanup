import { describe, it, expect } from 'vitest';
import { BASE_URL } from './setup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(res: Response): Promise<any> {
  return res.json();
}

describe('GET /api/spots', () => {
  it('returns seeded spots with task counts', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(8);
  });

  it('each spot has pin_status and task counts', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`);
    const data = await json(res);
    const spot = data[0];
    expect(spot).toHaveProperty('id');
    expect(spot).toHaveProperty('title');
    expect(spot).toHaveProperty('location_type');
    expect(spot).toHaveProperty('pin_status');
    expect(spot).toHaveProperty('task_count');
    expect(spot).toHaveProperty('open_count');
    expect(spot).toHaveProperty('claimed_count');
    expect(spot).toHaveProperty('done_count');
  });

  it('derives pin_status correctly', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`);
    const data = await json(res);

    // Kaposia Landing (id 8) -- all tasks done
    const allDone = data.find((s: any) => s.id === 8);
    expect(allDone.pin_status).toBe('all_done');

    // Rice Park (id 1) -- has open tasks
    const needsHelp = data.find((s: any) => s.id === 1);
    expect(needsHelp.pin_status).toBe('needs_help');

    // Highland Park playground (id 4) -- all tasks claimed
    const inProgress = data.find((s: any) => s.id === 4);
    expect(inProgress.pin_status).toBe('in_progress');
  });
});

describe('POST /api/spots', () => {
  it('creates a spot with a single task', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 44.95,
        longitude: -93.10,
        title: 'Test spot',
        location_type: 'park',
        cleanup_type: 'litter',
        description: 'Some litter here',
        created_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.title).toBe('Test spot');
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].cleanup_type).toBe('litter');
    expect(data.tasks[0].status).toBe('open');
  });

  it('creates a spot with multiple tasks', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 44.96,
        longitude: -93.11,
        title: 'Multi-task spot',
        location_type: 'roadside',
        created_by: 'test@vitest.com',
        tasks: [
          { description: 'Pick up litter', cleanup_type: 'litter' },
          { description: 'Pull weeds', cleanup_type: 'weeding' },
        ],
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.tasks).toHaveLength(2);
  });

  it('rejects missing fields', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 44.95 }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid location_type', async () => {
    const res = await fetch(`${BASE_URL}/api/spots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 44.95, longitude: -93.10,
        title: 'Bad', location_type: 'moon_base',
        cleanup_type: 'litter', created_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/spots/[id]', () => {
  it('returns spot with nested tasks and signups', async () => {
    // Spot 3 (Trout Brook) has a claimed task with a signup
    const res = await fetch(`${BASE_URL}/api/spots/3`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.id).toBe(3);
    expect(data.tasks).toBeInstanceOf(Array);
    expect(data.tasks.length).toBe(2);

    const claimedTask = data.tasks.find((t: any) => t.status === 'claimed');
    expect(claimedTask).toBeDefined();
    expect(claimedTask.signups.length).toBeGreaterThan(0);
  });

  it('returns 404 for nonexistent spot', async () => {
    const res = await fetch(`${BASE_URL}/api/spots/9999`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/spots/[id]/tasks', () => {
  it('adds a task to an existing spot', async () => {
    const res = await fetch(`${BASE_URL}/api/spots/1/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cleanup_type: 'other',
        description: 'New task added via test',
        added_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.spot_id).toBe(1);
    expect(data.status).toBe('open');
  });

  it('returns 404 for nonexistent spot', async () => {
    const res = await fetch(`${BASE_URL}/api/spots/9999/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cleanup_type: 'litter',
        added_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/tasks/[id]/claim', () => {
  it('claims a task and sets status to claimed', async () => {
    // Task 1 (Rice Park litter) is open
    const res = await fetch(`${BASE_URL}/api/tasks/1/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        volunteer_name: 'Test Volunteer',
        volunteer_email: 'vol@vitest.com',
        planned_date: '2026-05-01',
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.volunteer_name).toBe('Test Volunteer');

    // Verify task status changed
    const spot = await fetch(`${BASE_URL}/api/spots/1`).then((r) => json(r));
    const task = spot.tasks.find((t: any) => t.id === 1);
    expect(task.status).toBe('claimed');
  });

  it('rejects claiming a done task', async () => {
    // Task 11 (Kaposia brush clearing) is done in seed
    const res = await fetch(`${BASE_URL}/api/tasks/11/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        volunteer_name: 'Late',
        volunteer_email: 'late@vitest.com',
      }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('already been completed');
  });

  it('rejects missing fields', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/2/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteer_name: 'Only name' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent task', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/9999/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        volunteer_name: 'Ghost',
        volunteer_email: 'ghost@vitest.com',
      }),
    });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/tasks/[id]/complete', () => {
  it('completes a claimed task', async () => {
    // Task 4 (Trout Brook brush) is claimed in seed
    const res = await fetch(`${BASE_URL}/api/tasks/4/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'All cleared!' }),
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.status).toBe('done');
    expect(data.completion_notes).toBe('All cleared!');
  });

  it('allows walk-up complete of an open task', async () => {
    // Task 2 (Rice Park weeds) is open
    const res = await fetch(`${BASE_URL}/api/tasks/2/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.status).toBe('done');
  });

  it('rejects completing an already-done task', async () => {
    // Task 11 (Kaposia) is done in seed
    const res = await fetch(`${BASE_URL}/api/tasks/11/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('already been completed');
  });

  it('returns 404 for nonexistent task', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/9999/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
  });
});
