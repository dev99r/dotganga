import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import Notification from '@/lib/models/Notification';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();
  const post = await Post.findById(params.id).lean();
  if (!post) return Response.json({ success: false, message: 'Not found' }, { status: 404 });
  return Response.json({ success: true, post });
}

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();
  const body = await req.json();
  const post = await Post.findByIdAndUpdate(params.id, body, { new: true });
  if (!post) return Response.json({ success: false, message: 'Not found' }, { status: 404 });
  return Response.json({ success: true, post });
}

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { action, comment } = await req.json();
  const post = await Post.findById(params.id);
  if (!post) return Response.json({ success: false, message: 'Not found' }, { status: 404 });

  const historyEntry = { action, by: session.name, byId: session.id, comment: comment || '', at: new Date() };
  post.approvalHistory.push(historyEntry);

  if (action === 'approved')            post.status = 'Approved';
  if (action === 'rejected')            post.status = 'Rejected';
  if (action === 'revision_requested')  post.status = 'Draft';
  if (action === 'submitted')           post.status = 'Pending Approval';

  await post.save();

  await Notification.create({
    userId: post.createdById,
    type:   action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'approval_needed',
    title:  action === 'approved' ? 'Post approved!' : action === 'rejected' ? 'Post rejected' : 'Revision requested',
    body:   `"${post.title}" — ${comment || ''}`,
    link:   '/social',
    postId: post._id.toString(),
  });

  return Response.json({ success: true, post });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  if (!['Admin', 'SuperAdmin', 'Manager'].includes(session.role))
    return authResponse('Forbidden', 403);
  await connectDB();
  await Post.findByIdAndDelete(params.id);
  return Response.json({ success: true });
}
