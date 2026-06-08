import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { signToken, getSession, authResponse } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getSession();
  if (!session) return authResponse();
  return Response.json({ success: true, user: session });
}

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
  }
  if (!user.isActive) {
    return Response.json({ success: false, message: 'Account deactivated.' }, { status: 403 });
  }

  const token = signToken({ id: user._id, email: user.email, role: user.role, name: user.name });

  const cookieStore = cookies();
  cookieStore.set('leads_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  });

  return Response.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('leads_token');
  return Response.json({ success: true });
}
