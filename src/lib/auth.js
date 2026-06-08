import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET;

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('leads_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function authResponse(message = 'Unauthorized', status = 401) {
  return Response.json({ success: false, message }, { status });
}
