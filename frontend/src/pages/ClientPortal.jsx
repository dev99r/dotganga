import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  format, parseISO, isToday, isTomorrow, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isThisMonth,
} from 'date-fns';

// ─── constants ───────────────────────────────────────────────────────────────

const CAT = {
  Reel:         { emoji: '🎬', label: 'Reel',         color: 'violet', bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-600' },
  Carousel:     { emoji: '🖼️', label: 'Carousel',     color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-600'   },
  Story:        { emoji: '📱', label: 'Story',         color: 'pink',   bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200',   badge: 'bg-pink-600'   },
  Organic:      { emoji: '🌿', label: 'Organic Post',  color: 'green',  bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-600'  },
  'Ad Creative':{ emoji: '🎯', label: 'Ad Creative',   color: 'amber',  bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-500'  },
};

const STATUS = {
  Draft:     { label: 'Being Prepared', dot: 'bg-slate-400',   bar: 'bg-slate-300',   pill: 'bg-slate-100 text-slate-600'     },
  Scheduled: { label: 'Ready to Post',  dot: 'bg-blue-500',    bar: 'bg-blue-500',    pill: 'bg-blue-100 text-blue-700'       },
  Posted:    { label: 'Published',      dot: 'bg-emerald-500', bar: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700' },
  Pending:   { label: 'In Review',      dot: 'bg-amber-500',   bar: 'bg-amber-400',   pill: 'bg-amber-100 text-amber-700'    },
};

const APPROVAL = {
  Pending:  { label: 'Needs Your OK',    pill: 'bg-amber-100  text-amber-700',    icon: '⏳' },
  Approved: { label: 'Approved',          pill: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  Revised:  { label: 'Changes Requested', pill: 'bg-orange-100 text-orange-700',   icon: '✏️' },
  Rejected: { label: 'Declined',          pill: 'bg-red-100 text-red-700',         icon: '❌' },
};

const PLATFORM_ICONS = {
  Instagram: { icon: '📸', color: 'text-pink-600'  },
  Facebook:  { icon: '👍', color: 'text-blue-600'  },
  LinkedIn:  { icon: '💼', color: 'text-blue-700'  },
  WhatsApp:  { icon: '💬', color: 'text-green-600' },
};

const TABS = [
  { id: 'plan',     label: 'Content Plan',    icon: '📅' },
  { id: 'approve',  label: 'Approve Content', icon: '✅' },
  { id: 'calendar', label: 'Calendar',        icon: '🗓️' },
  { id: 'stats',    label: 'Monthly Report',  icon: '📊' },
];

const PLAN_TARGETS = { Reel: 6, Carousel: 4, Story: 4, Organic: 2, 'Ad Creative': 2 };

// ─── helpers ─────────────────────────────────────────────────────────────────

const fd = (iso) => { try { return format(parseISO(iso), 'dd MMM'); } catch { return '—'; } };
const ft = (iso) => { try { return format(parseISO(iso), 'hh:mm a'); } catch { return ''; } };

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, approval }) {
  const ap = APPROVAL[approval] || APPROVAL.Pending;
  const st = STATUS[status]     || STATUS.Draft;
  if (approval === 'Pending') return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${ap.pill}`}>
      {ap.icon} {ap.label}
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${st.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      {st.label}
    </span>
  );
}

// ─── PostCard ────────────────────────────────────────────────────────────────

function PostCard({ post, onApprove, onRevise, onReject, compact = false }) {
  const [expanded,   setExpanded]   = useState(false);
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cat = CAT[post.category] || CAT.Reel;
  const isActionable = post.approvalStatus === 'Pending';

  const act = async (fn) => {
    setSubmitting(true);
    try { await fn(); } finally { setSubmitting(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border ${cat.border} shadow-sm overflow-hidden transition-all hover:shadow-md`}>
      {/* coloured header strip */}
      <div className={`${cat.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{cat.emoji}</span>
          <span className={`font-black text-sm ${cat.text}`}>{cat.label}</span>
          {isActionable && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
          {post.platforms?.map(p => (
            <span key={p} className={`text-sm ${PLATFORM_ICONS[p]?.color || 'text-slate-500'}`} title={p}>
              {PLATFORM_ICONS[p]?.icon || p[0]}
            </span>
          ))}
          <StatusBadge status={post.status} approval={post.approvalStatus} />
        </div>
      </div>

      <div className="p-4">
        {/* date row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Scheduled For</p>
            <p className="font-black text-slate-800">{fd(post.scheduledDate)}</p>
            <p className="text-xs text-slate-500">{ft(post.scheduledDate)}</p>
          </div>
          {!compact && post.approvalStatus === 'Approved' && post.status !== 'Posted' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-center">
              <p className="text-emerald-700 font-black text-xs">Approved ✅</p>
              <p className="text-emerald-600 text-[10px]">Ready to go live</p>
            </div>
          )}
        </div>

        {/* caption */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3">
          <p className="text-xs text-slate-400 font-bold mb-1">Caption</p>
          <p className={`text-sm text-slate-700 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {post.caption}
          </p>
          {post.caption?.length > 150 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 font-bold mt-1 hover:underline">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {post.hashtags && (
          <p className="text-xs text-blue-600 line-clamp-1 mb-3">{post.hashtags}</p>
        )}

        {/* approval actions */}
        {isActionable && !compact && (
          <div className="border-t border-amber-100 pt-3">
            <p className="text-xs font-black text-amber-700 mb-2.5">
              Please review and approve before we post this.
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional feedback or changes needed…"
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mb-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300"
            />
            <div className="flex gap-2">
              <button disabled={submitting} onClick={() => act(() => onApprove(post._id, note))}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                {submitting ? '…' : '✅ Approve'}
              </button>
              <button disabled={submitting} onClick={() => act(() => onRevise(post._id, note))}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                ✏️ Change
              </button>
              <button disabled={submitting} onClick={() => act(() => onReject(post._id, note))}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-sm py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                ❌ Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PlanSection ─────────────────────────────────────────────────────────────

function PlanSection({ category, posts, target }) {
  const cat   = CAT[category] || CAT.Reel;
  const done  = posts.filter(p => p.status === 'Posted').length;
  const ready = posts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length;
  const pend  = posts.filter(p => p.approvalStatus === 'Pending').length;
  const slots = Array.from({ length: target }, (_, i) => posts[i] || null);
  const pct   = Math.round((done / target) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* header */}
      <div className={`${cat.bg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cat.emoji}</span>
          <div>
            <p className={`font-black text-sm ${cat.text}`}>{cat.label}s — Monthly Plan</p>
            <p className={`text-xs ${cat.text} opacity-70`}>
              {done} published · {ready} approved · {pend} needs review
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-black text-2xl ${cat.text}`}>{done}/{target}</p>
          <p className={`text-xs ${cat.text} opacity-70`}>{pct}% complete</p>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-2 bg-slate-100">
        <div className={`h-full ${cat.badge} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>

      {/* slots grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((post, idx) => (
          <div key={idx}
            className={`rounded-xl border-2 p-3 min-h-[96px] flex flex-col gap-1.5 ${
              post
                ? `${cat.border} bg-white hover:shadow-sm transition-shadow`
                : 'border-dashed border-slate-200 bg-slate-50'
            }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black ${post ? cat.text : 'text-slate-400'}`}>
                {cat.emoji} #{idx + 1}
              </span>
              {post ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  post.status === 'Posted'          ? 'bg-emerald-100 text-emerald-700' :
                  post.approvalStatus === 'Approved' ? 'bg-blue-100 text-blue-700'     :
                                                       'bg-amber-100 text-amber-700'
                }`}>
                  {post.status === 'Posted' ? '✅ Live' : post.approvalStatus === 'Approved' ? 'Ready' : '⏳ Review'}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
                  Upcoming
                </span>
              )}
            </div>
            {post ? (
              <>
                <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-tight">
                  {post.caption?.slice(0, 60)}{post.caption?.length > 60 ? '…' : ''}
                </p>
                <p className="text-[10px] text-slate-400 mt-auto">{fd(post.scheduledDate)}</p>
              </>
            ) : (
              <p className="text-xs text-slate-300 italic mt-auto">Slot available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MiniCalendar ────────────────────────────────────────────────────────────

function MiniCalendar({ posts, onDayClick, selectedDay }) {
  const today  = new Date();
  const start  = startOfMonth(today);
  const end    = endOfMonth(today);
  const days   = eachDayOfInterval({ start, end });
  const blanks = getDay(start);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      try {
        const key = format(parseISO(p.scheduledDate), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(p);
      } catch {}
    });
    return map;
  }, [posts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-slate-800">{format(today, 'MMMM yyyy')}</h3>
        <span className="text-xs font-bold text-slate-400">Click a date for details</span>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-black text-slate-400 uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const key    = format(day, 'yyyy-MM-dd');
          const dPosts = postsByDay[key] || [];
          const isSel  = selectedDay && isSameDay(day, selectedDay);
          const isT    = isToday(day);

          return (
            <button key={key}
              onClick={() => onDayClick(day, dPosts)}
              disabled={dPosts.length === 0}
              className={`relative flex flex-col items-center rounded-xl py-1.5 px-0.5 transition-all
                ${isSel ? 'bg-blue-600 shadow-lg ring-2 ring-blue-400' :
                  isT   ? 'bg-blue-950 text-white' :
                  dPosts.length > 0 ? 'bg-slate-50 hover:bg-blue-50 cursor-pointer hover:ring-1 hover:ring-blue-300' :
                  'cursor-default'
                }`}>
              <span className={`text-xs font-black ${isSel || isT ? 'text-white' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>
              {dPosts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]">
                  {dPosts.slice(0, 3).map((p, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${
                      p.status === 'Posted'           ? 'bg-emerald-500' :
                      p.approvalStatus === 'Pending'   ? 'bg-amber-500'   : 'bg-blue-400'
                    }`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
        {[['bg-emerald-500','Published'],['bg-blue-400','Scheduled'],['bg-amber-500','Needs Review']].map(([bg, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${bg}`} />
            <span className="text-[10px] text-slate-400 font-bold">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DayDetailPanel ──────────────────────────────────────────────────────────

function DayDetailPanel({ day, posts, onClose }) {
  if (!day) return null;
  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-lg overflow-hidden">
      <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-lg">{format(day, 'EEEE, dd MMMM')}</p>
          <p className="text-blue-200 text-xs">{posts.length} content piece{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 font-black">
          ✕
        </button>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {posts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Nothing scheduled.</p>
        ) : posts.map(p => {
          const cat = CAT[p.category] || CAT.Reel;
          return (
            <div key={p._id} className={`flex items-start gap-3 p-3 rounded-xl ${cat.bg} border ${cat.border}`}>
              <span className="text-xl">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black ${cat.text}`}>{cat.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    p.status === 'Posted'           ? 'bg-emerald-100 text-emerald-700' :
                    p.approvalStatus === 'Pending'   ? 'bg-amber-100 text-amber-700'   :
                                                       'bg-blue-100 text-blue-700'
                  }`}>
                    {p.status === 'Posted' ? '✅ Live' : p.approvalStatus === 'Pending' ? '⏳ Review' : 'Approved'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{p.caption}</p>
                <p className="text-[10px] text-slate-400 mt-1">{ft(p.scheduledDate)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── main portal ─────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [client,   setClient]   = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('plan');
  const [selDay,   setSelDay]   = useState(null);
  const [selPosts, setSelPosts] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/clients/my/portal'),
        api.get('/posts?limit=500'),
      ]);
      setClient(cRes.data.client);
      setPosts(pRes.data.posts || pRes.data || []);
    } catch {
      toast.error('Could not load your portal. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id, note) => {
    await api.patch(`/posts/${id}/approve`, { status: 'Approved', note });
    toast.success('Content approved! ✅');
    fetchData();
  };
  const handleRevise = async (id, note) => {
    await api.patch(`/posts/${id}/approve`, { status: 'Revised', note });
    toast.success('Revision requested. ✏️');
    fetchData();
  };
  const handleReject = async (id, note) => {
    await api.patch(`/posts/${id}/approve`, { status: 'Rejected', note });
    toast.success('Content declined.');
    fetchData();
  };

  // ── derived ──
  const pendingPosts = useMemo(() => posts.filter(p => p.approvalStatus === 'Pending'), [posts]);

  const monthPosts = useMemo(() =>
    posts.filter(p => { try { return isThisMonth(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);

  const todayPosts    = useMemo(() => posts.filter(p => { try { return isToday(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);
  const tomorrowPosts = useMemo(() => posts.filter(p => { try { return isTomorrow(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);

  const byCategory = useMemo(() => {
    const map = {};
    monthPosts.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [monthPosts]);

  const totalPosted    = monthPosts.filter(p => p.status === 'Posted').length;
  const totalScheduled = monthPosts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length;
  const totalTarget    = Object.values(PLAN_TARGETS).reduce((a, b) => a + b, 0);
  const overallPct     = Math.round((totalPosted / (totalTarget || 1)) * 100);

  // ── loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-blue-300 font-bold">Loading your portal…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-30 bg-blue-950 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="DotGanga" className="w-7 h-7 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-sm leading-none truncate max-w-[150px] sm:max-w-none">
                {client?.businessName || user?.name}
              </p>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wide">Client Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingPosts.length > 0 && (
              <button onClick={() => setTab('approve')}
                className="hidden sm:flex items-center gap-1.5 bg-amber-500 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse hover:bg-amber-600 transition-colors">
                <span className="w-2 h-2 bg-white rounded-full" />
                {pendingPosts.length} Needs Review
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span>📅</span> {format(new Date(), 'dd MMM yyyy')}
            </div>
            <button onClick={logout}
              className="text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors">
              Sign Out
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="border-t border-white/10 max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-black whitespace-nowrap border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-400 hover:text-blue-200'
                }`}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                {t.id === 'approve' && pendingPosts.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingPosts.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-violet-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black leading-tight">
              {client?.businessName || user?.name}
            </h1>
            <p className="text-blue-200 text-sm mt-0.5">{client?.industry || 'Social Media Client'}</p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {client?.primaryPlatforms?.map(p => (
                <span key={p} className="flex items-center gap-1 bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {PLATFORM_ICONS[p]?.icon} {p}
                </span>
              ))}
            </div>
          </div>

          {/* stats strip */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {[
              { label: 'Published', val: totalPosted,          color: 'text-emerald-400' },
              { label: 'Scheduled', val: totalScheduled,       color: 'text-blue-300'    },
              { label: 'Pending',   val: pendingPosts.length,  color: 'text-amber-400'   },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[11px] text-blue-300 font-bold">{s.label}</p>
              </div>
            ))}

            {/* progress circle */}
            <div className="hidden sm:flex flex-col items-center bg-white/10 rounded-2xl px-4 py-3">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#34d399" strokeWidth="5"
                    strokeDasharray={`${(overallPct / 100) * 138.2} 138.2`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xs">
                  {overallPct}%
                </span>
              </div>
              <p className="text-[10px] text-blue-300 font-bold mt-1">Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">

        {/* ═══ PLAN TAB ═══ */}
        {tab === 'plan' && (
          <div className="space-y-5">

            {/* overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(PLAN_TARGETS).map(([cat, target]) => {
                const c      = CAT[cat] || CAT.Reel;
                const cPosts = byCategory[cat] || [];
                const done   = cPosts.filter(p => p.status === 'Posted').length;
                const pct    = Math.round((done / target) * 100);
                return (
                  <div key={cat} className={`bg-white rounded-2xl border ${c.border} p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
                    <span className="text-2xl">{c.emoji}</span>
                    <p className={`font-black text-2xl ${c.text} mt-1`}>{done}/{target}</p>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{c.label}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${c.badge} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* today/tomorrow alert */}
            {(todayPosts.length > 0 || tomorrowPosts.length > 0) && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-4">
                <p className="font-black text-slate-800 mb-3 flex items-center gap-2 text-sm">
                  <span>📋</span> Today & Tomorrow's Content
                </p>
                <div className="flex flex-wrap gap-2">
                  {todayPosts.map(p => {
                    const c = CAT[p.category] || CAT.Reel;
                    return (
                      <span key={p._id} className={`flex items-center gap-1.5 ${c.bg} ${c.text} text-xs font-bold px-3 py-1.5 rounded-full border ${c.border}`}>
                        {c.emoji} Today · {ft(p.scheduledDate)}
                        {p.approvalStatus === 'Pending' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                      </span>
                    );
                  })}
                  {tomorrowPosts.map(p => {
                    const c = CAT[p.category] || CAT.Reel;
                    return (
                      <span key={p._id} className={`flex items-center gap-1.5 bg-white ${c.text} text-xs font-bold px-3 py-1.5 rounded-full border ${c.border}`}>
                        {c.emoji} Tomorrow · {ft(p.scheduledDate)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* plan sections per category */}
            {Object.entries(PLAN_TARGETS).map(([cat, target]) => (
              <PlanSection
                key={cat}
                category={cat}
                posts={byCategory[cat] || []}
                target={target}
              />
            ))}
          </div>
        )}

        {/* ═══ APPROVE TAB ═══ */}
        {tab === 'approve' && (
          <div>
            {pendingPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-7xl mb-4">🎉</div>
                <h3 className="font-black text-slate-700 text-2xl mb-2">All caught up!</h3>
                <p className="text-slate-400">No content needs your review right now.</p>
                <p className="text-slate-400 text-sm mt-1">We'll let you know when new content is ready for your OK.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">Content Waiting For Your OK</h2>
                    <p className="text-sm text-slate-500">
                      Review and approve each piece before we post it on your behalf.
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-2.5 text-center shrink-0">
                    <p className="text-amber-700 font-black text-3xl leading-none">{pendingPosts.length}</p>
                    <p className="text-amber-600 text-xs font-bold">Pending</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {pendingPosts.map(p => (
                    <PostCard key={p._id} post={p}
                      onApprove={handleApprove} onRevise={handleRevise} onReject={handleReject} />
                  ))}
                </div>
              </>
            )}

            {/* approved section */}
            {monthPosts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length > 0 && (
              <div className="mt-10">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-base">
                  <span>✅</span> Approved & Scheduled to Post
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthPosts
                    .filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted')
                    .map(p => (
                      <PostCard key={p._id} post={p} compact
                        onApprove={() => {}} onRevise={() => {}} onReject={() => {}} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALENDAR TAB ═══ */}
        {tab === 'calendar' && (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-4">
              <MiniCalendar
                posts={monthPosts}
                selectedDay={selDay}
                onDayClick={(day, posts) => { setSelDay(day); setSelPosts(posts); }}
              />
              {selDay && (
                <DayDetailPanel
                  day={selDay}
                  posts={selPosts}
                  onClose={() => { setSelDay(null); setSelPosts([]); }}
                />
              )}
            </div>

            {/* sidebar */}
            <div className="space-y-4">
              {/* upcoming */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-black text-slate-800 mb-4">Upcoming Content</h3>
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {monthPosts
                    .filter(p => { try { return parseISO(p.scheduledDate) >= new Date(); } catch { return false; } })
                    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                    .slice(0, 10)
                    .map(p => {
                      const cat = CAT[p.category] || CAT.Reel;
                      return (
                        <div key={p._id} className={`flex items-center gap-3 p-2.5 rounded-xl ${cat.bg} border ${cat.border}`}>
                          <span className="text-base shrink-0">{cat.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-black ${cat.text}`}>{cat.label}</p>
                            <p className="text-xs text-slate-600 line-clamp-1">{p.caption?.slice(0, 45)}…</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-700">{fd(p.scheduledDate)}</p>
                            <p className="text-[10px] text-slate-400">{ft(p.scheduledDate)}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* published count */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <h3 className="font-black text-emerald-800 mb-1 flex items-center gap-2 text-sm">
                  ✅ Published This Month
                </h3>
                <p className="text-4xl font-black text-emerald-600">{totalPosted}</p>
                <p className="text-sm text-emerald-600">out of {totalTarget} planned</p>
                <div className="h-2 bg-emerald-200 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
                </div>
                <p className="text-xs text-emerald-600 font-bold mt-1">{overallPct}% complete</p>
              </div>

              {/* category breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-black text-slate-800 mb-3 text-sm">By Content Type</h3>
                {Object.entries(PLAN_TARGETS).map(([cat, target]) => {
                  const c    = CAT[cat] || CAT.Reel;
                  const done = (byCategory[cat] || []).filter(p => p.status === 'Posted').length;
                  const pct  = Math.round((done / target) * 100);
                  return (
                    <div key={cat} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black ${c.text} flex items-center gap-1`}>{c.emoji} {c.label}</span>
                        <span className="text-xs text-slate-400 font-bold">{done}/{target}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${c.badge} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STATS TAB ═══ */}
        {tab === 'stats' && (
          <div className="space-y-5">

            {/* hero */}
            <div className="bg-gradient-to-r from-blue-900 to-violet-900 text-white rounded-2xl p-6">
              <p className="text-blue-200 font-bold text-sm mb-1">Monthly Content Report</p>
              <h2 className="text-2xl font-black mb-5">{format(new Date(), 'MMMM yyyy')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Planned',  val: totalTarget,         color: 'text-white'       },
                  { label: 'Published',       val: totalPosted,         color: 'text-emerald-400' },
                  { label: 'Scheduled',       val: totalScheduled,      color: 'text-blue-300'    },
                  { label: 'Needs Review',    val: pendingPosts.length, color: 'text-amber-400'   },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-4 text-center">
                    <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-blue-200 text-xs font-bold mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-black text-slate-800 mb-4">Content Breakdown by Type</h3>
              <div className="space-y-4">
                {Object.entries(PLAN_TARGETS).map(([cat, target]) => {
                  const c      = CAT[cat] || CAT.Reel;
                  const cPosts = byCategory[cat] || [];
                  const done   = cPosts.filter(p => p.status === 'Posted').length;
                  const ready  = cPosts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length;
                  const pend   = cPosts.filter(p => p.approvalStatus === 'Pending').length;
                  const pct    = Math.round((done / target) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.emoji}</span>
                          <span className={`font-black text-sm ${c.text}`}>{c.label}s</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-600 font-bold">{done} live</span>
                          <span className="text-blue-600 font-bold">{ready} ready</span>
                          {pend > 0 && <span className="text-amber-600 font-bold">{pend} review</span>}
                          <span className="text-slate-400 font-bold">{done}/{target}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${(done/target)*100}%` }} />
                        <div className="h-full bg-blue-400"   style={{ width: `${(ready/target)*100}%` }} />
                        <div className="h-full bg-amber-400"  style={{ width: `${(pend/target)*100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 text-xs">
                {[['bg-emerald-500','Published'],['bg-blue-400','Approved/Ready'],['bg-amber-400','In Review']].map(([bg, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${bg}`} />
                    <span className="text-slate-500 font-bold">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* published posts grid */}
            {monthPosts.filter(p => p.status === 'Posted').length > 0 && (
              <div>
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2 text-base">
                  <span>🏆</span> Published This Month
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthPosts.filter(p => p.status === 'Posted').map(p => (
                    <PostCard key={p._id} post={p} compact
                      onApprove={() => {}} onRevise={() => {}} onReject={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {/* service package */}
            {client?.services?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-black text-slate-800 mb-3 text-base">Your Service Package</h3>
                <div className="flex flex-wrap gap-2">
                  {client.services.map(s => (
                    <span key={s} className="bg-blue-50 text-blue-700 border border-blue-200 text-sm font-bold px-3 py-1.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
                {client.primaryPlatforms?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {client.primaryPlatforms.map(p => (
                      <span key={p} className="flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 text-sm font-bold px-3 py-1.5 rounded-full">
                        {PLATFORM_ICONS[p]?.icon} {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        Powered by <span className="font-black text-blue-700">DotGanga</span> · Jodhpur, Rajasthan
        <span className="mx-2">·</span>
        <a href="https://wa.me/917891234567" className="text-green-600 font-bold hover:underline">WhatsApp Support</a>
      </footer>
    </div>
  );
}
