export const MAX_LENGTHS = {
  title: 200,
  description: 2000,
  email: 254,
  name: 200,
  notes: 2000,
} as const;

export function validateStringLength(value: string | undefined | null, field: string, max: number): string | null {
  if (value && value.length > max) {
    return `${field} must be ${max} characters or less`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  if (value.length > MAX_LENGTHS.email) {
    return `Email must be ${MAX_LENGTHS.email} characters or less`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email format';
  }
  return null;
}

export function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
