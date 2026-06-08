'use client';
import { useState, useEffect } from 'react';

const PLATFORM_CFG = {
  Instagram: { bg:'bg-pink-500/15',    text:'text-pink-400'    },
  Facebook:  { bg:'bg-blue-500/15',    text:'text-blue-400'    },
  YouTube:   { bg:'bg-red-500/15',     text:'text-red-400'     },
  LinkedIn:  { bg:'bg-sky-500/15',     text:'text-sky-400'     },
  Twitter:   { bg:'bg-cyan-500/15',    text:'text-cyan-400'    },
  WhatsApp:  { bg:'bg-emerald-500/15', text:'text-emerald-400' },
};

function ApprovalCard({ post, onAction }) {
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const act = async (action) => {
    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    });
    const d = await res.json();
    if (d.success) onAction(post._id);
    setLoading(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        {/* Media thumb */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-200 shrink-0">
          {post.mediaUrls?.[0]
            ? <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-black text-slate-100">{post.title}</p>
              <p className="text-xs text-muted mt-0.5">By {post.createdBy} {post.client && `· ${post.client}`}</p>
            </div>
            <div className="flex gap-1 flex-wrap">
              {post.platforms?.map(p => {
                const c = PLATFORM_CFG[p];
                return <span key={p} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c?.bg} ${c?.text}`}>{p}</span>;
              })}
            </div>
          </div>

          {/* Caption preview */}
          <button onClick={() => setExpanded(e => !e)} className="text-left mt-2 w-full">
            <p className={`text-xs text-slate-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {post.caption || 'No caption'}
            </p>
            {post.caption?.length > 100 && (
              <span className="text-[10px] text-primary-light font-bold">{expanded ? 'Show less' : 'Show more'}</span>
            )}
          </button>

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.hashtags.slice(0,5).map(h => (
                <span key={h} className="text-[9px] font-bold bg-primary/10 text-primary-light px-1.5 py-0.5 rounded-full">#{h}</span>
              ))}
            </div>
          )}

          {/* Schedule */}
          {post.scheduledAt && (
            <p className="text-[10px] text-muted mt-2 flex items-center gap-1">
              📅 {new Date(post.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
          className="input text-xs resize-none" placeholder="Add feedback or revision notes…" />
        <div className="flex gap-2">
          <button onClick={() => act('approved')} disabled={loading}
            className="flex-1 btn-primary text-xs py-2.5 bg-emerald-600 hover:bg-emerald-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            Approve
          </button>
          <button onClick={() => act('revision_requested')} disabled={loading}
            className="flex-1 btn-ghost text-xs py-2.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
            ↩ Revision
          </button>
          <button onClick={() => act('rejected')} disabled={loading}
            className="flex-1 btn-danger text-xs py-2.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('Pending Approval');

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/posts?status=${encodeURIComponent(tab)}`);
    const d   = await res.json();
    if (d.success) setPosts(d.posts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const TABS = ['Pending Approval','Approved','Rejected','Draft'];

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100">Approvals</h1>
          <p className="text-sm text-muted mt-0.5">Review and approve content before publishing</p>
        </div>
        <span className="text-xs font-black bg-amber-500/15 text-amber-400 px-3 py-1.5 rounded-full">
          {posts.filter(p => p.status === 'Pending Approval').length} pending
        </span>
      </div>

      <div className="flex gap-1 bg-surface-200 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${tab===t?'bg-primary text-white':'text-muted hover:text-slate-300'}`}>
            {t === 'Pending Approval' ? '⏳ Pending' : t === 'Approved' ? '✓ Approved' : t === 'Rejected' ? '✕ Rejected' : '📝 Draft'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-40 skeleton" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">{tab === 'Pending Approval' ? '🎉' : '📭'}</p>
          <p className="font-black text-slate-300">
            {tab === 'Pending Approval' ? 'No pending approvals' : `No ${tab.toLowerCase()} posts`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posts.map(post => (
            <ApprovalCard key={post._id} post={post}
              onAction={id => setPosts(prev => prev.filter(p => p._id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
