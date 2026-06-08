import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import Notification from '@/lib/models/Notification';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const platform = searchParams.get('platform');
  const clientId = searchParams.get('clientId');
  const month    = searchParams.get('month'); // YYYY-MM

  const filter = {};
  if (status)   filter.status = status;
  if (platform) filter.platforms = platform;
  if (clientId) filter.clientId = clientId;
  if (month) {
    const [y, m] = month.split('-').map(Number);
    filter.scheduledAt = {
      $gte: new Date(y, m - 1, 1),
      $lt:  new Date(y, m, 1),
    };
  }
  if (session.role === 'Client') filter.clientId = session.clientProfileId;

  const posts = await Post.find(filter).sort({ scheduledAt: 1, createdAt: -1 }).lean();
  const stats = {
    total:     posts.length,
    draft:     posts.filter(p => p.status === 'Draft').length,
    pending:   posts.filter(p => p.status === 'Pending Approval').length,
    approved:  posts.filter(p => p.status === 'Approved').length,
    published: posts.filter(p => p.status === 'Published').length,
    rejected:  posts.filter(p => p.status === 'Rejected').length,
  };
  return Response.json({ success: true, posts, stats });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const body = await req.json();
  const post = await Post.create({
    ...body,
    createdBy:   session.name,
    createdById: session.id,
    status:      body.status || 'Draft',
  });

  if (body.status === 'Pending Approval') {
    await Notification.create({
      userId: 'admin',
      type:   'approval_needed',
      title:  'New post needs approval',
      body:   `"${post.title}" by ${session.name}`,
      link:   '/approvals',
      postId: post._id.toString(),
    });
  }

  return Response.json({ success: true, post }, { status: 201 });
}
