import { connectDB } from '@/lib/db';
import ClientProfile from '@/lib/models/ClientProfile';
import Post from '@/lib/models/Post';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const client = await ClientProfile.findById(params.id).lean();
  if (!client) return Response.json({ success: false }, { status: 404 });

  const posts = await Post.find({ clientId: params.id }).sort({ createdAt: -1 }).limit(10).lean();
  const stats = {
    totalPosts:     await Post.countDocuments({ clientId: params.id }),
    published:      await Post.countDocuments({ clientId: params.id, status: 'Published' }),
    pending:        await Post.countDocuments({ clientId: params.id, status: 'Pending Approval' }),
    scheduled:      await Post.countDocuments({ clientId: params.id, status: 'Scheduled' }),
  };

  return Response.json({ success: true, client, posts, stats });
}

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();
  const body = await req.json();
  const client = await ClientProfile.findByIdAndUpdate(params.id, body, { new: true });
  return Response.json({ success: true, client });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  if (!['Admin', 'SuperAdmin'].includes(session.role)) return authResponse('Forbidden', 403);
  await connectDB();
  await ClientProfile.findByIdAndDelete(params.id);
  return Response.json({ success: true });
}
