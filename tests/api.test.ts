import { describe, it, expect } from 'vitest';
import { BASE_URL } from './setup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(res: Response): Promise<any> {
  return res.json();
}

describe('GET /api/locations', () => {
  it('returns seeded locations', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(8);
  });

  it('each location has expected fields', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`);
    const data = await json(res);
    const loc = data[0];
    expect(loc).toHaveProperty('id');
    expect(loc).toHaveProperty('latitude');
    expect(loc).toHaveProperty('longitude');
    expect(loc).toHaveProperty('description');
    expect(loc).toHaveProperty('location_type');
    expect(loc).toHaveProperty('cleanup_type');
    expect(loc).toHaveProperty('status');
    expect(loc).toHaveProperty('reported_by');
    expect(loc).toHaveProperty('reported_at');
  });
});

describe('POST /api/locations', () => {
  it('creates a new location', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 44.95,
        longitude: -93.10,
        description: 'Test location from vitest',
        location_type: 'park',
        cleanup_type: 'litter',
        reported_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.description).toBe('Test location from vitest');
    expect(data.status).toBe('reported');
  });

  it('rejects missing fields', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 44.95 }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('Missing required fields');
  });

  it('rejects invalid location_type', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 44.95,
        longitude: -93.10,
        description: 'Bad type',
        location_type: 'moon_base',
        cleanup_type: 'litter',
        reported_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('Invalid location_type');
  });

  it('rejects invalid cleanup_type', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 44.95,
        longitude: -93.10,
        description: 'Bad cleanup',
        location_type: 'park',
        cleanup_type: 'nuclear_decontamination',
        reported_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('Invalid cleanup_type');
  });

  it('rejects out-of-range latitude', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 999,
        longitude: -93.10,
        description: 'Bad coords',
        location_type: 'park',
        cleanup_type: 'litter',
        reported_by: 'test@vitest.com',
      }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('latitude');
  });

  it('rejects invalid JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toBe('Invalid JSON');
  });
});

describe('GET /api/locations/[id]', () => {
  it('returns a location with signups and completion', async () => {
    // Location 4 has a signup in seed data
    const res = await fetch(`${BASE_URL}/api/locations/4`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.id).toBe(4);
    expect(data.signups).toBeInstanceOf(Array);
    expect(data.signups.length).toBeGreaterThan(0);
    expect(data).toHaveProperty('completion');
  });

  it('returns 404 for nonexistent location', async () => {
    const res = await fetch(`${BASE_URL}/api/locations/9999`);
    expect(res.status).toBe(404);
    const data = await json(res);
    expect(data.error).toBe('Location not found');
  });
});

describe('POST /api/signups', () => {
  it('signs up a volunteer and sets status to claimed', async () => {
    // Location 2 is "reported" in seed data
    const res = await fetch(`${BASE_URL}/api/signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: 2,
        volunteer_name: 'Vitest Volunteer',
        volunteer_email: 'volunteer@vitest.com',
        planned_date: '2026-05-01',
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.volunteer_name).toBe('Vitest Volunteer');

    // Verify status changed
    const loc = await fetch(`${BASE_URL}/api/locations/2`).then((r) => json(r));
    expect(loc.status).toBe('claimed');
  });

  it('rejects signup for nonexistent location', async () => {
    const res = await fetch(`${BASE_URL}/api/signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: 9999,
        volunteer_name: 'Nobody',
        volunteer_email: 'nobody@vitest.com',
      }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects signup for already-cleaned location', async () => {
    // Location 8 is "cleaned" in seed data
    const res = await fetch(`${BASE_URL}/api/signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: 8,
        volunteer_name: 'Late',
        volunteer_email: 'late@vitest.com',
      }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('already been cleaned');
  });

  it('rejects missing fields', async () => {
    const res = await fetch(`${BASE_URL}/api/signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_id: 1 }),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/completions', () => {
  it('marks a location as cleaned', async () => {
    // Location 3 is "reported" -- sign up first, then complete
    await fetch(`${BASE_URL}/api/signups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: 3,
        volunteer_name: 'Cleaner',
        volunteer_email: 'cleaner@vitest.com',
      }),
    });

    const res = await fetch(`${BASE_URL}/api/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: 3,
        notes: 'All clear!',
      }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.notes).toBe('All clear!');

    // Verify status changed
    const loc = await fetch(`${BASE_URL}/api/locations/3`).then((r) => json(r));
    expect(loc.status).toBe('cleaned');
  });

  it('rejects completion for already-cleaned location', async () => {
    // Location 8 is already "cleaned"
    const res = await fetch(`${BASE_URL}/api/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_id: 8 }),
    });
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toContain('already been marked as cleaned');
  });

  it('rejects completion for nonexistent location', async () => {
    const res = await fetch(`${BASE_URL}/api/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_id: 9999 }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects missing location_id', async () => {
    const res = await fetch(`${BASE_URL}/api/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'no location' }),
    });
    expect(res.status).toBe(400);
  });
});
