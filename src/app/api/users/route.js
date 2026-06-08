import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { getSession, authResponse } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session) return authResponse();
  if (session.role !== 'Admin' && session.role !== 'Manager') return authResponse('Not authorized.', 403);
  await connectDB();

  const users = await User.find().select('name email role department isActive createdAt').lean();
  return Response.json({ success: true, users });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  if (session.role !== 'Admin') return authResponse('Admin only.', 403);
  await connectDB();

  const { name, email, password, role, department } = await req.json();
  if (!name || !email || !password || !role) {
    return Response.json({ success: false, message: 'name, email, password, role are required.' }, { status: 400 });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return Response.json({ success: false, message: 'Email already in use.' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user   = await User.create({ name, email: email.toLowerCase(), password: hashed, role, department: department || '', isActive: true });

  const { password: _, ...safe } = user.toObject();
  return Response.json({ success: true, user: safe }, { status: 201 });
}
