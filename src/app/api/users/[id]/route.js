import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { getSession, authResponse } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  if (session.role !== 'Admin') return authResponse('Admin only.', 403);
  await connectDB();

  const body = await req.json();
  const user = await User.findById(params.id);
  if (!user) return Response.json({ success: false, message: 'User not found.' }, { status: 404 });

  if (body.name)       user.name       = body.name;
  if (body.role)       user.role       = body.role;
  if (body.department !== undefined) user.department = body.department;
  if (body.isActive   !== undefined) user.isActive   = body.isActive;
  if (body.password) {
    user.password = await bcrypt.hash(body.password, 10);
  }

  await user.save();
  const { password: _, ...safe } = user.toObject();
  return Response.json({ success: true, user: safe });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  if (session.role !== 'Admin') return authResponse('Admin only.', 403);
  await connectDB();

  await User.findByIdAndUpdate(params.id, { isActive: false });
  return Response.json({ success: true });
}
