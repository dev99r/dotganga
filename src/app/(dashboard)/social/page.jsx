'use client';
import { useState, useEffect } from 'react';

const PLATFORMS = ['Instagram','Facebook','YouTube','LinkedIn','Twitter','WhatsApp'];
const STATUSES  = ['Draft','Pending Approval','Approved','Rejected','Scheduled','Published'];

const PLATFORM_CFG = {
  Instagram: { color:'#E1306C', bg:'bg-pink-500/15', text:'text-pink-400', border:'border-pink-500/30' },
  Facebook:  { color:'#1877F2', bg:'bg-blue-500/15',  text:'text-blue-400',  border:'border-blue-500/30'  },
  YouTube:   { color:'#FF0000', bg:'bg-red-500/15',   text:'text-red-400',   border:'border-red-500/30'   },
  LinkedIn:  { color:'#0A66C2', bg:'bg-sky-500/15',   text:'text-sky-400',   border:'border-sky-500/30'   },
  Twitter:   { color:'#1DA1F2', bg:'bg-cyan-500/15',  text:'text-cyan-400',  border:'border-cyan-500/30'  },
  WhatsApp:  { color:'#25D366', bg:'bg-emerald-500/15',text:'text-emerald-400',border:'border-emerald-500/30'},
};

const STATUS_CFG = {
  'Draft':            { bg:'bg-slate-500/15', text:'text-slate-400', dot:'bg-slate-400' },
  'Pending Approval': { bg:'bg-amber-500/15', text:'text-amber-400', dot:'bg-amber-400' },
  'Approved':         { bg:'bg-emerald-500/15',text:'text-emerald-400',dot:'bg-emerald-400' },
  'Rejected':         { bg:'bg-red-500/15',   text:'text-red-400',   dot:'bg-red-400'   },
  'Scheduled':        { bg:'bg-blue-500/15',  text:'text-blue-400',  dot:'bg-blue-400'  },
  'Published':        { bg:'bg-primary/15',   text:'text-primary-light',dot:'bg-primary' },
  'Failed':           { bg:'bg-red-700/15',   text:'text-red-300',   dot:'bg-red-700'   },
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarView({ posts, currentDate, onSelect }) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = i - first + 1;
    return (d < 1 || d > days) ? null : d;
  });

  const byDay = {};
  posts.forEach(p => {
    if (!p.scheduledAt) return;
    const d = new Date(p.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(p);
    }
  });

  const today = new Date();

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-black text-muted uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {cells.map((day, i) => {
          const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const cellPosts = day ? (byDay[day] || []) : [];
          return (
            <div key={i} className={`min-h-[80px] p-1 ${!day ? 'bg-surface-200/30' : 'hover:bg-surface-50/30 transition-colors'}`}>
              {day && (
                <>
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-black mb-1 ${isToday ? 'bg-primary text-white' : 'text-muted'}`}>{day}</span>
                  <div className="space-y-0.5">
                    {cellPosts.slice(0, 2).map(p => {
                      const cfg = PLATFORM_CFG[p.platforms?.[0]] || PLATFORM_CFG.Instagram;
                      return (
                        <button key={p._id} onClick={() => onSelect(p)}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] font-bold truncate ${cfg.bg} ${cfg.text} hover:opacity-80 transition-opacity`}>
                          {p.title}
                        </button>
                      );
                    })}
                    {cellPosts.length > 2 && (
                      <span className="text-[9px] text-muted font-bold px-1">+{cellPosts.length - 2} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostModal({ post, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const sCfg = STATUS_CFG[post.status] || STATUS_CFG.Draft;

  const action = async (act) => {
    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, comment }),
    });
    const data = await res.json();
    if (data.success) { onUpdate(data.post); onClose(); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface-100 border border-border w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${sCfg.bg} ${sCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />{post.status}
            </span>
            {post.platforms?.map(p => {
              const c = PLATFORM_CFG[p];
              return <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c?.bg} ${c?.text}`}>{p}</span>;
            })}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-surface-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h2 className="font-black text-slate-100 text-lg">{post.title}</h2>
          {post.mediaUrls?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.mediaUrls.slice(0,4).map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-200">
                  <img src={url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                </div>
              ))}
            </div>
          )}
          <div className="bg-surface-200 rounded-xl p-4">
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{post.caption || 'No caption'}</p>
            {post.hashtags?.length > 0 && (
              <p className="text-xs text-primary-light mt-2">{post.hashtags.map(h => `#${h}`).join(' ')}</p>
            )}
          </div>
          {post.scheduledAt && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Scheduled: {new Date(post.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
            </div>
          )}
          <div className="text-xs text-muted">By {post.createdBy} · {post.client && `Client: ${post.client}`}</div>

          {post.approvalHistory?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">History</p>
              <div className="space-y-2">
                {post.approvalHistory.map((h, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="font-bold text-slate-300">{h.by}</span>
                    <span className={`font-bold ${h.action==='approved'?'text-emerald-400':h.action==='rejected'?'text-red-400':'text-amber-400'}`}>{h.action}</span>
                    {h.comment && <span className="text-muted">— {h.comment}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {post.status === 'Pending Approval' && (
            <div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
                className="input text-sm resize-none" placeholder="Add a comment (optional)" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => action('approved')} disabled={loading}
                  className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm">
                  ✓ Approve
                </button>
                <button onClick={() => action('revision_requested')} disabled={loading}
                  className="flex-1 btn-ghost bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 py-2.5 text-sm">
                  ↩ Request Revision
                </button>
                <button onClick={() => action('rejected')} disabled={loading}
                  className="flex-1 btn-danger py-2.5 text-sm">
                  ✕ Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialPage() {
  const [posts,       setPosts]       = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus,setFilterStatus]= useState('');
  const [filterPlat,  setFilterPlat]  = useState('');
  const [selected,    setSelected]    = useState(null);
  const [user,        setUser]        = useState(null);

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => { if (d.success) setUser(d.user); });
  }, []);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterPlat)   params.set('platform', filterPlat);
    const ym = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`;
    if (view === 'calendar') params.set('month', ym);
    const r = await fetch(`/api/posts?${params}`);
    const d = await r.json();
    if (d.success) { setPosts(d.posts); setStats(d.stats); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, filterPlat, view, currentDate]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-100">Content Calendar</h1>
          <p className="text-sm text-muted mt-0.5">Plan, schedule and approve social media content</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/social/create"
            className="btn-primary text-sm px-4 py-2.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            New Post
          </a>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label:'Total',     value:stats.total,     color:'text-slate-100'  },
            { label:'Draft',     value:stats.draft,     color:'text-slate-400'  },
            { label:'Pending',   value:stats.pending,   color:'text-amber-400'  },
            { label:'Approved',  value:stats.approved,  color:'text-emerald-400'},
            { label:'Published', value:stats.published, color:'text-primary-light'},
            { label:'Rejected',  value:stats.rejected,  color:'text-red-400'   },
          ].map(s => (
            <div key={s.label} className="card px-3 py-2.5 text-center">
              <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        <div className="flex bg-surface-200 rounded-xl p-1 gap-1">
          {['calendar','list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${view===v?'bg-primary text-white':'text-muted hover:text-slate-300'}`}>
              {v === 'calendar' ? '📅 Calendar' : '☰ List'}
            </button>
          ))}
        </div>

        {view === 'calendar' && (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-surface-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-sm font-black text-slate-200 min-w-[120px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-surface-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-surface-200 border border-border text-sm text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filterPlat} onChange={e => setFilterPlat(e.target.value)}
          className="bg-surface-200 border border-border text-sm text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-7 gap-px">
          {Array(21).fill(0).map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      ) : view === 'calendar' ? (
        <CalendarView posts={posts} currentDate={currentDate} onSelect={setSelected} />
      ) : (
        <div className="space-y-2">
          {posts.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-black text-slate-300">No posts found</p>
              <p className="text-sm text-muted mt-1 mb-4">Create your first social media post</p>
              <a href="/social/create" className="btn-primary text-sm">+ New Post</a>
            </div>
          ) : posts.map(post => {
            const sCfg = STATUS_CFG[post.status] || STATUS_CFG.Draft;
            return (
              <div key={post._id}
                className="card px-4 py-3.5 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelected(post)}>
                <div className="flex gap-1 shrink-0">
                  {post.platforms?.slice(0,3).map(p => {
                    const c = PLATFORM_CFG[p];
                    return (
                      <span key={p} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${c?.bg} ${c?.text}`}>
                        {p[0]}
                      </span>
                    );
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-200 text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted truncate">{post.caption}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${sCfg.bg} ${sCfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />{post.status}
                  </span>
                  {post.scheduledAt && (
                    <span className="text-[10px] text-muted hidden sm:block">
                      {new Date(post.scheduledAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <PostModal post={selected} onClose={() => setSelected(null)}
          onUpdate={p => setPosts(prev => prev.map(x => x._id === p._id ? p : x))} />
      )}
    </div>
  );
}
