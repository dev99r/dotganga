import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  format, parseISO, isToday, isTomorrow, startOfDay, endOfDay,
  startOfTomorrow, endOfTomorrow, differenceInMinutes, isBefore,
} from 'date-fns';

// ─── shared constants (same as SocialMediaManager) ───────────────────────────

const CAT = {
  Reel:           { icon: '🎬', bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-300',  badge: 'bg-violet-600',  grad: 'from-violet-500 to-purple-600'  },
  Carousel:       { icon: '🖼️', bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',    badge: 'bg-blue-600',    grad: 'from-blue-500 to-cyan-600'      },
  Story:          { icon: '📱', bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-300',    badge: 'bg-pink-600',    grad: 'from-pink-500 to-rose-600'      },
  Organic:        { icon: '🌿', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', badge: 'bg-emerald-600', grad: 'from-emerald-500 to-teal-600'   },
  'Ad Creative':  { icon: '🎯', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',   badge: 'bg-amber-600',   grad: 'from-orange-500 to-amber-600'   },
};
const getCat = k => CAT[k] || { icon: '📋', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', badge: 'bg-slate-500', grad: 'from-slate-400 to-slate-600' };

const PLATFORM_ICONS = {
  Instagram: '📸', Facebook: '👍', LinkedIn: '💼',
  Twitter: '🐦', YouTube: '▶️', WhatsApp: '💬',
};

const CLIENT_PALETTE = [
  { bg: 'bg-violet-500',  light: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200', ring: 'ring-violet-400',  hex: '#8b5cf6' },
  { bg: 'bg-pink-500',    light: 'bg-pink-50',     text: 'text-pink-700',    border: 'border-pink-200',   ring: 'ring-pink-400',    hex: '#ec4899' },
  { bg: 'bg-blue-500',    light: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',   ring: 'ring-blue-400',    hex: '#3b82f6' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200',ring: 'ring-emerald-400', hex: '#10b981' },
  { bg: 'bg-orange-500',  light: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200', ring: 'ring-orange-400',  hex: '#f97316' },
  { bg: 'bg-cyan-500',    light: 'bg-cyan-50',     text: 'text-cyan-700',    border: 'border-cyan-200',   ring: 'ring-cyan-400',    hex: '#06b6d4' },
  { bg: 'bg-rose-500',    light: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200',   ring: 'ring-rose-400',    hex: '#f43f5e' },
  { bg: 'bg-teal-500',    light: 'bg-teal-50',     text: 'text-teal-700',    border: 'border-teal-200',   ring: 'ring-teal-400',    hex: '#14b8a6' },
  { bg: 'bg-indigo-500',  light: 'bg-indigo-50',   text: 'text-indigo-700',  border: 'border-indigo-200', ring: 'ring-indigo-400',  hex: '#6366f1' },
  { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-50',  text: 'text-fuchsia-700', border: 'border-fuchsia-200',ring: 'ring-fuchsia-400', hex: '#d946ef' },
  { bg: 'bg-lime-500',    light: 'bg-lime-50',     text: 'text-lime-700',    border: 'border-lime-200',   ring: 'ring-lime-400',    hex: '#84cc16' },
  { bg: 'bg-sky-500',     light: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-200',    ring: 'ring-sky-400',     hex: '#0ea5e9' },
  { bg: 'bg-amber-500',   light: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',  ring: 'ring-amber-400',   hex: '#f59e0b' },
  { bg: 'bg-green-500',   light: 'bg-green-50',    text: 'text-green-700',   border: 'border-green-200',  ring: 'ring-green-400',   hex: '#22c55e' },
  { bg: 'bg-purple-500',  light: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200', ring: 'ring-purple-400',  hex: '#a855f7' },
  { bg: 'bg-red-500',     light: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',    ring: 'ring-red-400',     hex: '#ef4444' },
  { bg: 'bg-slate-500',   light: 'bg-slate-50',    text: 'text-slate-700',   border: 'border-slate-200',  ring: 'ring-slate-400',   hex: '#64748b' },
];

const STATUS_CONFIG = {
  Posted:    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Posted'    },
  Scheduled: { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Scheduled' },
  Draft:     { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Draft'     },
  Failed:    { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Failed'    },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function getClientPalette(clients, clientId) {
  const idx = clients.findIndex(c => c._id === clientId);
  return CLIENT_PALETTE[(idx >= 0 ? idx : 0) % CLIENT_PALETTE.length];
}

function healthScore(posts) {
  if (!posts.length) return 0;
  const posted = posts.filter(p => p.status === 'Posted').length;
  return Math.round((posted / posts.length) * 100);
}

function getTimeLabel(iso) {
  try {
    return format(parseISO(iso), 'h:mm a');
  } catch {
    return '';
  }
}

// ─── PostRow ─────────────────────────────────────────────────────────────────

function PostRow({ post, onMarkPosted, palette }) {
  const cat = getCat(post.category);
  const st  = STATUS_CONFIG[post.status] || STATUS_CONFIG.Draft;
  const isOverdue = post.status !== 'Posted' &&
    post.scheduledDate && isBefore(parseISO(post.scheduledDate), new Date());

  return (
    <div className={`group flex items-start gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${
      isOverdue
        ? 'bg-red-50/60 border-red-200'
        : `${palette.light} ${palette.border}`
    }`}>
      {/* Category icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base ${cat.bg}`}>
        {cat.icon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} mr-1 align-middle`} />
            {st.label}
          </span>
          {isOverdue && (
            <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
              OVERDUE
            </span>
          )}
          {post.scheduledDate && (
            <span className="text-xs text-slate-500">{getTimeLabel(post.scheduledDate)}</span>
          )}
        </div>

        <p className="text-sm text-slate-800 mt-1 leading-snug line-clamp-2">
          {post.caption || <span className="text-slate-400 italic">No caption</span>}
        </p>

        {/* Platform chips */}
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {(post.platforms || []).map(p => (
            <span key={p} className="text-xs bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded-md">
              {PLATFORM_ICONS[p] || '📡'} {p}
            </span>
          ))}
        </div>
      </div>

      {/* Mark Posted button */}
      {post.status !== 'Posted' && (
        <button
          onClick={() => onMarkPosted(post._id)}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white
            hover:bg-emerald-700 active:scale-95 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100 shadow-sm"
        >
          ✓ Post
        </button>
      )}
    </div>
  );
}

// ─── ClientCard ───────────────────────────────────────────────────────────────

function ClientCard({ client, posts, onMarkPosted, palette }) {
  const [collapsed, setCollapsed] = useState(false);
  const posted = posts.filter(p => p.status === 'Posted').length;
  const total  = posts.length;
  const pct    = total > 0 ? Math.round((posted / total) * 100) : 0;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${palette.border}`}>
      {/* Client header */}
      <button
        className={`w-full flex items-center gap-3 px-4 py-3 ${palette.light} hover:brightness-95 transition-all`}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className={`w-9 h-9 rounded-xl ${palette.bg} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>
          {(client.businessName || client.name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={`font-black text-sm ${palette.text} truncate`}>
            {client.businessName || client.name}
          </p>
          <p className="text-xs text-slate-500">{posted}/{total} posts done</p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-20 h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-black ${pct === 100 ? 'text-emerald-600' : palette.text}`}>
            {pct}%
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Posts list */}
      {!collapsed && (
        <div className="px-3 py-3 space-y-2 bg-white/50">
          {posts.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-3">No posts scheduled for today.</p>
          ) : (
            posts.map(p => (
              <PostRow key={p._id} post={p} onMarkPosted={onMarkPosted} palette={palette} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── TodayCommandCenter ───────────────────────────────────────────────────────

export default function TodayCommandCenter() {
  const [posts,   setPosts]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());
  const [tab,     setTab]     = useState('today'); // 'today' | 'tomorrow'

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [postsRes, clientsRes] = await Promise.all([
        api.get('/posts?limit=500'),
        api.get('/clients'),
      ]);
      setPosts(postsRes.data.posts   || []);
      setClients(clientsRes.data.clients || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── computed ────────────────────────────────────────────────────────────────

  const todayPosts    = useMemo(() => posts.filter(p =>
    p.scheduledDate && isToday(parseISO(p.scheduledDate))
  ), [posts]);

  const tomorrowPosts = useMemo(() => posts.filter(p =>
    p.scheduledDate && isTomorrow(parseISO(p.scheduledDate))
  ), [posts]);

  const overduePosts  = useMemo(() => posts.filter(p =>
    p.status !== 'Posted' &&
    p.scheduledDate &&
    isBefore(parseISO(p.scheduledDate), startOfDay(new Date()))
  ), [posts]);

  const score = useMemo(() => healthScore(todayPosts), [todayPosts]);

  // group today posts by client
  const todayByClient = useMemo(() => {
    const map = {};
    todayPosts.forEach(p => {
      const cid = p.clientId?._id || p.clientId;
      if (!map[cid]) map[cid] = { client: p.clientId, posts: [] };
      map[cid].posts.push(p);
    });
    return Object.values(map);
  }, [todayPosts]);

  // group tomorrow posts by client
  const tomorrowByClient = useMemo(() => {
    const map = {};
    tomorrowPosts.forEach(p => {
      const cid = p.clientId?._id || p.clientId;
      if (!map[cid]) map[cid] = { client: p.clientId, posts: [] };
      map[cid].posts.push(p);
    });
    return Object.values(map);
  }, [tomorrowPosts]);

  // category breakdown for today
  const catBreakdown = useMemo(() => {
    const map = {};
    todayPosts.forEach(p => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [todayPosts]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const markPosted = useCallback(async (postId) => {
    const tid = toast.loading('Marking as posted…');
    try {
      await api.put(`/posts/${postId}`, { status: 'Posted', postedAt: new Date().toISOString() });
      toast.success('Marked as posted!', { id: tid });
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, status: 'Posted', postedAt: new Date().toISOString() } : p));
    } catch {
      toast.error('Failed to update post', { id: tid });
    }
  }, []);

  // ── derived stats ────────────────────────────────────────────────────────────

  const postedCount    = todayPosts.filter(p => p.status === 'Posted').length;
  const scheduledCount = todayPosts.filter(p => p.status === 'Scheduled').length;
  const draftCount     = todayPosts.filter(p => p.status === 'Draft').length;
  const totalCount     = todayPosts.length;

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const scoreBg    = score >= 80 ? 'from-emerald-500 to-teal-500' : score >= 50 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Loading today's hub…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${scoreBg} p-6 text-white shadow-xl`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Date block */}
          <div className="flex-1">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">
              {format(now, 'EEEE')}
            </p>
            <h1 className="text-4xl font-black leading-none">
              {format(now, 'd MMMM yyyy')}
            </h1>
            <p className="text-white/80 text-base mt-1">
              {format(now, 'h:mm a')} · Content Command Center
            </p>
          </div>

          {/* Health score ring */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-center shrink-0">
            <p className="text-white/70 text-xs font-black uppercase tracking-wider mb-1">Agency Health</p>
            <div className="text-5xl font-black leading-none">{score}%</div>
            <p className="text-white/80 text-xs mt-1">
              {postedCount}/{totalCount} posted today
            </p>
          </div>
        </div>

        {/* Upload progress bar */}
        {totalCount > 0 && (
          <div className="relative mt-5">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>{postedCount} posted</span>
              <span>{totalCount - postedCount} remaining</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Today', value: totalCount,     color: 'text-slate-800', bg: 'bg-white',         icon: '📅' },
          { label: 'Posted',      value: postedCount,    color: 'text-emerald-700', bg: 'bg-emerald-50',  icon: '✅' },
          { label: 'Scheduled',   value: scheduledCount, color: 'text-blue-700',   bg: 'bg-blue-50',     icon: '⏰' },
          { label: 'Overdue',     value: overduePosts.length, color: overduePosts.length > 0 ? 'text-red-700' : 'text-slate-400', bg: overduePosts.length > 0 ? 'bg-red-50' : 'bg-white', icon: overduePosts.length > 0 ? '🚨' : '✓' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-slate-100 rounded-2xl p-4 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ALERT STRIP ─────────────────────────────────────────────────────── */}
      {overduePosts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600 text-lg">🚨</span>
            <h3 className="font-black text-red-800 text-sm uppercase tracking-wide">
              {overduePosts.length} Overdue Post{overduePosts.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="space-y-2">
            {overduePosts.slice(0, 5).map(p => {
              const clientName = p.clientId?.businessName || p.clientId?.name || 'Unknown Client';
              return (
                <div key={p._id} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 border border-red-100">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-red-700 text-xs">{clientName}</span>
                    <span className="text-slate-500 text-xs ml-2">
                      {p.scheduledDate ? format(parseISO(p.scheduledDate), 'dd MMM, h:mm a') : ''}
                    </span>
                    <p className="text-slate-600 text-xs truncate">{p.caption || 'No caption'}</p>
                  </div>
                  <button
                    onClick={() => markPosted(p._id)}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Mark Posted
                  </button>
                </div>
              );
            })}
            {overduePosts.length > 5 && (
              <p className="text-red-600 text-xs font-medium text-center">
                +{overduePosts.length - 5} more overdue posts
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── CATEGORY BREAKDOWN ──────────────────────────────────────────────── */}
      {catBreakdown.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-3">
            Today's Content Mix
          </h3>
          <div className="flex gap-2 flex-wrap">
            {catBreakdown.map(([cat, count]) => {
              const c = getCat(cat);
              return (
                <div key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${c.bg} ${c.text} text-xs font-bold`}>
                  <span>{c.icon}</span>
                  <span>{cat}</span>
                  <span className={`ml-1 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ${c.badge}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB SWITCHER ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
        {[
          { key: 'today',    label: `Today's Schedule`, count: todayPosts.length },
          { key: 'tomorrow', label: 'Tomorrow Preview',  count: tomorrowPosts.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
              tab === t.key
                ? 'bg-blue-950 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
        <button
          onClick={load}
          className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-sm transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* ── TODAY'S SCHEDULE ─────────────────────────────────────────────────── */}
      {tab === 'today' && (
        <div className="space-y-4">
          {todayByClient.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-black text-slate-700 text-lg">No posts scheduled today</h3>
              <p className="text-slate-400 text-sm mt-1">Enjoy the quiet day or plan ahead!</p>
            </div>
          ) : (
            todayByClient.map(({ client, posts: clientPosts }) => {
              const cid     = client?._id || client;
              const palette = getClientPalette(clients, cid);
              return (
                <ClientCard
                  key={cid}
                  client={client || { businessName: 'Unknown Client', _id: cid }}
                  posts={clientPosts}
                  onMarkPosted={markPosted}
                  palette={palette}
                />
              );
            })
          )}
        </div>
      )}

      {/* ── TOMORROW PREVIEW ─────────────────────────────────────────────────── */}
      {tab === 'tomorrow' && (
        <div className="space-y-3">
          {tomorrowByClient.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-3">📭</div>
              <h3 className="font-black text-slate-700 text-lg">Nothing scheduled for tomorrow</h3>
              <p className="text-slate-400 text-sm mt-1">Consider planning some content ahead of time.</p>
            </div>
          ) : (
            tomorrowByClient.map(({ client, posts: clientPosts }) => {
              const cid     = client?._id || client;
              const palette = getClientPalette(clients, cid);
              const clientName = client?.businessName || client?.name || 'Unknown';
              return (
                <div key={cid} className={`bg-white border-2 ${palette.border} rounded-2xl overflow-hidden shadow-sm`}>
                  {/* Compact header */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${palette.light}`}>
                    <div className={`w-8 h-8 rounded-lg ${palette.bg} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                      {clientName[0].toUpperCase()}
                    </div>
                    <p className={`font-black text-sm ${palette.text}`}>{clientName}</p>
                    <span className={`ml-auto text-xs font-bold ${palette.text} ${palette.light} px-2 py-0.5 rounded-full border ${palette.border}`}>
                      {clientPosts.length} posts
                    </span>
                  </div>

                  {/* Compact post list */}
                  <div className="px-4 py-3 space-y-2">
                    {clientPosts.map(p => {
                      const cat = getCat(p.category);
                      return (
                        <div key={p._id} className="flex items-center gap-2 text-sm py-1">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${cat.bg}`}>{cat.icon}</span>
                          <span className="text-slate-700 flex-1 truncate">{p.caption || 'No caption'}</span>
                          {p.scheduledDate && (
                            <span className="text-xs text-slate-400 shrink-0">{getTimeLabel(p.scheduledDate)}</span>
                          )}
                          <span className="text-xs text-slate-400 shrink-0">
                            {(p.platforms || []).map(pl => PLATFORM_ICONS[pl] || '').join(' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
