import { connectDB } from '@/lib/db';
import ClientProfile from '@/lib/models/ClientProfile';
import User from '@/lib/models/User';
import { getSession, authResponse, signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const filter = {};
  if (search) filter.$or = [
    { name:    { $regex: search, $options: 'i' } },
    { company: { $regex: search, $options: 'i' } },
    { email:   { $regex: search, $options: 'i' } },
  ];
  const clients = await ClientProfile.find(filter).sort({ createdAt: -1 }).lean();
  return Response.json({ success: true, clients });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  if (!['Admin', 'SuperAdmin', 'Manager'].includes(session.role))
    return authResponse('Forbidden', 403);
  await connectDB();

  const body = await req.json();

  const client = await ClientProfile.create(body);

  if (body.createLogin && body.email && body.password) {
    const existing = await User.findOne({ email: body.email });
    if (!existing) {
      const user = await User.create({
        name:            body.name,
        email:           body.email,
        password:        body.password,
        role:            'Client',
        clientProfileId: client._id.toString(),
        isActive:        true,
      });
      await ClientProfile.findByIdAndUpdate(client._id, { userId: user._id });
    }
  }

  return Response.json({ success: true, client }, { status: 201 });
}
