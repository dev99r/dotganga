'use client';
import { useState, useEffect } from 'react';

const PLATFORM_CFG = {
  Instagram: { bg:'bg-pink-500/15',    text:'text-pink-400',    icon:'📸' },
  Facebook:  { bg:'bg-blue-500/15',    text:'text-blue-400',    icon:'📘' },
  YouTube:   { bg:'bg-red-500/15',     text:'text-red-400',     icon:'▶️' },
  LinkedIn:  { bg:'bg-sky-500/15',     text:'text-sky-400',     icon:'💼' },
  Twitter:   { bg:'bg-cyan-500/15',    text:'text-cyan-400',    icon:'🐦' },
  WhatsApp:  { bg:'bg-emerald-500/15', text:'text-emerald-400', icon:'💬' },
};

const STATUS_CFG = {
  'Draft':            { bg:'bg-slate-500/15', text:'text-slate-400' },
  'Pending Approval': { bg:'bg-amber-500/15', text:'text-amber-400', dot:'animate-pulse' },
  'Approved':         { bg:'bg-emerald-500/15',text:'text-emerald-400' },
  'Rejected':         { bg:'bg-red-500/15',   text:'text-red-400' },
  'Scheduled':        { bg:'bg-blue-500/15',  text:'text-blue-400' },
  'Published':        { bg:'bg-primary/15',   text:'text-primary-light' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MiniCalendar({ posts }) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();

  const byDay = {};
  posts.forEach(p => {
    if (!p.scheduledAt) return;
    const d = new Date(p.scheduledAt);
    if (d.getMonth() === month && d.getFullYear() === year)
      byDay[d.getDate()] = (byDay[d.getDate()] || 0) + 1;
  });

  return (
    <div className="card p-4">
      <p className="text-xs font-black text-muted uppercase tracking-wider mb-3">
        {MONTHS[month]} {year} Calendar
      </p>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <span key={i} className="text-[9px] font-black text-muted">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(first).fill(null).map((_,i) => <div key={`e${i}`} />)}
        {Array.from({length:days},(_,i)=>i+1).map(d => {
          const isToday = d === now.getDate();
          const hasPosts = byDay[d];
          return (
            <div key={d} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] transition-all ${
              isToday ? 'bg-primary text-white font-black' :
              hasPosts ? 'bg-primary/10 text-primary-light font-bold' :
              'text-muted hover:bg-surface-50'
            }`}>
              {d}
              {hasPosts && !isToday && <span className="w-1 h-1 bg-primary rounded-full mt-0.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  const [posts,    setPosts]    = useState([]);
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
    ]).then(([u, p]) => {
      if (u.success) setUser(u.user);
      if (p.success) setPosts(p.posts);
      setLoading(false);
    });
  }, []);

  const filtered = posts.filter(p => {
    if (tab === 'pending')   return p.status === 'Pending Approval';
    if (tab === 'published') return p.status === 'Published';
    if (tab === 'scheduled') return p.status === 'Scheduled' || p.status === 'Approved';
    return true;
  });

  const stats = {
    total:     posts.length,
    published: posts.filter(p => p.status === 'Published').length,
    pending:   posts.filter(p => p.status === 'Pending Approval').length,
    scheduled: posts.filter(p => ['Scheduled','Approved'].includes(p.status)).length,
  };

  const upcoming = posts
    .filter(p => p.scheduledAt && new Date(p.scheduledAt) >= new Date())
    .sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Loading your portal…</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

      {/* Welcome */}
      <div className="bg-gradient-to-br from-primary/20 to-surface-100 border border-primary/20 rounded-2xl p-5">
        <p className="text-xs font-black text-primary-light uppercase tracking-widest">Client Portal</p>
        <h1 className="text-2xl font-black text-slate-100 mt-1">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-muted mt-1">Here's your content overview for this month</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Posts',  value:stats.total,     color:'text-slate-100',    icon:'📊' },
          { label:'Published',    value:stats.published,  color:'text-primary-light',icon:'✅' },
          { label:'Pending',      value:stats.pending,    color:'text-amber-400',    icon:'⏳' },
          { label:'Scheduled',    value:stats.scheduled,  color:'text-blue-400',     icon:'📅' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted font-bold uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Filter tabs */}
          <div className="flex gap-1 bg-surface-200 rounded-xl p-1">
            {[
              { key:'all',       label:'All Posts'  },
              { key:'pending',   label:'⏳ Pending'  },
              { key:'scheduled', label:'📅 Scheduled'},
              { key:'published', label:'✅ Published' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all whitespace-nowrap ${tab===t.key?'bg-primary text-white':'text-muted hover:text-slate-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="card flex items-center justify-center py-12 text-center">
                <div>
                  <p className="text-3xl mb-2">📭</p>
                  <p className="font-bold text-slate-400">No posts here</p>
                </div>
              </div>
            ) : filtered.map(p => {
              const sCfg = STATUS_CFG[p.status] || STATUS_CFG.Draft;
              return (
                <div key={p._id} className="card p-4 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setSelected(p)}>
                  <div className="flex items-start gap-3">
                    {p.mediaUrls?.[0] ? (
                      <img src={p.mediaUrls[0]} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-surface-200 flex items-center justify-center text-xl shrink-0">📄</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <p className="font-black text-slate-200 text-sm">{p.title}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${sCfg.bg} ${sCfg.text}`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2">{p.caption}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {p.platforms?.map(pl => {
                          const c = PLATFORM_CFG[pl];
                          return <span key={pl} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${c?.bg} ${c?.text}`}>{c?.icon} {pl}</span>;
                        })}
                        {p.scheduledAt && (
                          <span className="text-[9px] text-muted ml-auto">
                            📅 {new Date(p.scheduledAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {p.status === 'Rejected' && p.approvalHistory?.findLast(h => h.action === 'rejected')?.comment && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      <p className="text-[10px] font-black text-red-400 mb-0.5">Feedback</p>
                      <p className="text-xs text-red-300">{p.approvalHistory.findLast(h => h.action === 'rejected').comment}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <MiniCalendar posts={posts} />

          {upcoming.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-black text-muted uppercase tracking-wider mb-3">Upcoming</p>
              <div className="space-y-2">
                {upcoming.map(p => {
                  const d = new Date(p.scheduledAt);
                  return (
                    <div key={p._id} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-primary-light uppercase">{MONTHS[d.getMonth()]}</span>
                        <span className="text-sm font-black text-primary-light">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate">{p.title}</p>
                        <p className="text-[9px] text-muted">{p.platforms?.join(', ')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Platform breakdown */}
          {posts.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-black text-muted uppercase tracking-wider mb-3">Platform Breakdown</p>
              {Object.entries(PLATFORM_CFG).map(([p, c]) => {
                const count = posts.filter(post => post.platforms?.includes(p)).length;
                if (!count) return null;
                const pct = Math.round((count / posts.length) * 100);
                return (
                  <div key={p} className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 w-20 shrink-0">{c.icon} {p}</span>
                    <div className="flex-1 bg-surface-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${c.bg.replace('/15','')}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-muted w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-surface-100 border border-border w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="font-black text-slate-100">{selected.title}</p>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-surface-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selected.mediaUrls?.[0] && (
                <img src={selected.mediaUrls[0]} alt="" className="w-full rounded-xl object-cover max-h-60" />
              )}
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.caption}</p>
              {selected.hashtags?.length > 0 && (
                <p className="text-xs text-primary-light">{selected.hashtags.map(h => `#${h}`).join(' ')}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-200 rounded-xl p-2">
                  <p className="text-muted font-semibold">Status</p>
                  <p className="text-slate-200 font-bold mt-0.5">{selected.status}</p>
                </div>
                <div className="bg-surface-200 rounded-xl p-2">
                  <p className="text-muted font-semibold">Media Type</p>
                  <p className="text-slate-200 font-bold mt-0.5 capitalize">{selected.mediaType}</p>
                </div>
                {selected.scheduledAt && (
                  <div className="bg-surface-200 rounded-xl p-2 col-span-2">
                    <p className="text-muted font-semibold">Scheduled</p>
                    <p className="text-slate-200 font-bold mt-0.5">
                      {new Date(selected.scheduledAt).toLocaleString('en-IN',{dateStyle:'long',timeStyle:'short'})}
                    </p>
                  </div>
                )}
              </div>
              {selected.approvalHistory?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">Review History</p>
                  <div className="space-y-2">
                    {selected.approvalHistory.map((h, i) => (
                      <div key={i} className={`px-3 py-2 rounded-xl text-xs ${h.action==='approved'?'bg-emerald-500/10 text-emerald-300':h.action==='rejected'?'bg-red-500/10 text-red-300':'bg-amber-500/10 text-amber-300'}`}>
                        <p className="font-bold capitalize">{h.action.replace('_',' ')} by {h.by}</p>
                        {h.comment && <p className="mt-0.5 opacity-80">{h.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
