import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isSameMonth, addMonths, subMonths,
} from 'date-fns';
import NotificationsBell from '../components/shared/NotificationsBell';

// ─── Config ──────────────────────────────────────────────────────────────────
const PLATFORM_ICONS = {
  Instagram:'📸', Facebook:'📘', LinkedIn:'💼',
  Twitter:'🐦',  YouTube:'▶️',  WhatsApp:'💬',
};
const CAT = {
  Reel:         { icon:'🎬', grad:'from-pink-500 to-rose-600',    dot:'bg-pink-500',    light:'bg-pink-50 text-pink-700'     },
  Carousel:     { icon:'🎠', grad:'from-violet-500 to-purple-600',dot:'bg-violet-500',  light:'bg-violet-50 text-violet-700' },
  Story:        { icon:'📱', grad:'from-blue-500 to-cyan-600',    dot:'bg-blue-500',    light:'bg-blue-50 text-blue-700'     },
  Organic:      { icon:'📸', grad:'from-emerald-500 to-teal-600', dot:'bg-emerald-500', light:'bg-emerald-50 text-emerald-700'},
  'Ad Creative':{ icon:'🎯', grad:'from-orange-500 to-red-600',   dot:'bg-orange-500',  light:'bg-orange-50 text-orange-700' },
  Other:        { icon:'📋', grad:'from-slate-400 to-slate-600',  dot:'bg-slate-400',   light:'bg-slate-100 text-slate-600'  },
};
const getCat = k => CAT[k] || CAT.Other;

const AP_CFG = {
  Pending:  { bg:'bg-amber-50',    ring:'ring-amber-200',  text:'text-amber-700',  badge:'bg-amber-100',   bar:'bg-amber-400',    label:'Awaiting Review' },
  Approved: { bg:'bg-emerald-50',  ring:'ring-emerald-200',text:'text-emerald-700',badge:'bg-emerald-100', bar:'bg-emerald-500',  label:'Approved ✓'      },
  Rejected: { bg:'bg-red-50',      ring:'ring-red-200',    text:'text-red-700',    badge:'bg-red-100',     bar:'bg-red-500',      label:'Rejected'        },
  Revision: { bg:'bg-violet-50',   ring:'ring-violet-200', text:'text-violet-700', badge:'bg-violet-100',  bar:'bg-violet-500',   label:'Needs Revision'  },
};

function fmt(n)    { return new Intl.NumberFormat('en-IN').format(Math.round(n||0)); }
function fmtCur(n) { return `₹${new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.round(n||0))}`; }

// ─── Post Approval Card ───────────────────────────────────────────────────────
function PostCard({ post, onRefresh }) {
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ap = AP_CFG[post.approvalStatus] || AP_CFG.Pending;
  const c  = getCat(post.category);

  const act = async (status) => {
    setLoading(true);
    try {
      await api.patch(`/posts/${post._id}/approve`, { status, note });
      toast.success(status === 'Approved' ? '✅ Post Approved!' : status === 'Rejected' ? '❌ Post Rejected' : '✏️ Revision Requested');
      setNote('');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={`bg-white rounded-3xl ring-1 overflow-hidden shadow-sm transition-all hover:shadow-md ${ap.ring}`}>
      {/* Category color bar */}
      <div className={`h-1.5 bg-gradient-to-r ${c.grad}`}/>

      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full ${c.light}`}>
              {c.icon} {post.category}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${ap.badge} ${ap.text}`}>
              {ap.label}
            </span>
            {post.aiGenerated && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">✨ AI</span>
            )}
          </div>
          {post.scheduledDate && (
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-800">{format(new Date(post.scheduledDate),'dd MMM')}</p>
              <p className="text-[10px] text-slate-400">{format(new Date(post.scheduledDate),'HH:mm')}</p>
            </div>
          )}
        </div>

        {/* Media */}
        {post.mediaUrls?.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl">
            {post.mediaUrls.length === 1 ? (
              <img src={post.mediaUrls[0]} alt="" className="w-full aspect-video object-cover bg-slate-100"/>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {post.mediaUrls.slice(0,4).map((url,i)=>(
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-full aspect-square object-cover bg-slate-100"/>
                    {i===3 && post.mediaUrls.length>4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-black text-xl">
                        +{post.mediaUrls.length-4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-4">
            <p className={`text-sm text-slate-700 leading-relaxed ${!expanded?'line-clamp-3':''}`}>
              {post.caption}
            </p>
            {post.caption.length > 150 && (
              <button onClick={()=>setExpanded(!expanded)} className="text-xs text-blue-500 font-bold mt-1.5 hover:text-blue-700">
                {expanded?'Show less ↑':'Read more ↓'}
              </button>
            )}
            {post.hashtags && <p className="text-xs text-blue-400 mt-1.5 line-clamp-2">{post.hashtags}</p>}
          </div>
        )}

        {/* Platforms */}
        <div className="flex items-center gap-1.5 mb-4">
          {post.platforms?.map(p=>(
            <div key={p} className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1">
              <span className="text-sm">{PLATFORM_ICONS[p]}</span>
              <span className="text-[10px] font-bold text-slate-500">{p}</span>
            </div>
          ))}
        </div>

        {/* Previous approval note */}
        {post.approvalNote && post.approvalStatus !== 'Pending' && (
          <div className={`rounded-2xl px-3 py-2.5 mb-4 text-xs italic ${
            post.approvalStatus==='Approved'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'
          }`}>
            "{post.approvalNote}"
          </div>
        )}

        {/* Action area — only for pending */}
        {post.approvalStatus === 'Pending' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
              placeholder="Add a note for the team (optional)…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none placeholder-slate-400"/>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>act('Approved')} disabled={loading}
                className="py-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black transition-all disabled:opacity-50 shadow-sm active:scale-95">
                ✓ Approve
              </button>
              <button onClick={()=>act('Revision')} disabled={loading}
                className="py-2.5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-xs font-black transition-all disabled:opacity-50 shadow-sm active:scale-95">
                ✏️ Revise
              </button>
              <button onClick={()=>act('Rejected')} disabled={loading}
                className="py-2.5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-black transition-all disabled:opacity-50 shadow-sm active:scale-95">
                ✕ Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────
function ClientCalendar({ posts, clientName }) {
  const [month, setMonth] = useState(new Date());

  const calDays = useMemo(() => {
    const start = startOfMonth(month);
    const end   = endOfMonth(month);
    const days  = eachDayOfInterval({ start, end });
    const leading  = start.getDay();
    const trailing = 6 - end.getDay();
    const prev = Array.from({length:leading},  (_,i) => new Date(start.getFullYear(),start.getMonth(),-leading+i+1));
    const next = Array.from({length:trailing}, (_,i) => new Date(end.getFullYear(),  end.getMonth()+1, i+1));
    return [...prev, ...days, ...next];
  }, [month]);

  const monthPosts = useMemo(() =>
    posts.filter(p => p.scheduledDate && isSameMonth(new Date(p.scheduledDate), month)),
    [posts, month]
  );

  const catCounts = useMemo(() => {
    const m = {};
    monthPosts.forEach(p => { m[p.category] = (m[p.category]||0)+1; });
    return m;
  }, [monthPosts]);

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-black text-slate-900">{format(month,'MMMM yyyy')}</p>
            <p className="text-xs text-slate-400 mt-0.5">{clientName}'s Content Calendar</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={()=>setMonth(m=>subMonths(m,1))} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button onClick={()=>setMonth(new Date())} className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Today</button>
            <button onClick={()=>setMonth(m=>addMonths(m,1))} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-slate-50 bg-slate-50/30">
          {Object.entries(CAT).slice(0,5).map(([k,v])=>(
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${v.dot}`}/>
              <span className="text-xs text-slate-600 font-bold">{v.icon} {k} <span className="text-slate-400 font-normal">({catCounts[k]||0})</span></span>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(
            <div key={i} className="text-center py-2.5 text-[10px] sm:text-xs font-black text-slate-400 uppercase border-r border-slate-50 last:border-0 truncate px-0.5">{d.slice(0,1)}<span className="hidden sm:inline">{d.slice(1)}</span></div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-slate-50">
          {calDays.map((day, idx) => {
            const dayPosts = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), day));
            const inMonth  = isSameMonth(day, month);
            return (
              <div key={idx} className={`border-r border-b border-slate-50 last:border-r-0 p-1 sm:p-1.5
                min-h-[52px] sm:min-h-[80px] ${
                isToday(day) ? 'bg-blue-50/40' : !inMonth ? 'bg-slate-50/60' : 'bg-white'
              }`}>
                <p className={`text-xs sm:text-sm font-black w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mb-0.5 ${
                  isToday(day) ? 'bg-blue-950 text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'
                }`}>{format(day,'d')}</p>

                {/* Mobile: colored dots */}
                {dayPosts.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {dayPosts.slice(0,5).map(post => (
                      <div key={post._id} className={`w-1.5 h-1.5 rounded-full ${getCat(post.category).dot}`}/>
                    ))}
                  </div>
                )}

                {/* Desktop: mini chips */}
                <div className="hidden sm:block space-y-0.5 overflow-hidden">
                  {dayPosts.slice(0,3).map(post => {
                    const pc = getCat(post.category);
                    return (
                      <div key={post._id} className={`flex items-center gap-0.5 rounded-md px-1 py-0.5 bg-gradient-to-r ${pc.grad}`}>
                        <span className="text-[10px] text-white">{pc.icon}</span>
                        <span className="text-[10px] text-white/90 font-bold truncate leading-tight">{post.category}</span>
                        {post.platforms?.[0] && <span className="text-[10px] text-white/70 ml-auto">{PLATFORM_ICONS[post.platforms[0]]}</span>}
                      </div>
                    );
                  })}
                  {dayPosts.length > 3 && (
                    <p className="text-[10px] text-slate-400 font-bold text-center">+{dayPosts.length-3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month content summary */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {Object.entries(CAT).slice(0,5).map(([k,v])=>(
          <div key={k} className={`bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm`}>
            <p className="text-xl">{v.icon}</p>
            <p className="text-xl font-black text-slate-800 mt-1">{catCounts[k]||0}</p>
            <p className="text-xs text-slate-500 font-bold">{k}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Meta Ads Panel ───────────────────────────────────────────────────────────
function MetaAdsPanel({ clientId }) {
  const [insights,   setInsights]   = useState(null);
  const [campaigns,  setCampaigns]  = useState([]);
  const [daily,      setDaily]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const iRes = await api.get(`/meta-ads/insights/${clientId}?days=30`);
        setInsights(iRes.data.totals);
        setDaily(iRes.data.daily || []);
        const cRes = await api.get(`/meta-ads/campaigns/${clientId}`);
        setCampaigns(cRes.data.campaigns || []);
      } catch { /* no-op */ }
      finally { setLoading(false); }
    })();
  }, [clientId]);

  if (loading) return <div className="h-48 bg-slate-100 rounded-3xl animate-pulse"/>;
  if (!insights) return (
    <div className="bg-white rounded-3xl border border-slate-100 p-14 text-center">
      <p className="text-5xl mb-3">📊</p>
      <p className="font-bold text-slate-600 text-lg">No ads data yet</p>
      <p className="text-sm text-slate-400 mt-1">Your account manager will connect your Meta Ads account soon.</p>
    </div>
  );

  const maxSpend = Math.max(...daily.map(d=>d.spend||0), 1);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Impressions', value:fmt(insights.impressions),   icon:'👁️',  grad:'from-blue-500 to-blue-600'   },
          {label:'Clicks',      value:fmt(insights.clicks),         icon:'🖱️',  grad:'from-violet-500 to-purple-600'},
          {label:'Total Spend', value:fmtCur(insights.spend),       icon:'💰',  grad:'from-emerald-500 to-teal-600' },
          {label:'Leads',       value:fmt(insights.leadCount),      icon:'🎯',  grad:'from-orange-500 to-red-600'   },
        ].map(m=>(
          <div key={m.label} className={`bg-gradient-to-br ${m.grad} rounded-3xl p-5 text-white`}>
            <p className="text-2xl mb-2">{m.icon}</p>
            <p className="text-2xl font-black leading-none">{m.value}</p>
            <p className="text-xs text-white/70 font-bold mt-1.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Click Rate (CTR)',  value:`${Number(insights.ctr||0).toFixed(2)}%`,  desc:'% of viewers who clicked'},
          {label:'Cost per 1K (CPM)', value:fmtCur(insights.cpm),                       desc:'Cost per 1000 impressions'},
          {label:'Cost per Click',    value:fmtCur(insights.cpc),                        desc:'Average cost per click'},
        ].map(m=>(
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xl font-black text-slate-900">{m.value}</p>
            <p className="text-xs font-bold text-slate-600 mt-1">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Spend chart */}
      {daily.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <p className="text-sm font-black text-slate-700 mb-4">📈 Daily Ad Spend (Last 30 Days)</p>
          <div className="flex items-end gap-0.5 h-24 overflow-hidden">
            {daily.slice(-30).map((d, i) => {
              const h = Math.round(((d.spend||0) / maxSpend) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group" title={`${format(new Date(d.date),'dd MMM')}: ${fmtCur(d.spend)}`}>
                  <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all group-hover:from-blue-700 group-hover:to-blue-500"
                    style={{ height: `${Math.max(h,2)}%` }}/>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-[10px] text-slate-400">{daily[0] ? format(new Date(daily[0].date),'dd MMM') : ''}</p>
            <p className="text-[10px] text-slate-400">{daily[daily.length-1] ? format(new Date(daily[daily.length-1].date),'dd MMM') : ''}</p>
          </div>
        </div>
      )}

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/30">
            <p className="text-sm font-black text-slate-700">Active Campaigns</p>
          </div>
          <div className="divide-y divide-slate-50">
            {campaigns.map(camp => (
              <div key={camp._id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${camp.status==='ACTIVE'?'bg-emerald-500':'bg-slate-300'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{camp.name}</p>
                  <p className="text-[10px] text-slate-400">{camp.objective}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                  camp.status==='ACTIVE'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'
                }`}>{camp.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [client,     setClient]     = useState(null);
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('approvals');
  const [filterStat, setFilterStat] = useState('all');

  const load = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/clients/my/portal'),
        api.get('/posts?limit=200'),
      ]);
      setClient(cRes.data.client);
      setPosts(pRes.data.posts || []);
    } catch { toast.error('Failed to load portal data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total:     posts.length,
    pending:   posts.filter(p=>p.approvalStatus==='Pending').length,
    approved:  posts.filter(p=>p.approvalStatus==='Approved').length,
    rejected:  posts.filter(p=>p.approvalStatus==='Rejected').length,
    scheduled: posts.filter(p=>p.status==='Scheduled').length,
  }), [posts]);

  const filteredPosts = useMemo(() => {
    if (filterStat === 'all') return posts;
    if (filterStat === 'pending')  return posts.filter(p=>p.approvalStatus==='Pending');
    if (filterStat === 'approved') return posts.filter(p=>p.approvalStatus==='Approved');
    if (filterStat === 'revision') return posts.filter(p=>p.approvalStatus==='Revision');
    return posts;
  }, [posts, filterStat]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tabs = [
    { id:'approvals', label:'Approvals',  icon:'✅', badge: stats.pending > 0 ? stats.pending : null },
    { id:'calendar',  label:'Calendar',   icon:'📅', badge: null },
    ...(client?.metaConnected ? [{ id:'ads', label:'Meta Ads', icon:'📊', badge:null }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin"/>
          <p className="text-white/60 font-medium">Loading your portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {client?.logoUrl ? (
              <img src={client.logoUrl} alt={client.businessName} className="h-9 w-9 rounded-2xl object-cover bg-slate-100"/>
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-sm shrink-0">
                {client?.businessName?.charAt(0) || 'C'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate">{client?.businessName || 'Client Portal'}</p>
              <p className="text-[10px] text-slate-400">Content Approval Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NotificationsBell/>
            {/* User avatar */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black">
                {user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-600 hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={logout} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors" title="Sign out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-violet-900 rounded-3xl p-6 text-white relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full"/>
          <div className="absolute -bottom-6 right-16 w-24 h-24 bg-white/5 rounded-full"/>

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black">{greeting()}, {user?.name?.split(' ')[0]} 👋</p>
                <p className="text-blue-300 text-sm mt-1 leading-relaxed">
                  {stats.pending > 0
                    ? `You have ${stats.pending} post${stats.pending>1?'s':''} waiting for your approval.`
                    : stats.approved > 0
                    ? `You're all caught up! ${stats.approved} posts approved this month.`
                    : 'Your content calendar is ready for this month.'}
                </p>
              </div>
              {stats.pending > 0 && (
                <div className="shrink-0 text-right">
                  <div className="bg-amber-400 text-amber-900 font-black text-2xl w-14 h-14 rounded-2xl flex items-center justify-center">
                    {stats.pending}
                  </div>
                  <p className="text-[10px] text-blue-300 mt-1">pending</p>
                </div>
              )}
            </div>

            {/* Services badges */}
            {client?.services?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {client.services.map(s=>(
                  <span key={s} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label:'Total',     value:stats.total,     color:'text-slate-800',    bg:'bg-white',       border:'border-slate-100' },
            { label:'Pending',   value:stats.pending,   color:'text-amber-600',    bg:'bg-amber-50',    border:'border-amber-100' },
            { label:'Approved',  value:stats.approved,  color:'text-emerald-600',  bg:'bg-emerald-50',  border:'border-emerald-100'},
            { label:'Scheduled', value:stats.scheduled, color:'text-blue-600',     bg:'bg-blue-50',     border:'border-blue-100'  },
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} px-3 sm:px-4 py-3 text-center shadow-sm`}>
              <p className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-600 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === t.id ? 'bg-blue-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ml-0.5 ${activeTab===t.id?'bg-white text-blue-950':'bg-amber-400 text-white'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Approvals Tab ── */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                {id:'all',      label:'All Posts'},
                {id:'pending',  label:`⏳ Pending (${stats.pending})`},
                {id:'approved', label:`✅ Approved`},
                {id:'revision', label:`✏️ Revision`},
              ].map(f=>(
                <button key={f.id} onClick={()=>setFilterStat(f.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                    filterStat===f.id?'bg-blue-950 text-white border-blue-950':'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                <p className="text-5xl mb-4">
                  {filterStat==='pending'?'🎉':filterStat==='approved'?'📋':'📭'}
                </p>
                <p className="font-bold text-slate-600 text-lg">
                  {filterStat==='pending'?'All clear! No pending approvals':'No posts in this filter'}
                </p>
                <p className="text-sm text-slate-400 mt-1.5">
                  {filterStat==='pending'?'Your team will send posts here for your review soon.':'Try a different filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPosts.map(post => (
                  <PostCard key={post._id} post={post} onRefresh={load}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Calendar Tab ── */}
        {activeTab === 'calendar' && (
          <ClientCalendar posts={posts} clientName={client?.businessName || 'Your Brand'}/>
        )}

        {/* ── Meta Ads Tab ── */}
        {activeTab === 'ads' && client && (
          <MetaAdsPanel clientId={client._id}/>
        )}
      </main>

      {/* Bottom padding for mobile */}
      <div className="h-8"/>
    </div>
  );
}
