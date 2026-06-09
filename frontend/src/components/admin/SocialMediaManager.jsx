import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isSameMonth, addMonths, subMonths, addDays,
  startOfWeek, endOfWeek, isBefore, startOfDay,
} from 'date-fns';

// ─── Config ───────────────────────────────────────────────────────────────────
const PLATFORMS  = ['Instagram','Facebook','LinkedIn','Twitter','YouTube','WhatsApp'];
const CATEGORIES = ['Reel','Carousel','Story','Organic','Ad Creative','Other'];

const CAT = {
  Reel:         { icon:'🎬', grad:'from-pink-500 to-rose-600',    light:'bg-pink-50 text-pink-700',      dot:'bg-pink-500',    bar:'bg-pink-500'    },
  Carousel:     { icon:'🎠', grad:'from-violet-500 to-purple-600',light:'bg-violet-50 text-violet-700',  dot:'bg-violet-500',  bar:'bg-violet-500'  },
  Story:        { icon:'📱', grad:'from-blue-500 to-cyan-600',    light:'bg-blue-50 text-blue-700',      dot:'bg-blue-500',    bar:'bg-blue-500'    },
  Organic:      { icon:'📸', grad:'from-emerald-500 to-teal-600', light:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500', bar:'bg-emerald-500' },
  'Ad Creative':{ icon:'🎯', grad:'from-orange-500 to-red-600',   light:'bg-orange-50 text-orange-700',  dot:'bg-orange-500',  bar:'bg-orange-500'  },
  Other:        { icon:'📋', grad:'from-slate-500 to-slate-700',  light:'bg-slate-100 text-slate-600',   dot:'bg-slate-500',   bar:'bg-slate-500'   },
};
const getCat = k => CAT[k] || CAT.Other;

const PLATFORM_ICONS = { Instagram:'📸', Facebook:'📘', LinkedIn:'💼', Twitter:'🐦', YouTube:'▶️', WhatsApp:'💬' };
const PLATFORM_COLORS = { Instagram:'bg-pink-50 text-pink-600', Facebook:'bg-blue-50 text-blue-600', LinkedIn:'bg-sky-50 text-sky-700', Twitter:'bg-slate-50 text-slate-700', YouTube:'bg-red-50 text-red-600', WhatsApp:'bg-emerald-50 text-emerald-600' };

const APPROVAL_CFG = {
  Pending:  { bg:'bg-amber-400',   badge:'bg-amber-100 text-amber-700',   icon:'⏳', label:'Pending'  },
  Approved: { bg:'bg-emerald-500', badge:'bg-emerald-100 text-emerald-700',icon:'✅', label:'Approved' },
  Rejected: { bg:'bg-red-500',     badge:'bg-red-100 text-red-700',        icon:'❌', label:'Rejected' },
  Revision: { bg:'bg-violet-500',  badge:'bg-violet-100 text-violet-700',  icon:'✏️', label:'Revision' },
};

const DEFAULT_TARGETS = { Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 };

// ─── CategoryChip ─────────────────────────────────────────────────────────────
function CategoryChip({ category, size = 'sm' }) {
  const c  = getCat(category);
  const sz = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-xs px-1.5 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full ${sz} ${c.light}`}>
      {c.icon} {category}
    </span>
  );
}

// ─── QuotaBar ─────────────────────────────────────────────────────────────────
function QuotaBar({ posts, client }) {
  const targets = useMemo(() => ({ ...DEFAULT_TARGETS, ...(client?.contentTargets || {}) }), [client]);
  const counts  = useMemo(() => {
    const m = {};
    posts.forEach(p => { m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [posts]);
  const done  = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = Object.values(targets).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-black text-slate-800">Monthly Blueprint</p>
          {client && <p className="text-xs text-slate-400 mt-0.5">{client.businessName}</p>}
        </div>
        <div className="text-right">
          <span className="text-base font-black text-slate-800">{done}</span>
          <span className="text-xs text-slate-400">/{total} posts</span>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {Object.entries(targets).map(([cat, target]) => {
          const cnt  = counts[cat] || 0;
          const pct  = Math.min(Math.round((cnt / target) * 100), 100);
          const c    = getCat(cat);
          const over = cnt >= target;
          return (
            <div key={cat} className="text-center">
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${c.grad} rounded-full transition-all duration-700`} style={{ width:`${pct}%` }}/>
              </div>
              <p className={`text-xs font-black ${over ? 'text-emerald-600' : 'text-slate-800'}`}>
                {cnt}<span className="font-normal text-slate-400">/{target}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.icon} {cat}</p>
              {over && <span className="text-[10px] text-emerald-500 font-black">✓ Done</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MiniPostCard ─────────────────────────────────────────────────────────────
function MiniPostCard({ post, onClick }) {
  const c  = getCat(post.category);
  const ap = APPROVAL_CFG[post.approvalStatus];
  return (
    <button onClick={e => { e.stopPropagation(); onClick(post); }}
      className="w-full text-left rounded-lg overflow-hidden border border-white/20 hover:scale-[1.02] transition-transform">
      <div className={`bg-gradient-to-br ${c.grad} px-2 py-1.5`}>
        <div className="flex items-center gap-1">
          <span className="text-white text-xs">{c.icon}</span>
          <span className="text-white text-xs font-black truncate flex-1">{post.category}</span>
          <div className="flex gap-0.5">
            {post.platforms?.slice(0, 2).map(p => <span key={p} className="text-white text-xs">{PLATFORM_ICONS[p]}</span>)}
          </div>
        </div>
        {post.caption && <p className="text-white/80 text-[10px] mt-0.5 leading-tight line-clamp-1">{post.caption.slice(0, 40)}</p>}
      </div>
      <div className={`h-0.5 w-full ${ap?.bg || 'bg-slate-300'}`}/>
    </button>
  );
}

// ─── DayCell ─────────────────────────────────────────────────────────────────
function DayCell({ day, posts, isCurrentMonth, onAddPost, onPostClick, selectedDay, onSelect }) {
  const dayPosts  = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), day));
  const isSel     = selectedDay && isSameDay(day, selectedDay);
  const todayClass = isToday(day) ? 'bg-blue-950 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300';
  const cellBg    = isToday(day) ? 'bg-blue-50/40' : isSel ? 'bg-indigo-50' : !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white';

  return (
    <div className={`border-r border-b border-slate-100 ${cellBg} group relative flex flex-col cursor-pointer min-h-[52px] sm:min-h-[110px] transition-colors duration-100`}
      onClick={() => isCurrentMonth && onSelect(day)}>
      <div className="flex items-start justify-between p-1 sm:p-1.5">
        <span className={`text-xs sm:text-sm font-black w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all ${todayClass}`}>
          {format(day, 'd')}
        </span>
        {isCurrentMonth && (
          <button onClick={e => { e.stopPropagation(); onAddPost(day); }}
            className="hidden sm:flex opacity-0 group-hover:opacity-100 w-5 h-5 bg-blue-950 text-white rounded-full text-[10px] font-black items-center justify-center transition-all hover:scale-110">
            +
          </button>
        )}
      </div>
      {dayPosts.length > 0 && (
        <div className="flex flex-wrap gap-0.5 px-1 pb-1 sm:hidden">
          {dayPosts.slice(0, 5).map(post => <div key={post._id} className={`w-1.5 h-1.5 rounded-full ${getCat(post.category).dot}`}/>)}
          {dayPosts.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>}
        </div>
      )}
      <div className="hidden sm:block flex-1 px-1 pb-1 space-y-0.5 overflow-hidden">
        {dayPosts.slice(0, 3).map(post => <MiniPostCard key={post._id} post={post} onClick={onPostClick}/>)}
        {dayPosts.length > 3 && <div className="text-[10px] text-slate-400 font-bold text-center py-0.5">+{dayPosts.length - 3} more</div>}
      </div>
    </div>
  );
}

// ─── PostDrawer ───────────────────────────────────────────────────────────────
function PostDrawer({ post, onClose, onUpdate, onDelete, onEdit, onDuplicate }) {
  const [loading, setLoading] = useState(false);
  const [markingPosted, setMarkingPosted] = useState(false);
  const c  = getCat(post.category);
  const ap = APPROVAL_CFG[post.approvalStatus];

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      await api.patch(`/posts/${post._id}/approve`, { status });
      toast.success(`Post ${status.toLowerCase()}`);
      onUpdate();
    } catch { toast.error('Failed.'); }
    finally { setLoading(false); }
  };

  const markPosted = async () => {
    setMarkingPosted(true);
    try {
      await api.put(`/posts/${post._id}`, { status: 'Posted', postedAt: new Date() });
      toast.success('✅ Marked as Posted!');
      onUpdate();
    } catch { toast.error('Failed.'); }
    finally { setMarkingPosted(false); }
  };

  const del = async () => {
    if (!confirm('Delete this post?')) return;
    try { await api.delete(`/posts/${post._id}`); toast.success('Deleted.'); onDelete(); }
    catch { toast.error('Failed.'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-br ${c.grad} px-6 py-5 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{c.icon}</span>
                <h2 className="text-lg font-black">{post.category}</h2>
                {post.aiGenerated && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">✨ AI</span>}
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs flex-wrap">
                {post.platforms?.map(p => <span key={p}>{PLATFORM_ICONS[p]} {p}</span>)}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          {post.scheduledDate && (
            <p className="text-white/70 text-xs mt-3">📅 {format(new Date(post.scheduledDate), 'EEEE, dd MMMM yyyy · HH:mm')}</p>
          )}
        </div>

        {/* Status bar */}
        <div className="px-6 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${ap?.badge || 'bg-slate-100 text-slate-600'}`}>
              {ap?.icon} {post.approvalStatus}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              post.status === 'Posted' ? 'bg-emerald-100 text-emerald-700' :
              post.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-500'}`}>
              {post.status}
            </span>
          </div>
          {post.status === 'Scheduled' && (
            <button onClick={markPosted} disabled={markingPosted}
              className="text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 active:scale-95">
              {markingPosted ? '…' : '✅ Mark Posted'}
            </button>
          )}
        </div>

        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
          {/* Media */}
          {post.mediaUrls?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.mediaUrls.map((url, i) => <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-2xl bg-slate-100"/>)}
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Caption</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
              {post.hashtags && <p className="text-xs text-blue-500 mt-2">{post.hashtags}</p>}
            </div>
          )}

          {/* Script */}
          {(post.script?.hook || post.script?.body || post.script?.voiceover) && (
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 space-y-3">
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider">📝 Content Script</p>
              {post.script?.hook && <div><p className="text-[10px] font-black text-violet-400 uppercase mb-1">🪝 Hook</p><p className="text-sm text-violet-800 font-medium">{post.script.hook}</p></div>}
              {post.script?.body && <div><p className="text-[10px] font-black text-violet-400 uppercase mb-1">📖 Body</p><p className="text-xs text-violet-700 whitespace-pre-wrap leading-relaxed">{post.script.body}</p></div>}
              {post.script?.cta  && <div><p className="text-[10px] font-black text-violet-400 uppercase mb-1">📣 CTA</p><p className="text-sm text-violet-800 font-medium">{post.script.cta}</p></div>}
              {post.script?.textOverlays?.length > 0 && (
                <div><p className="text-[10px] font-black text-violet-400 uppercase mb-1.5">💬 Text Overlays</p>
                  {post.script.textOverlays.map((t, i) => <div key={i} className="bg-violet-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-1 inline-block mr-1">{t}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Video links */}
          {post.videoUrls?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎬 Video Files</p>
              {post.videoUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5 hover:bg-pink-100 transition-colors">
                  <span className="text-base">🎬</span>
                  <p className="flex-1 text-xs text-pink-700 truncate">{url}</p>
                  <span className="text-[10px] text-pink-500 font-bold shrink-0">Open →</span>
                </a>
              ))}
            </div>
          )}

          {/* Notes */}
          {post.notes && (
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Internal Notes</p>
              <p className="text-xs text-amber-800">{post.notes}</p>
            </div>
          )}

          {/* Approval note */}
          {post.approvalNote && (
            <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
              <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Client Feedback</p>
              <p className="text-xs text-red-700 italic">"{post.approvalNote}"</p>
            </div>
          )}

          {/* Approval actions */}
          {post.approvalStatus === 'Pending' && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => changeStatus('Approved')} disabled={loading}
                className="py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-colors disabled:opacity-50">✓ Approve</button>
              <button onClick={() => changeStatus('Revision')} disabled={loading}
                className="py-2.5 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-black transition-colors disabled:opacity-50">✏️ Revise</button>
              <button onClick={() => changeStatus('Rejected')} disabled={loading}
                className="py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black transition-colors disabled:opacity-50">✕ Reject</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => onEdit(post)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2.5 rounded-xl transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Edit
            </button>
            <button onClick={() => onDuplicate(post)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 rounded-xl transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Duplicate
            </button>
            <button onClick={del} className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          <button onClick={onClose} className="w-full py-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── ApprovalsView ────────────────────────────────────────────────────────────
function ApprovalsView({ posts, clients, onRefresh, onPostClick }) {
  const pending = useMemo(() => posts.filter(p => p.approvalStatus === 'Pending'), [posts]);
  const revision = useMemo(() => posts.filter(p => p.approvalStatus === 'Revision'), [posts]);

  const ApprovalCard = ({ post }) => {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);
    const c  = getCat(post.category);
    const client = clients.find(cl => cl._id === (post.clientId?._id || post.clientId));

    const act = async (status) => {
      setLoading(true);
      try {
        await api.patch(`/posts/${post._id}/approve`, { status, note });
        toast.success(status === 'Approved' ? '✅ Approved!' : status === 'Rejected' ? '❌ Rejected' : '✏️ Revision requested');
        setNote('');
        onRefresh();
      } catch { toast.error('Failed.'); }
      finally { setLoading(false); }
    };

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className={`h-1.5 bg-gradient-to-r ${c.grad}`}/>
        <div className="p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-xl shrink-0`}>{c.icon}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${c.light}`}>{post.category}</span>
                  {post.aiGenerated && <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">{client?.businessName || 'Client'}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              {post.scheduledDate && (
                <>
                  <p className="text-xs font-black text-slate-800">{format(new Date(post.scheduledDate), 'dd MMM')}</p>
                  <p className="text-[10px] text-slate-400">{format(new Date(post.scheduledDate), 'HH:mm')}</p>
                </>
              )}
            </div>
          </div>

          {/* Media preview */}
          {post.mediaUrls?.[0] && (
            <div className="mb-4 rounded-2xl overflow-hidden bg-slate-100 aspect-video">
              <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover"/>
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 mb-4">{post.caption}</p>
          )}

          {/* Platforms */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {post.platforms?.map(p => (
              <span key={p} className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${PLATFORM_COLORS[p] || 'bg-slate-100 text-slate-600'}`}>
                {PLATFORM_ICONS[p]} {p}
              </span>
            ))}
          </div>

          {/* Note input toggle */}
          {showNote && (
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Add feedback note (optional)…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"/>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => act('Approved')} disabled={loading}
              className="col-span-1 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all disabled:opacity-50 active:scale-95">✓</button>
            <button onClick={() => { setShowNote(!showNote); }} disabled={loading}
              className="col-span-1 py-2.5 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-black transition-all disabled:opacity-50 active:scale-95">✏️</button>
            <button onClick={() => act('Rejected')} disabled={loading}
              className="col-span-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black transition-all disabled:opacity-50 active:scale-95">✕</button>
            <button onClick={() => onPostClick(post)} disabled={loading}
              className="col-span-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-all disabled:opacity-50 active:scale-95">→</button>
          </div>
          {showNote && (
            <button onClick={() => act('Revision')} disabled={loading || !note.trim()}
              className="w-full mt-2 py-2 rounded-2xl bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-black transition-all disabled:opacity-40">
              Send Revision Request
            </button>
          )}
        </div>
      </div>
    );
  };

  if (pending.length === 0 && revision.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-4xl mb-5">✅</div>
        <h3 className="text-xl font-black text-slate-800 mb-2">All caught up!</h3>
        <p className="text-slate-400 text-sm">No posts waiting for approval this month.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5 space-y-6">
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-black text-slate-800">Pending Approval</h3>
            <span className="bg-amber-400 text-white text-xs font-black px-2.5 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map(p => <ApprovalCard key={p._id} post={p}/>)}
          </div>
        </div>
      )}
      {revision.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-black text-slate-800">Needs Revision</h3>
            <span className="bg-violet-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">{revision.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {revision.map(p => <ApprovalCard key={p._id} post={p}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AnalyticsView ────────────────────────────────────────────────────────────
function AnalyticsView({ posts, clients, selectedClient }) {
  const catCounts = useMemo(() => {
    const m = {};
    CATEGORIES.forEach(c => { m[c] = 0; });
    posts.forEach(p => { if (m[p.category] !== undefined) m[p.category]++; });
    return m;
  }, [posts]);

  const platformCounts = useMemo(() => {
    const m = {};
    PLATFORMS.forEach(p => { m[p] = 0; });
    posts.forEach(p => { p.platforms?.forEach(pl => { if (m[pl] !== undefined) m[pl]++; }); });
    return m;
  }, [posts]);

  const approvalCounts = useMemo(() => ({
    Approved: posts.filter(p => p.approvalStatus === 'Approved').length,
    Pending:  posts.filter(p => p.approvalStatus === 'Pending').length,
    Revision: posts.filter(p => p.approvalStatus === 'Revision').length,
    Rejected: posts.filter(p => p.approvalStatus === 'Rejected').length,
  }), [posts]);

  const statusCounts = useMemo(() => ({
    Draft:     posts.filter(p => p.status === 'Draft').length,
    Scheduled: posts.filter(p => p.status === 'Scheduled').length,
    Posted:    posts.filter(p => p.status === 'Posted').length,
  }), [posts]);

  const clientBreakdown = useMemo(() => {
    const m = {};
    posts.forEach(p => {
      const id   = p.clientId?._id || p.clientId;
      const name = p.clientId?.businessName || clients.find(c => c._id === id)?.businessName || 'Unknown';
      if (!m[id]) m[id] = { name, count: 0 };
      m[id].count++;
    });
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [posts, clients]);

  const maxCat  = Math.max(...Object.values(catCounts), 1);
  const maxPlat = Math.max(...Object.values(platformCounts), 1);
  const total   = posts.length;

  const BarRow = ({ label, count, max, color }) => (
    <div className="flex items-center gap-3">
      <p className="text-xs font-bold text-slate-600 w-24 shrink-0 truncate">{label}</p>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: max > 0 ? `${(count / max) * 100}%` : '0%' }}/>
      </div>
      <p className="text-xs font-black text-slate-700 w-6 text-right shrink-0">{count}</p>
    </div>
  );

  return (
    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Summary */}
      <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Posts',  value: total,                       color: 'text-slate-800', bg: 'bg-slate-50'   },
          { label: 'Posted',       value: statusCounts.Posted,         color: 'text-emerald-700',bg:'bg-emerald-50'  },
          { label: 'Scheduled',    value: statusCounts.Scheduled,      color: 'text-blue-700',  bg: 'bg-blue-50'    },
          { label: 'Pending Approval', value: approvalCounts.Pending,  color: 'text-amber-700', bg: 'bg-amber-50'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <p className="text-sm font-black text-slate-800 mb-4">Content by Category</p>
        <div className="space-y-3">
          {Object.entries(catCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <BarRow key={cat} label={`${getCat(cat).icon} ${cat}`} count={count} max={maxCat} color={getCat(cat).bar}/>
          ))}
          {Object.values(catCounts).every(v => v === 0) && <p className="text-xs text-slate-400 text-center py-4">No posts yet</p>}
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <p className="text-sm font-black text-slate-800 mb-4">Platform Distribution</p>
        <div className="space-y-3">
          {Object.entries(platformCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([plt, count]) => (
            <BarRow key={plt} label={`${PLATFORM_ICONS[plt]} ${plt}`} count={count} max={maxPlat} color="bg-blue-500"/>
          ))}
          {Object.values(platformCounts).every(v => v === 0) && <p className="text-xs text-slate-400 text-center py-4">No posts yet</p>}
        </div>
      </div>

      {/* Approval status donut-style */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <p className="text-sm font-black text-slate-800 mb-4">Approval Status</p>
        <div className="space-y-3">
          {Object.entries(approvalCounts).map(([status, count]) => {
            const cfg = APPROVAL_CFG[status];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-20 text-center shrink-0 ${cfg.badge}`}>{cfg.icon} {status}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cfg.bg} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}/>
                </div>
                <p className="text-xs font-black text-slate-700 w-6 text-right shrink-0">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client breakdown */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <p className="text-sm font-black text-slate-800 mb-4">Posts by Client</p>
        {clientBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No posts yet</p>
        ) : (
          <div className="space-y-3">
            {clientBreakdown.map(({ name, count }) => {
              const cl = clients.find(c => c.businessName === name);
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-950 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                    {name?.charAt(0) || '?'}
                  </div>
                  <p className="text-xs font-bold text-slate-700 flex-1 truncate">{name}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / Math.max(...clientBreakdown.map(x => x.count), 1)) * 100}%` }}/>
                    </div>
                    <p className="text-xs font-black text-slate-700 w-5 text-right">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TodayView ────────────────────────────────────────────────────────────────
function TodayView({ allPosts, clients, onPostClick, onAddPost, onMarkPosted, onRefresh }) {
  const now      = new Date();
  const today    = startOfDay(now);
  const tomorrow = startOfDay(addDays(now, 1));
  const dayAfter = startOfDay(addDays(now, 2));

  const todayPosts    = allPosts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), today));
  const tomorrowPosts = allPosts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), tomorrow));
  const dayAfterPosts = allPosts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), dayAfter));

  const reelsToday    = todayPosts.filter(p => p.category === 'Reel');
  const carouselsDay  = todayPosts.filter(p => p.category === 'Carousel');
  const storiesDay    = todayPosts.filter(p => p.category === 'Story');
  const organicDay    = todayPosts.filter(p => p.category === 'Organic');
  const adDay         = todayPosts.filter(p => p.category === 'Ad Creative');
  const postedToday   = todayPosts.filter(p => p.status === 'Posted');
  const pendingToday  = todayPosts.filter(p => p.approvalStatus === 'Pending');

  // Overdue = scheduled in the past, not yet posted
  const overdue = allPosts.filter(p => {
    if (!p.scheduledDate || p.status === 'Posted') return false;
    const d = startOfDay(new Date(p.scheduledDate));
    return isBefore(d, today);
  });

  // This week stats
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const weekPosts = allPosts.filter(p => {
    if (!p.scheduledDate) return false;
    const d = new Date(p.scheduledDate);
    return d >= weekStart && d <= weekEnd;
  });
  const weekReels   = weekPosts.filter(p => p.category === 'Reel').length;
  const weekPosted  = weekPosts.filter(p => p.status === 'Posted').length;
  const weekPending = weekPosts.filter(p => p.approvalStatus === 'Pending').length;

  const [markingId, setMarkingId] = useState(null);
  const markPosted = async (post) => {
    setMarkingId(post._id);
    try {
      await api.put(`/posts/${post._id}`, { status: 'Posted', postedAt: new Date() });
      toast.success('✅ Marked as Posted!');
      onRefresh();
    } catch { toast.error('Failed.'); }
    finally { setMarkingId(null); }
  };

  const PostRow = ({ post }) => {
    const c  = getCat(post.category);
    const ap = APPROVAL_CFG[post.approvalStatus];
    const cl = clients.find(cl => cl._id === (post.clientId?._id || post.clientId));
    return (
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 group"
        onClick={() => onPostClick(post)}>
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
          {c.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-black text-slate-800 truncate">{cl?.businessName || post.clientId?.businessName || 'Client'}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.light}`}>{c.icon} {post.category}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ap?.badge || 'bg-slate-100'}`}>{ap?.icon} {post.approvalStatus}</span>
            {post.aiGenerated && <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI</span>}
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">{post.caption || '(no caption)'}</p>
          <div className="flex items-center gap-2 mt-1">
            {post.platforms?.map(p => <span key={p} className="text-xs">{PLATFORM_ICONS[p]}</span>)}
            {post.scheduledDate && <span className="text-[10px] text-slate-400 font-semibold">📅 {format(new Date(post.scheduledDate), 'HH:mm')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {post.status !== 'Posted' && (
            <button onClick={e => { e.stopPropagation(); markPosted(post); }}
              disabled={markingId === post._id}
              className="opacity-0 group-hover:opacity-100 text-[10px] font-black bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-50 active:scale-95">
              {markingId === post._id ? '…' : '✅ Post'}
            </button>
          )}
          {post.status === 'Posted' && (
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-xl">✅ Posted</span>
          )}
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    );
  };

  const SectionCard = ({ title, sub, posts: dayPosts, accent, addDate, emptyMsg }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 ${accent} flex items-center justify-between`}>
        <div>
          <p className="font-black text-base text-white">{title}</p>
          <p className="text-sm text-white/70 mt-0.5">{sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black bg-white/20 text-white px-3 py-1.5 rounded-full">{dayPosts.length} posts</span>
          <button onClick={() => onAddPost(addDate)} className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center font-black text-sm transition-colors">+</button>
        </div>
      </div>
      {dayPosts.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-slate-400 font-semibold text-sm">{emptyMsg}</p>
          <button onClick={() => onAddPost(addDate)} className="mt-3 text-xs font-black text-blue-600 hover:text-blue-800">+ Schedule a post →</button>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {dayPosts.map(p => <PostRow key={p._id} post={p}/>)}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-5 pb-5 space-y-5">
      {/* ── Big hero stats ── */}
      <div className="bg-gradient-to-br from-blue-950 to-violet-900 rounded-3xl p-5 text-white">
        <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">{format(now, 'EEEE, dd MMMM yyyy')}</p>
        <p className="text-white font-black text-lg mb-4">
          {todayPosts.length === 0 ? 'Nothing scheduled today' : `${todayPosts.length} post${todayPosts.length > 1 ? 's' : ''} scheduled today`}
        </p>
        {/* Category breakdown mega-stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon:'🎬', label:'Reels Today',   value:reelsToday.length,   grad:'from-pink-500 to-rose-500',    urgent: reelsToday.length > 0 },
            { icon:'🎠', label:'Carousels',     value:carouselsDay.length, grad:'from-violet-500 to-purple-500',urgent: false },
            { icon:'📱', label:'Stories',       value:storiesDay.length,   grad:'from-blue-500 to-cyan-500',    urgent: false },
            { icon:'📸', label:'Organic',       value:organicDay.length,   grad:'from-emerald-500 to-teal-500', urgent: false },
            { icon:'✅', label:'Posted',        value:postedToday.length,  grad:'from-emerald-600 to-green-600',urgent: false },
            { icon:'⏳', label:'Need Approval', value:pendingToday.length, grad:'from-amber-500 to-orange-500', urgent: pendingToday.length > 0 },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.grad} rounded-2xl p-3 text-center relative overflow-hidden`}>
              {s.urgent && s.value > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full animate-ping"/>}
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-white/80 text-[10px] font-bold mt-0.5 leading-tight">{s.icon} {s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Overdue alert ── */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-xl shrink-0">🚨</div>
            <div className="flex-1">
              <p className="font-black text-red-800 text-base">{overdue.length} Overdue Post{overdue.length > 1 ? 's' : ''}!</p>
              <p className="text-red-600 text-sm mt-0.5">These were scheduled in the past but not marked as Posted.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {overdue.slice(0, 5).map(post => {
              const c  = getCat(post.category);
              const cl = clients.find(cl => cl._id === (post.clientId?._id || post.clientId));
              return (
                <div key={post._id} onClick={() => onPostClick(post)}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 cursor-pointer hover:shadow-sm transition-all">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-base shrink-0`}>{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{cl?.businessName || 'Client'} — {post.category}</p>
                    <p className="text-xs text-red-500 font-semibold">Was due: {format(new Date(post.scheduledDate), 'dd MMM, HH:mm')}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); markPosted(post); }} disabled={markingId === post._id}
                    className="text-[10px] font-black bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl transition-all active:scale-95 shrink-0">
                    {markingId === post._id ? '…' : '✅ Mark Done'}
                  </button>
                </div>
              );
            })}
            {overdue.length > 5 && <p className="text-xs text-red-500 font-bold text-center">+{overdue.length - 5} more overdue posts</p>}
          </div>
        </div>
      )}

      {/* ── This week mini summary ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'This Week Posts', value:weekPosts.length, icon:'📅', bg:'bg-white', color:'text-slate-800' },
          { label:'Reels This Week', value:weekReels,        icon:'🎬', bg:'bg-pink-50',    color:'text-pink-700'    },
          { label:'Posted This Week',value:weekPosted,       icon:'✅', bg:'bg-emerald-50', color:'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 p-4 text-center shadow-sm`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Today's content ── */}
      <SectionCard
        title="Today's Content"
        sub={format(now, 'EEEE, dd MMMM')}
        posts={todayPosts}
        accent="bg-gradient-to-r from-blue-950 to-blue-800"
        addDate={now}
        emptyMsg="Nothing scheduled for today"
      />

      {/* ── Tomorrow's preview ── */}
      <SectionCard
        title="Tomorrow's Schedule"
        sub={format(addDays(now, 1), 'EEEE, dd MMMM')}
        posts={tomorrowPosts}
        accent="bg-gradient-to-r from-violet-700 to-violet-600"
        addDate={addDays(now, 1)}
        emptyMsg="Nothing scheduled for tomorrow"
      />

      {/* ── Day after ── */}
      {dayAfterPosts.length > 0 && (
        <SectionCard
          title={format(addDays(now, 2), 'EEEE')}
          sub={format(addDays(now, 2), 'dd MMMM')}
          posts={dayAfterPosts}
          accent="bg-gradient-to-r from-slate-600 to-slate-500"
          addDate={addDays(now, 2)}
          emptyMsg=""
        />
      )}

      {/* ── Category grid today ── */}
      {todayPosts.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <p className="font-black text-slate-800 text-base mb-4">Today by Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label:'Reels',       count:reelsToday.length,   ...getCat('Reel')         },
              { label:'Carousels',   count:carouselsDay.length, ...getCat('Carousel')     },
              { label:'Stories',     count:storiesDay.length,   ...getCat('Story')        },
              { label:'Organic',     count:organicDay.length,   ...getCat('Organic')      },
              { label:'Ad Creative', count:adDay.length,        ...getCat('Ad Creative')  },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-3 text-center ${s.light}`}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-black">{s.count}</p>
                <p className="text-xs font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Script Generator Templates ───────────────────────────────────────────────
const SCRIPT_TEMPLATES = {
  Reel:    { hook:['🔥 Wait — you NEED to see this before you scroll past...','POV: You just found the secret everyone\'s talking about 👀'], body:['Here\'s what most people don\'t know:\n→ Point 1\n→ Point 2\n→ Point 3'], cta:['Drop a 🔥 if this helped. Follow for more!','Save this for later & share with a friend!'] },
  Carousel:{ hook:['Swipe → to see what changed everything for us 🎯','5 things I wish I knew earlier (slide 3 is the game-changer)'], body:['Slide 1: Hook / Problem\nSlide 2-4: Key Points\nSlide 5: Results\nSlide 6: CTA'], cta:['Which slide hit hardest? Comment below!','Save & share this with your team!'] },
  Story:   { hook:['Psst — this is just for our close friends 🤫','24 hours only ⏰'], body:['Keep it punchy — 5 words per slide max.\nUse polls, questions, and sliders.'], cta:['Tap the link in bio! →','Reply to this story!'] },
  Organic: { hook:['Here\'s a perspective you won\'t hear anywhere else:','Real talk — this took us 3 months to figure out:'], body:['Tell a story.\nMake a point.\nLeave them with something they can use TODAY.'], cta:['Double tap if you agree ❤️','Tag someone who needs to hear this!'] },
  'Ad Creative':{ hook:['Stop scrolling — this is for you.','Limited time. Real results.'], body:['Problem → Agitate → Solution\n\nProblem: [pain point]\nAgitate: [consequences]\nSolution: [your offer]'], cta:['Click to claim your spot now →','Shop now — only [X] left!'] },
};
const randPick = arr => arr[Math.floor(Math.random() * arr.length)];

// ─── PostModal (Create / Edit) ────────────────────────────────────────────────
const EMPTY = {
  clientId:'', platforms:[], caption:'', hashtags:'', mediaUrls:[], videoUrls:[],
  scheduledDate:'', category:'Reel', notes:'',
  script:{ hook:'', body:'', cta:'', voiceover:'', textOverlays:[] },
};

function PostModal({ mode, initial, clients, preDate, onClose, onSaved }) {
  const initForm = useMemo(() => {
    if (mode === 'edit' && initial) {
      return {
        ...initial,
        clientId: initial.clientId?._id || initial.clientId || '',
        scheduledDate: initial.scheduledDate ? format(new Date(initial.scheduledDate), "yyyy-MM-dd'T'HH:mm") : '',
        script: initial.script || { hook:'', body:'', cta:'', voiceover:'', textOverlays:[] },
        mediaUrls: initial.mediaUrls || [],
        videoUrls: initial.videoUrls || [],
      };
    }
    return { ...EMPTY, scheduledDate: preDate ? format(preDate, "yyyy-MM-dd'T'HH:mm") : '' };
  }, []);

  const [form,         setForm]         = useState(initForm);
  const [urlInput,     setUrlInput]     = useState('');
  const [videoInput,   setVideoInput]   = useState('');
  const [overlayInput, setOverlayInput] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [scriptLoading,setScriptLoading]= useState(false);
  const [tab,          setTab]          = useState('content');

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setS = (k, v) => setForm(f => ({ ...f, script: { ...f.script, [k]: v } }));

  const togglePlatform = p => set('platforms', form.platforms.includes(p) ? form.platforms.filter(x => x !== p) : [...form.platforms, p]);
  const addUrl         = () => { if (urlInput.trim())    { set('mediaUrls', [...form.mediaUrls, urlInput.trim()]); setUrlInput(''); } };
  const addVideoUrl    = () => { if (videoInput.trim())  { set('videoUrls', [...(form.videoUrls||[]), videoInput.trim()]); setVideoInput(''); } };
  const addOverlay     = () => { if (overlayInput.trim()){ setS('textOverlays', [...(form.script?.textOverlays||[]), overlayInput.trim()]); setOverlayInput(''); } };

  const generateScript = async () => {
    setScriptLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const tpl = SCRIPT_TEMPLATES[form.category] || SCRIPT_TEMPLATES.Organic;
    setForm(f => ({ ...f, script: { ...f.script, hook: randPick(tpl.hook), body: randPick(tpl.body), cta: randPick(tpl.cta), voiceover: `[INTRO]\n${randPick(tpl.hook)}\n\n[MAIN]\n${randPick(tpl.body)}\n\n[OUTRO]\n${randPick(tpl.cta)}` } }));
    setScriptLoading(false);
    toast.success('📝 Script generated!');
  };

  const generateAI = async () => {
    const client = clients.find(c => c._id === form.clientId);
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1100));
    const biz = client?.businessName || 'your brand';
    const templates = {
      Reel:    [`🎬 Behind the scenes at ${biz} — see the magic before it goes live! Tag someone who needs to see this. 🚀`, `✨ This ${form.category} is going to blow your mind — ${biz} is at it again! 🔥`],
      Carousel:[`💡 ${biz} breaks it down — swipe to see all the tips you need today. Save this for later! 📌`, `🌟 The ultimate guide — ${biz}'s step-by-step breakdown. Swipe through all slides! →`],
      Story:   [`👆 Quick poll: Which one do you prefer? Reply to this story! ⬆️`, `🔥 24-hour flash deal from ${biz}! Tap the link in bio NOW! ⏰`],
      Organic: [`💬 ${biz} asked the community — and YOU delivered! What's your take? 👇`, `🙌 Milestone unlocked at ${biz}! Thank you for being part of this journey! ❤️`],
      'Ad Creative':[`🎯 ${biz} — Premium quality, unbeatable value. Limited time offer. Click to claim! →`, `✅ Join thousands who trust ${biz}. Results guaranteed. Shop now! 🛒`],
    };
    const pool = templates[form.category] || templates.Organic;
    set('caption', pool[Math.floor(Math.random() * pool.length)]);
    set('hashtags', `#${biz.replace(/\s/g,'')} #DigitalMarketing #SocialMedia #${form.category} #ContentMarketing`);
    set('aiGenerated', true);
    setAiLoading(false);
    toast.success('✨ AI caption generated!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId)         { toast.error('Select a client.'); return; }
    if (!form.platforms.length) { toast.error('Pick at least one platform.'); return; }
    setSubmitting(true);
    try {
      if (mode === 'add')  { await api.post('/posts', form);               toast.success('🎉 Post created!'); }
      else                 { await api.put(`/posts/${initial._id}`, form); toast.success('Post updated.');    }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900">{mode === 'add' ? 'Create Post' : 'Edit Post'}</h2>
              <p className="text-xs text-slate-400">{preDate ? `Scheduling for ${format(preDate,'dd MMM yyyy')}` : 'Schedule content for client approval'}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {CATEGORIES.map(cat => {
              const c = getCat(cat);
              return (
                <button key={cat} type="button" onClick={() => set('category', cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${form.category === cat ? `bg-gradient-to-br ${c.grad} text-white border-transparent shadow-md` : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                  {c.icon} {cat}
                </button>
              );
            })}
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 overflow-x-auto">
            {[{id:'content',label:'✍️ Caption'},{id:'script',label:'📝 Script'},{id:'media',label:'🖼️ Media'},{id:'schedule',label:'📅 Schedule'}].map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all min-w-0 ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'content' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client *</label>
                <select value={form.clientId} onChange={e => set('clientId', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="">— Select client —</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Platforms *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.platforms.includes(p) ? 'bg-blue-950 text-white border-transparent shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {PLATFORM_ICONS[p]} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Caption</label>
                  <button type="button" onClick={generateAI} disabled={aiLoading || !form.clientId}
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 disabled:opacity-40 transition-colors">
                    {aiLoading ? <><div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"/>Generating…</> : '✨ AI Write'}
                  </button>
                </div>
                <textarea value={form.caption} onChange={e => set('caption', e.target.value)} rows={5}
                  placeholder={`Write your ${form.category.toLowerCase()} caption here…`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"/>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-400">{form.caption.length} chars</p>
                  {form.aiGenerated && <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI Generated</span>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hashtags</label>
                <input value={form.hashtags} onChange={e => set('hashtags', e.target.value)}
                  placeholder="#DigitalMarketing #Branding #SocialMedia…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
              </div>
            </>
          )}

          {tab === 'script' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-black text-violet-800">AI Script Writer</p>
                    <p className="text-[10px] text-violet-500">Generates hook, body & CTA for {form.category}</p>
                  </div>
                  <button type="button" onClick={generateScript} disabled={scriptLoading}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black px-4 py-2 rounded-xl text-xs disabled:opacity-40 transition-all active:scale-95">
                    {scriptLoading ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Writing…</> : '✨ Generate Script'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🪝 Opening Hook</label>
                <input value={form.script?.hook||''} onChange={e => setS('hook', e.target.value)} placeholder="Stop scrolling — this is for you…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">📖 Main Body / Script</label>
                <textarea value={form.script?.body||''} onChange={e => setS('body', e.target.value)} rows={5} placeholder="The main content, story, or talking points…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">📣 Call to Action</label>
                <input value={form.script?.cta||''} onChange={e => setS('cta', e.target.value)} placeholder="Drop a 🔥 if this helped! Follow for more…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🎙️ Full Voiceover / Script</label>
                <textarea value={form.script?.voiceover||''} onChange={e => setS('voiceover', e.target.value)} rows={6} placeholder="Complete word-for-word script…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none font-mono text-xs"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">💬 Text Overlays</label>
                <div className="flex gap-2">
                  <input value={overlayInput} onChange={e => setOverlayInput(e.target.value)} placeholder="Add a text overlay line…"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOverlay())}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                  <button type="button" onClick={addOverlay} className="bg-violet-600 text-white font-bold px-4 rounded-xl hover:bg-violet-700 text-sm">+</button>
                </div>
                {form.script?.textOverlays?.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {form.script.textOverlays.map((txt, i) => (
                      <div key={i} className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2">
                        <span className="text-[10px] text-violet-400 font-black w-4">{i+1}</span>
                        <p className="flex-1 text-sm text-violet-800 font-medium">{txt}</p>
                        <button type="button" onClick={() => setS('textOverlays', form.script.textOverlays.filter((_, j) => j !== i))} className="text-violet-400 hover:text-red-500 text-xs font-black">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🖼️ Images / Thumbnails</label>
                <div className="flex gap-2">
                  <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Paste image URL…"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}/>
                  <button type="button" onClick={addUrl} className="bg-blue-950 text-white font-bold px-4 rounded-xl hover:bg-blue-900 text-sm">Add</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🎬 Video URLs</label>
                <div className="flex gap-2">
                  <input value={videoInput} onChange={e => setVideoInput(e.target.value)} placeholder="YouTube, Drive, Cloudinary…"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}/>
                  <button type="button" onClick={addVideoUrl} className="bg-pink-600 text-white font-bold px-4 rounded-xl hover:bg-pink-700 text-sm">+</button>
                </div>
                {(form.videoUrls||[]).length > 0 && (
                  <div className="mt-2 space-y-2">
                    {form.videoUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5">
                        <span className="text-base">🎬</span>
                        <p className="flex-1 text-xs text-pink-700 truncate font-medium">{url}</p>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-pink-500 font-bold hover:text-pink-700">Open</a>
                        <button type="button" onClick={() => set('videoUrls', form.videoUrls.filter((_, j) => j !== i))} className="text-pink-400 hover:text-red-500 font-black text-xs ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.mediaUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {form.mediaUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded-2xl bg-slate-100"
                        onError={e => { e.target.parentElement.innerHTML = `<div class="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs">🖼️ Invalid</div>`; }}/>
                      <button type="button" onClick={() => set('mediaUrls', form.mediaUrls.filter((_, j) => j !== i))}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] font-black transition-all flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm text-slate-400 font-semibold">Paste image URLs above</p>
                  <p className="text-xs text-slate-300 mt-1">Supports Cloudinary, Unsplash, any CDN</p>
                </div>
              )}
            </div>
          )}

          {tab === 'schedule' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled Date & Time</label>
                <input type="datetime-local" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Internal Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Notes for the team…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"/>
              </div>
              {form.caption && (
                <div className="bg-slate-900 rounded-2xl p-4 text-white">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Post Preview</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getCat(form.category).grad} flex items-center justify-center text-sm`}>{getCat(form.category).icon}</div>
                    <div>
                      <p className="text-xs font-bold text-white">{clients.find(c => c._id === form.clientId)?.businessName || 'Client Name'}</p>
                      <p className="text-[10px] text-slate-500">{form.scheduledDate ? format(new Date(form.scheduledDate), 'dd MMM · HH:mm') : 'Not scheduled'}</p>
                    </div>
                  </div>
                  {form.mediaUrls?.[0] && <img src={form.mediaUrls[0]} alt="" className="w-full aspect-video object-cover rounded-xl mb-3 bg-slate-800"/>}
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap line-clamp-4">{form.caption}</p>
                  {form.hashtags && <p className="text-xs text-blue-400 mt-2">{form.hashtags}</p>}
                  <div className="flex gap-2 mt-3">{form.platforms?.map(p => <span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="border-t border-slate-100 px-6 py-4 flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${getCat(form.category).grad} shadow-lg`}>
            {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</> : (mode === 'add' ? `✨ Create ${form.category}` : '💾 Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SocialMediaManager() {
  const [posts,        setPosts]        = useState([]);
  const [allPosts,     setAllPosts]     = useState([]); // unfiltered, for Today view
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [month,        setMonth]        = useState(new Date());
  const [view,         setView]         = useState('today');
  const [clientFilter, setClientFilter] = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform,setFilterPlatform] = useState('');
  const [modal,        setModal]        = useState(null);
  const [editPost,     setEditPost]     = useState(null);
  const [preDate,      setPreDate]      = useState(null);
  const [drawer,       setDrawer]       = useState(null);
  const [selectedDay,  setSelectedDay]  = useState(null);

  const load = useCallback(async () => {
    try {
      const from   = format(startOfMonth(month), 'yyyy-MM-dd');
      const to     = format(endOfMonth(month),   'yyyy-MM-dd');
      const params = new URLSearchParams({ from, to, limit: 300 });
      if (clientFilter) params.append('clientId', clientFilter);
      // Also load a wider window for Today view (30 days back + 60 forward)
      const allFrom = format(addDays(new Date(), -30), 'yyyy-MM-dd');
      const allTo   = format(addDays(new Date(),  60), 'yyyy-MM-dd');
      const allParams = new URLSearchParams({ from: allFrom, to: allTo, limit: 500 });
      const [pRes, allRes, cRes] = await Promise.all([
        api.get(`/posts?${params}`),
        api.get(`/posts?${allParams}`),
        api.get('/clients'),
      ]);
      setPosts(pRes.data.posts || []);
      setAllPosts(allRes.data.posts || []);
      setClients(cRes.data.clients?.filter(c => c.isActive) || []);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  }, [month, clientFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = (date = null) => { setPreDate(date); setModal('add'); };
  const openEdit = (post)        => { setDrawer(null); setEditPost(post); setModal('edit'); };

  const duplicatePost = async (post) => {
    setDrawer(null);
    const newPost = {
      clientId:     post.clientId?._id || post.clientId,
      platforms:    post.platforms,
      caption:      post.caption,
      hashtags:     post.hashtags,
      category:     post.category,
      mediaUrls:    post.mediaUrls || [],
      videoUrls:    post.videoUrls || [],
      script:       post.script    || {},
      notes:        post.notes     || '',
      scheduledDate:'',
      aiGenerated:  post.aiGenerated || false,
    };
    try {
      await api.post('/posts', newPost);
      toast.success('Post duplicated as Draft!');
      load();
    } catch { toast.error('Duplicate failed.'); }
  };

  const calDays = useMemo(() => {
    const start    = startOfMonth(month);
    const end      = endOfMonth(month);
    const days     = eachDayOfInterval({ start, end });
    const leading  = start.getDay();
    const trailing = 6 - end.getDay();
    const prevDays = Array.from({ length: leading  }, (_, i) => new Date(start.getFullYear(), start.getMonth(), -leading + i + 1));
    const nextDays = Array.from({ length: trailing }, (_, i) => new Date(end.getFullYear(), end.getMonth() + 1, i + 1));
    return [...prevDays, ...days, ...nextDays];
  }, [month]);

  const stats = useMemo(() => {
    const t = { total:0, draft:0, scheduled:0, posted:0, pending:0, approved:0 };
    posts.forEach(p => {
      t.total++;
      if (p.status === 'Draft')              t.draft++;
      if (p.status === 'Scheduled')          t.scheduled++;
      if (p.status === 'Posted')             t.posted++;
      if (p.approvalStatus === 'Pending')    t.pending++;
      if (p.approvalStatus === 'Approved')   t.approved++;
    });
    return t;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let p = posts;
    if (filterCat)      p = p.filter(x => x.category === filterCat);
    if (filterStatus)   p = p.filter(x => x.approvalStatus === filterStatus);
    if (filterPlatform) p = p.filter(x => x.platforms?.includes(filterPlatform));
    return p;
  }, [posts, filterCat, filterStatus, filterPlatform]);

  const selectedClient = clients.find(c => c._id === clientFilter);
  const hasFilters = filterCat || filterStatus || filterPlatform;

  const todayCount    = allPosts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), new Date())).length;
  const tomorrowCount = allPosts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), addDays(new Date(), 1))).length;
  const overdueCount  = allPosts.filter(p => p.scheduledDate && p.status !== 'Posted' && isBefore(startOfDay(new Date(p.scheduledDate)), startOfDay(new Date()))).length;

  const VIEWS = [
    { v:'today',     icon:'⚡', label:'Today',    badge: overdueCount > 0 ? overdueCount : 0, badgeColor:'bg-red-500' },
    { v:'calendar',  icon:'📅', label:'Calendar'  },
    { v:'list',      icon:'📋', label:'List'       },
    { v:'approvals', icon:'✅', label:'Approvals', badge: stats.pending, badgeColor:'bg-amber-400' },
    { v:'analytics', icon:'📊', label:'Analytics'  },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ── */}
      <div className="px-5 pt-4 pb-3 shrink-0 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-slate-900">Social Media</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedClient ? `${selectedClient.businessName} · ` : ''}{format(month, 'MMMM yyyy')}
              {hasFilters && <span className="ml-1 text-blue-500 font-bold">· Filtered</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* View tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
              {VIEWS.map(({ v, icon, label, badge, badgeColor }) => (
                <button key={v} onClick={() => setView(v)}
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {icon} <span className="hidden sm:inline ml-1">{label}</span>
                  {badge > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 ${badgeColor || 'bg-amber-400'} text-white text-[9px] font-black rounded-full flex items-center justify-center`}>{badge}</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => openAdd()}
              className="flex items-center gap-1.5 bg-blue-950 hover:bg-blue-900 text-white font-black px-3 sm:px-4 py-2.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-950/20 active:scale-95">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              <span className="hidden sm:inline">New Post</span>
            </button>
          </div>
        </div>

        {/* Client filter tabs — hide on Today view */}
        {view !== 'today' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setClientFilter('')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 whitespace-nowrap transition-all shrink-0 ${!clientFilter ? 'bg-blue-950 text-white border-blue-950' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
              All <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${!clientFilter ? 'bg-white text-blue-950' : 'bg-slate-100 text-slate-500'}`}>{posts.length}</span>
            </button>
            {clients.map(c => {
              const cnt     = posts.filter(p => p.clientId?._id === c._id || p.clientId === c._id).length;
              const pending = posts.filter(p => (p.clientId?._id === c._id || p.clientId === c._id) && p.approvalStatus === 'Pending').length;
              return (
                <button key={c._id} onClick={() => setClientFilter(c._id === clientFilter ? '' : c._id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 whitespace-nowrap transition-all shrink-0 ${clientFilter === c._id ? 'bg-blue-950 text-white border-blue-950' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                  <div className="w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">{c.businessName?.charAt(0)}</div>
                  {c.businessName}
                  {cnt > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${clientFilter === c._id ? 'bg-white text-blue-950' : 'bg-slate-100 text-slate-500'}`}>{cnt}</span>}
                  {pending > 0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-white">{pending}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Filter chips — category / platform / approval status */}
        {(view === 'list' || view === 'calendar') && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Filter:</span>
            {/* Category */}
            {CATEGORIES.map(cat => {
              const c = getCat(cat);
              return (
                <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all whitespace-nowrap shrink-0 ${filterCat === cat ? `bg-gradient-to-r ${c.grad} text-white border-transparent` : `${c.light} border-transparent hover:opacity-80`}`}>
                  {c.icon} {cat}
                </button>
              );
            })}
            <div className="w-px h-4 bg-slate-200 shrink-0"/>
            {/* Approval status */}
            {Object.entries(APPROVAL_CFG).map(([s, cfg]) => (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all whitespace-nowrap shrink-0 ${filterStatus === s ? `${cfg.bg} text-white border-transparent` : `${cfg.badge} border-transparent hover:opacity-80`}`}>
                {cfg.icon} {s}
              </button>
            ))}
            {hasFilters && (
              <button onClick={() => { setFilterCat(''); setFilterStatus(''); setFilterPlatform(''); }}
                className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all whitespace-nowrap shrink-0">
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* Quota bar — only on calendar/list */}
        {(view === 'calendar' || view === 'list') && <QuotaBar posts={posts} client={selectedClient}/>}

        {/* Stats row */}
        {view !== 'analytics' && view !== 'today' && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label:'Today 🎬',  value:todayCount,      color:'text-pink-600',    bg:'bg-pink-50'    },
              { label:'Tomorrow',  value:tomorrowCount,   color:'text-violet-600',  bg:'bg-violet-50'  },
              { label:'Scheduled', value:stats.scheduled, color:'text-blue-600',    bg:'bg-blue-50'    },
              { label:'Posted ✅', value:stats.posted,    color:'text-emerald-600', bg:'bg-emerald-50' },
              { label:'⏳ Pending',value:stats.pending,   color:'text-amber-600',   bg:'bg-amber-50'   },
              { label:'Total',     value:stats.total,     color:'text-slate-700',   bg:'bg-white'      },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 px-2 py-2 text-center shadow-sm`}>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 font-semibold leading-tight mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Views ── */}
      <div className={`flex-1 overflow-auto ${view !== 'approvals' && view !== 'analytics' && view !== 'today' ? 'px-5 pb-5' : 'pb-5'}`}>
        {loading ? (
          <div className="h-64 bg-slate-50 rounded-3xl animate-pulse mx-5"/>
        ) : view === 'today' ? (
          <TodayView allPosts={allPosts} clients={clients} onPostClick={p => setDrawer(p)} onAddPost={openAdd} onRefresh={load}/>
        ) : view === 'approvals' ? (
          <ApprovalsView posts={posts} clients={clients} onRefresh={load} onPostClick={p => setDrawer(p)}/>
        ) : view === 'analytics' ? (
          <AnalyticsView posts={posts} clients={clients} selectedClient={selectedClient}/>
        ) : view === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div className="text-center">
                <p className="font-black text-slate-900">{format(month, 'MMMM yyyy')}</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  {Object.entries(CAT).slice(0, 5).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1"><span className="text-[10px]">{v.icon}</span><span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">{k}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMonth(new Date())} className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">Today</button>
                <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center py-2.5 text-xs font-black text-slate-400 uppercase tracking-wider border-r border-slate-100 last:border-0">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ minHeight:'480px' }}>
              {calDays.map((day, idx) => (
                <DayCell key={idx} day={day} posts={filteredPosts} isCurrentMonth={isSameMonth(day, month)}
                  onAddPost={openAdd} onPostClick={p => setDrawer(p)}
                  selectedDay={selectedDay} onSelect={d => setSelectedDay(s => s && isSameDay(s, d) ? null : d)}/>
              ))}
            </div>
            {/* Mobile selected-day panel */}
            {selectedDay && (() => {
              const dp = filteredPosts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), selectedDay));
              return (
                <div className="sm:hidden border-t border-slate-100 animate-slide-up">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-800">{format(selectedDay, 'EEE, d MMMM')}</p>
                      <p className="text-[10px] text-slate-400">{dp.length} post{dp.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { openAdd(selectedDay); setSelectedDay(null); }}
                        className="bg-blue-950 text-white text-xs font-black px-3 py-1.5 rounded-xl active:scale-95 transition-all">+ Add Post</button>
                      <button onClick={() => setSelectedDay(null)} className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-black">✕</button>
                    </div>
                  </div>
                  {dp.length === 0 ? (
                    <div className="py-7 text-center"><p className="text-2xl mb-1.5">📅</p><p className="text-sm text-slate-400 font-semibold">Nothing scheduled</p></div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {dp.map(post => {
                        const c = getCat(post.category);
                        return (
                          <button key={post._id} onClick={() => setDrawer(post)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-base shrink-0`}>{c.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.light}`}>{post.category}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${APPROVAL_CFG[post.approvalStatus]?.badge || 'bg-slate-100 text-slate-500'}`}>{post.approvalStatus}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{post.caption || '(no caption)'}</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          /* List view */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredPosts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-5xl mb-3">{hasFilters ? '🔍' : '📅'}</p>
                <p className="font-bold text-slate-500 text-lg">{hasFilters ? 'No posts match your filters' : 'No posts this month'}</p>
                <p className="text-sm text-slate-400 mt-1">{hasFilters ? 'Try clearing some filters' : 'Click "+ New Post" to create one'}</p>
                {hasFilters
                  ? <button onClick={() => { setFilterCat(''); setFilterStatus(''); setFilterPlatform(''); }} className="mt-5 bg-slate-100 text-slate-700 font-black px-6 py-3 rounded-2xl text-sm hover:bg-slate-200 transition-colors">✕ Clear Filters</button>
                  : <button onClick={() => openAdd()} className="mt-5 bg-blue-950 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-blue-900 transition-colors">+ Create First Post</button>
                }
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {[...new Set(filteredPosts.map(p => p.scheduledDate ? format(new Date(p.scheduledDate), 'yyyy-MM-dd') : 'unscheduled'))].sort().map(dateKey => {
                  const dayPosts = filteredPosts.filter(p => (p.scheduledDate ? format(new Date(p.scheduledDate), 'yyyy-MM-dd') : 'unscheduled') === dateKey);
                  return (
                    <div key={dateKey}>
                      <div className="px-5 py-2.5 bg-slate-50 flex items-center gap-3 sticky top-0 z-10">
                        <p className="text-xs font-black text-slate-700">{dateKey === 'unscheduled' ? '📌 Unscheduled' : format(new Date(dateKey), 'EEEE, dd MMMM')}</p>
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">{dayPosts.length}</span>
                      </div>
                      {dayPosts.map(post => {
                        const c  = getCat(post.category);
                        const ap = APPROVAL_CFG[post.approvalStatus];
                        return (
                          <div key={post._id} onClick={() => setDrawer(post)}
                            className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-lg shrink-0`}>{c.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-slate-800 truncate">{post.clientId?.businessName || 'Client'}</p>
                                <CategoryChip category={post.category}/>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ap?.badge || 'bg-slate-100 text-slate-500'}`}>{ap?.icon} {post.approvalStatus}</span>
                                {post.aiGenerated && <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{post.caption || '(no caption)'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {post.platforms?.map(p => <span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}
                                {post.scheduledDate && <p className="text-[10px] text-slate-400">📅 {format(new Date(post.scheduledDate), 'HH:mm')}</p>}
                                {post.mediaUrls?.length > 0 && <span className="text-[10px] text-slate-400">🖼️ {post.mediaUrls.length}</span>}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      {(modal === 'add' || modal === 'edit') && (
        <PostModal
          mode={modal}
          initial={modal === 'edit' ? editPost : null}
          clients={clients}
          preDate={preDate}
          onClose={() => { setModal(null); setPreDate(null); setEditPost(null); }}
          onSaved={() => { load(); setModal(null); setPreDate(null); setEditPost(null); }}
        />
      )}
      {drawer && (
        <PostDrawer
          post={drawer}
          onClose={() => setDrawer(null)}
          onUpdate={() => { load(); setDrawer(null); }}
          onDelete={() => { load(); setDrawer(null); }}
          onEdit={openEdit}
          onDuplicate={duplicatePost}
        />
      )}
    </div>
  );
}
