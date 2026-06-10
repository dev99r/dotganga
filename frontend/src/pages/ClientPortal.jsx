import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  format, parseISO, isToday, isTomorrow, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isThisMonth, isBefore,
  startOfDay, addDays,
} from 'date-fns';

// ─── constants ────────────────────────────────────────────────────────────────

const CAT = {
  Reel:          { emoji:'🎬', label:'Reel',         grad:'from-violet-500 to-purple-600', bg:'bg-violet-100',  text:'text-violet-700',  border:'border-violet-200', badge:'bg-violet-600',  dot:'bg-violet-500'  },
  Carousel:      { emoji:'🖼️', label:'Carousel',     grad:'from-blue-500 to-cyan-600',     bg:'bg-blue-100',    text:'text-blue-700',    border:'border-blue-200',   badge:'bg-blue-600',    dot:'bg-blue-500'    },
  Story:         { emoji:'📱', label:'Story',         grad:'from-pink-500 to-rose-600',     bg:'bg-pink-100',    text:'text-pink-700',    border:'border-pink-200',   badge:'bg-pink-600',    dot:'bg-pink-500'    },
  Organic:       { emoji:'🌿', label:'Organic Post',  grad:'from-emerald-500 to-teal-600',  bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-200',badge:'bg-emerald-600', dot:'bg-emerald-500' },
  'Ad Creative': { emoji:'🎯', label:'Ad Creative',   grad:'from-orange-500 to-amber-600',  bg:'bg-amber-100',   text:'text-amber-700',   border:'border-amber-200',  badge:'bg-amber-500',   dot:'bg-amber-500'   },
};
const getCat = k => CAT[k] || { emoji:'📋', label:k, grad:'from-slate-400 to-slate-600', bg:'bg-slate-100', text:'text-slate-700', border:'border-slate-200', badge:'bg-slate-500', dot:'bg-slate-400' };

const PLATFORM_ICONS = {
  Instagram:'📸', Facebook:'👍', LinkedIn:'💼', Twitter:'🐦', YouTube:'▶️', WhatsApp:'💬',
};

const fd  = iso => { try { return format(parseISO(iso), 'dd MMM'); }          catch { return '—'; } };
const fdt = iso => { try { return format(parseISO(iso), 'dd MMM · hh:mm a'); } catch { return '—'; } };
const ft  = iso => { try { return format(parseISO(iso), 'hh:mm a'); }          catch { return ''; } };

// ─── ApprovalCard ──────────────────────────────────────────────────────────────

function ApprovalCard({ post, idx, total, onApprove, onRevise, onReject }) {
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const cat = getCat(post.category);

  const act = async fn => {
    setSubmitting(true);
    try { await fn(); } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {/* gradient top */}
      <div className={`bg-gradient-to-r ${cat.grad} px-6 py-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <p className="text-white font-black text-lg leading-tight">{cat.label}</p>
                <p className="text-white/70 text-xs">{fdt(post.scheduledDate)}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {post.platforms?.map(p => (
                <span key={p} className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {PLATFORM_ICONS[p]} {p}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white/60 text-xs font-bold">{idx + 1} of {total}</p>
            <span className="text-xs font-black bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full mt-1 inline-block">
              Needs Your OK
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* caption */}
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">Caption</p>
          <p className={`text-sm text-slate-800 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
            {post.caption}
          </p>
          {post.caption?.length > 200 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 font-bold mt-1 hover:underline">
              {expanded ? 'Show less ↑' : 'Read full caption ↓'}
            </button>
          )}
        </div>

        {post.hashtags && (
          <p className="text-xs text-blue-500 leading-relaxed font-medium">{post.hashtags}</p>
        )}

        {/* note input */}
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">Feedback (optional)</p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Any changes or comments for the team…"
            rows={3}
            className="w-full text-sm border-2 border-slate-100 hover:border-slate-200 focus:border-blue-400 rounded-2xl px-4 py-3 resize-none focus:outline-none transition-colors bg-slate-50 placeholder-slate-300" />
        </div>

        {/* action buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button disabled={submitting} onClick={() => act(() => onApprove(post._id, note))}
            className="py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅'} Approve
          </button>
          <button disabled={submitting} onClick={() => act(() => onRevise(post._id, note))}
            className="py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
            ✏️ Revise
          </button>
          <button disabled={submitting} onClick={() => act(() => onReject(post._id, note))}
            className="py-3.5 bg-slate-100 hover:bg-red-50 active:scale-95 text-slate-600 hover:text-red-600 font-black text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
            ❌ Decline
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({ category, posts, target }) {
  const cat    = getCat(category);
  const done   = posts.filter(p => p.status === 'Posted').length;
  const ready  = posts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length;
  const pend   = posts.filter(p => p.approvalStatus === 'Pending').length;
  const pct    = target ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const radius = 20;
  const circ   = 2 * Math.PI * radius;

  return (
    <div className={`bg-white rounded-2xl border-2 ${cat.border} shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] p-4 flex flex-col gap-3`}>
      {/* top */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cat.emoji}</span>
          <div>
            <p className={`font-black text-sm ${cat.text}`}>{cat.label}</p>
            <p className="text-[10px] text-slate-400 font-bold">{done}/{target} published</p>
          </div>
        </div>
        {/* mini ring */}
        <svg width="48" height="48" className="-rotate-90">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
          <circle cx="24" cy="24" r={radius} fill="none" stroke={pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b'}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`} />
          <text x="24" y="-16" className="rotate-90" textAnchor="middle" fontSize="10" fontWeight="900"
            fill={pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b'}>
          </text>
        </svg>
      </div>

      {/* progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-400 font-bold">{pct}% complete</span>
          {pend > 0 && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 rounded-full">⏳ {pend} review</span>}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
          <div className={`h-full ${cat.badge} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
          {ready > 0 && target > 0 && (
            <div className="h-full bg-blue-300 rounded-full transition-all" style={{ width: `${Math.min(100 - pct, (ready/target)*100)}%` }} />
          )}
        </div>
      </div>

      {/* status chips */}
      <div className="flex gap-1.5 flex-wrap">
        {done > 0  && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ {done} live</span>}
        {ready > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📅 {ready} ready</span>}
        {pend > 0  && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏳ {pend} review</span>}
        {done === 0 && ready === 0 && pend === 0 && <span className="text-[10px] text-slate-300 font-bold">In progress</span>}
      </div>
    </div>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────

function CalendarView({ posts }) {
  const [selDay,   setSelDay]   = useState(null);
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

  const selPosts = selDay ? (postsByDay[format(selDay, 'yyyy-MM-dd')] || []) : [];

  return (
    <div className="space-y-4">
      {/* calendar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base">{format(today, 'MMMM yyyy')}</h3>
          <div className="flex gap-3 text-xs">
            {[['bg-emerald-500','Published'],['bg-blue-400','Scheduled'],['bg-amber-400','Review']].map(([bg, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${bg}`} />
                <span className="text-slate-400 font-bold">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
            {days.map(day => {
              const key    = format(day, 'yyyy-MM-dd');
              const dPosts = postsByDay[key] || [];
              const isSel  = selDay && isSameDay(day, selDay);
              const isT    = isToday(day);
              const isPast = isBefore(day, startOfDay(today));

              return (
                <button key={key}
                  onClick={() => setSelDay(isSameDay(day, selDay) ? null : day)}
                  className={`relative flex flex-col items-center rounded-2xl py-2 px-0.5 transition-all min-h-[52px] ${
                    isSel ? 'bg-blue-600 shadow-lg shadow-blue-200 ring-2 ring-blue-400' :
                    isT   ? 'bg-blue-950' :
                    dPosts.length > 0 ? 'bg-slate-50 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 cursor-pointer' :
                    isPast ? 'opacity-40 cursor-default' : 'cursor-default'
                  }`}>
                  <span className={`text-xs font-black ${isSel || isT ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </span>
                  {dPosts.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[32px]">
                      {dPosts.slice(0, 3).map((p, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'Posted'          ? 'bg-emerald-500' :
                          p.approvalStatus === 'Pending' ? 'bg-amber-400'   : 'bg-blue-400'
                        }`} />
                      ))}
                      {dPosts.length > 3 && <span className="text-[8px] text-slate-400 font-bold">+{dPosts.length-3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* day detail */}
      {selDay && (
        <div className="bg-white rounded-3xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-black text-lg">{format(selDay, 'EEEE')}</p>
              <p className="text-blue-200 text-sm">{format(selDay, 'MMMM d, yyyy')} · {selPosts.length} post{selPosts.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setSelDay(null)}
              className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 font-black">✕</button>
          </div>
          <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
            {selPosts.map(p => {
              const cat = getCat(p.category);
              return (
                <div key={p._id} className={`flex items-start gap-3 p-3.5 rounded-2xl ${cat.bg} border ${cat.border}`}>
                  <span className="text-xl shrink-0">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-black ${cat.text}`}>{cat.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        p.status === 'Posted'           ? 'bg-emerald-100 text-emerald-700' :
                        p.approvalStatus === 'Pending'  ? 'bg-amber-100 text-amber-700'    :
                                                          'bg-blue-100 text-blue-700'
                      }`}>
                        {p.status === 'Posted' ? '✅ Live' : p.approvalStatus === 'Pending' ? '⏳ Review' : '📅 Approved'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{p.caption}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.platforms?.slice(0,3).map(pl => <span key={pl} className="text-xs text-slate-400">{PLATFORM_ICONS[pl]}</span>)}
                      <span className="ml-auto text-[10px] text-slate-400 font-bold">{ft(p.scheduledDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* upcoming list */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-blue-600 rounded-full" /> Upcoming This Month
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {posts
            .filter(p => { try { return parseISO(p.scheduledDate) >= new Date(); } catch { return false; } })
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
            .slice(0, 12)
            .map(p => {
              const cat = getCat(p.category);
              return (
                <div key={p._id} className={`flex items-center gap-3 p-2.5 rounded-xl ${cat.bg} border ${cat.border}`}>
                  <span className="text-sm shrink-0">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black ${cat.text}`}>{cat.label}</p>
                    <p className="text-xs text-slate-600 line-clamp-1">{p.caption?.slice(0, 50)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-700">{fd(p.scheduledDate)}</p>
                    <p className="text-[10px] text-slate-400">{ft(p.scheduledDate)}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── MonthlyReport ────────────────────────────────────────────────────────────

function MonthlyReport({ client, posts, byCategory }) {
  const targets     = client?.contentTargets || { Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 };
  const totalTarget = Object.values(targets).reduce((a,b) => a+b, 0);
  const totalPosted = posts.filter(p => p.status === 'Posted').length;
  const overallPct  = totalTarget ? Math.round((totalPosted / totalTarget) * 100) : 0;
  const circ        = 2 * Math.PI * 38;

  return (
    <div className="space-y-5">
      {/* hero card */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-violet-900 rounded-3xl p-6 text-white overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">Monthly Report</p>
            <h2 className="text-2xl font-black">{format(new Date(), 'MMMM yyyy')}</h2>
            <p className="text-blue-200 text-sm mt-1">{client?.businessName}</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { l:'Published', v:totalPosted,   c:'text-emerald-400' },
                { l:'Scheduled', v:posts.filter(p=>p.approvalStatus==='Approved'&&p.status!=='Posted').length, c:'text-blue-300' },
                { l:'In Review', v:posts.filter(p=>p.approvalStatus==='Pending').length, c:'text-amber-400' },
              ].map(s => (
                <div key={s.l}>
                  <p className={`text-3xl font-black ${s.c}`}>{s.v}</p>
                  <p className="text-blue-200/70 text-xs font-bold mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* big ring */}
          <div className="shrink-0 flex flex-col items-center">
            <svg width="100" height="100" className="-rotate-90">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
              <circle cx="50" cy="50" r="38" fill="none" stroke={overallPct >= 80 ? '#34d399' : overallPct >= 50 ? '#60a5fa' : '#fbbf24'}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${(overallPct / 100) * circ} ${circ}`} />
            </svg>
            <div className="absolute" style={{ marginTop: '26px' }}>
              <p className="text-white font-black text-xl text-center">{overallPct}%</p>
              <p className="text-blue-200 text-[10px] font-bold text-center">Done</p>
            </div>
            <p className="text-blue-200 text-xs font-bold mt-1">{totalPosted}/{totalTarget} posts</p>
          </div>
        </div>
      </div>

      {/* category breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <span>📊</span> Content Breakdown
        </h3>
        <div className="space-y-4">
          {Object.entries(targets).map(([cat, target]) => {
            const c      = getCat(cat);
            const cPosts = byCategory[cat] || [];
            const done   = cPosts.filter(p => p.status === 'Posted').length;
            const ready  = cPosts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length;
            const pend   = cPosts.filter(p => p.approvalStatus === 'Pending').length;
            const pct    = target ? Math.min(100, Math.round((done / target) * 100)) : 0;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.emoji}</span>
                    <span className={`font-black text-sm ${c.text}`}>{c.label}s</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-600 font-bold">{done} live</span>
                    {ready > 0 && <span className="text-blue-600 font-bold">{ready} ready</span>}
                    {pend > 0  && <span className="text-amber-600 font-bold">{pend} review</span>}
                    <span className="text-slate-400 font-bold">{done}/{target}</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0">
                  <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${target ? (done/target)*100 : 0}%` }} />
                  <div className="h-full bg-blue-300 transition-all"   style={{ width: `${target ? Math.min(100-(done/target)*100, (ready/target)*100) : 0}%` }} />
                  <div className="h-full bg-amber-300 transition-all"  style={{ width: `${target ? Math.min(100-((done+ready)/target)*100, (pend/target)*100) : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 text-xs flex-wrap">
          {[['bg-emerald-500','Published'],['bg-blue-300','Approved/Ready'],['bg-amber-300','In Review']].map(([bg, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${bg}`} />
              <span className="text-slate-500 font-bold">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* published gallery */}
      {posts.filter(p => p.status === 'Posted').length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <span>🏆</span> Published This Month
            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full ml-auto">
              {posts.filter(p => p.status === 'Posted').length} posts
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {posts.filter(p => p.status === 'Posted')
              .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
              .map(p => {
                const cat = getCat(p.category);
                return (
                  <div key={p._id} className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 ${cat.border} bg-white`}>
                    <div className={`w-10 h-10 ${cat.badge} rounded-xl flex items-center justify-center text-white text-lg shrink-0`}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-black ${cat.text}`}>{cat.label}</span>
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full ml-auto">✅ Live</span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{p.caption?.slice(0, 80)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {p.platforms?.slice(0,3).map(pl => <span key={pl} className="text-xs text-slate-400">{PLATFORM_ICONS[pl]}</span>)}
                        <span className="ml-auto text-[10px] text-slate-400 font-bold">{fd(p.scheduledDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* services */}
      {(client?.services?.length > 0 || client?.primaryPlatforms?.length > 0) && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-3 text-sm">Your Service Package</h3>
          {client.services?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {client.services.map(s => (
                <span key={s} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
          {client.primaryPlatforms?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {client.primaryPlatforms.map(p => (
                <span key={p} className="flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-full">
                  {PLATFORM_ICONS[p]} {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main portal ──────────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [client,  setClient]  = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');
  const [approveIdx, setApproveIdx] = useState(0);

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
    await api.patch(`/posts/${id}/approve`, { status: 'Revision', note });
    toast.success('Revision requested ✏️');
    fetchData();
  };
  const handleReject = async (id, note) => {
    await api.patch(`/posts/${id}/approve`, { status: 'Rejected', note });
    toast.success('Declined.');
    fetchData();
  };

  const pendingPosts   = useMemo(() => posts.filter(p => p.approvalStatus === 'Pending'), [posts]);
  const monthPosts     = useMemo(() => posts.filter(p => { try { return isThisMonth(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);
  const todayPosts     = useMemo(() => posts.filter(p => { try { return isToday(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);
  const tomorrowPosts  = useMemo(() => posts.filter(p => { try { return isTomorrow(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);
  const targets        = client?.contentTargets || { Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 };
  const totalTarget    = Object.values(targets).reduce((a,b) => a+b, 0);
  const totalPosted    = monthPosts.filter(p => p.status === 'Posted').length;
  const overallPct     = totalTarget ? Math.min(100, Math.round((totalPosted / totalTarget) * 100)) : 0;
  const circ           = 2 * Math.PI * 28;

  const byCategory = useMemo(() => {
    const map = {};
    monthPosts.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [monthPosts]);

  const TABS = [
    { id:'overview', label:'Overview', icon:'🏠', badge:0 },
    { id:'review',   label:'Review',   icon:'✅', badge:pendingPosts.length },
    { id:'calendar', label:'Calendar', icon:'📅', badge:0 },
    { id:'report',   label:'Report',   icon:'📊', badge:0 },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-violet-950">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-blue-300 font-bold text-sm">Loading your portal…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-blue-950/95 backdrop-blur-xl shadow-2xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3.5 gap-3">
            {/* brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-lg">
                <img src="/logo.png" alt="DotGanga" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-black text-sm truncate max-w-[160px] sm:max-w-none">
                  {client?.businessName || user?.name}
                </p>
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingPosts.length > 0 && (
                <button onClick={() => { setTab('review'); setApproveIdx(0); }}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-3 py-1.5 rounded-full transition-colors animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  {pendingPosts.length} Need Review
                </button>
              )}
              <span className="hidden sm:flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                📅 {format(new Date(), 'dd MMM')}
              </span>
              <button onClick={logout}
                className="text-blue-400 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all">
                Sign Out
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="flex border-t border-white/10 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setApproveIdx(0); }}
                className={`flex items-center gap-1.5 px-4 sm:px-6 py-3 text-sm font-black whitespace-nowrap border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-400 hover:text-blue-200'
                }`}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                {t.badge > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-violet-900">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            {/* client avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-xl backdrop-blur-sm">
                {(client?.businessName || user?.name || 'C')[0]}
              </div>
              <div>
                <h1 className="text-white font-black text-xl leading-tight">{client?.businessName || user?.name}</h1>
                <p className="text-blue-200 text-xs">{client?.industry || 'Social Media Client'}</p>
              </div>
            </div>
            {/* platforms */}
            <div className="flex flex-wrap gap-2">
              {client?.primaryPlatforms?.map(p => (
                <span key={p} className="flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                  {PLATFORM_ICONS[p]} {p}
                </span>
              ))}
              {todayPosts.length > 0 && (
                <span className="flex items-center gap-1 bg-emerald-500/80 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                  🔴 {todayPosts.length} post{todayPosts.length!==1?'s':''} today
                </span>
              )}
            </div>
          </div>

          {/* stats */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {[
              { l:'Published', v:totalPosted,          c:'text-emerald-400' },
              { l:'Scheduled', v:monthPosts.filter(p=>p.approvalStatus==='Approved'&&p.status!=='Posted').length, c:'text-blue-300' },
              { l:'Pending',   v:pendingPosts.length,  c:'text-amber-400'   },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className={`text-2xl sm:text-3xl font-black ${s.c}`}>{s.v}</p>
                <p className="text-[11px] text-blue-300/80 font-bold">{s.l}</p>
              </div>
            ))}

            {/* progress ring */}
            <div className="hidden sm:flex flex-col items-center bg-white/10 rounded-2xl px-4 py-3 border border-white/10 relative">
              <svg width="72" height="72" className="-rotate-90">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle cx="36" cy="36" r="28" fill="none"
                  stroke={overallPct >= 80 ? '#34d399' : overallPct >= 50 ? '#60a5fa' : '#fbbf24'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(overallPct/100)*circ} ${circ}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-black text-base">{overallPct}%</span>
              </div>
              <p className="text-[10px] text-blue-300 font-bold mt-1">Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === 'overview' && (
          <div className="space-y-5">

            {/* pending alert */}
            {pendingPosts.length > 0 && (
              <button onClick={() => setTab('review')}
                className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 text-left hover:shadow-md transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0 animate-pulse">
                  ⏳
                </div>
                <div className="flex-1">
                  <p className="font-black text-amber-800">
                    {pendingPosts.length} post{pendingPosts.length!==1?'s':''} need your approval
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">Tap to review and approve content before it goes live</p>
                </div>
                <span className="text-amber-500 font-black text-lg">→</span>
              </button>
            )}

            {/* today/tomorrow banner */}
            {(todayPosts.length > 0 || tomorrowPosts.length > 0) && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">📅</span>
                  <div>
                    <p className="font-black text-slate-800 text-sm">Content This Week</p>
                    <p className="text-slate-500 text-xs">Posts going live very soon</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {todayPosts.map(p => {
                    const c = getCat(p.category);
                    return (
                      <span key={p._id} className={`flex items-center gap-1.5 ${c.bg} ${c.text} text-xs font-bold px-3 py-1.5 rounded-full border ${c.border}`}>
                        {c.emoji} <strong>Today</strong> · {ft(p.scheduledDate)}
                        {p.approvalStatus === 'Pending' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                      </span>
                    );
                  })}
                  {tomorrowPosts.map(p => {
                    const c = getCat(p.category);
                    return (
                      <span key={p._id} className={`flex items-center gap-1.5 bg-white/80 ${c.text} text-xs font-bold px-3 py-1.5 rounded-full border ${c.border}`}>
                        {c.emoji} Tomorrow · {ft(p.scheduledDate)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* category cards */}
            <div>
              <h2 className="font-black text-slate-900 text-base mb-3 flex items-center gap-2">
                <span>📈</span> This Month's Content Plan
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(targets).map(([cat, target]) => (
                  <CategoryCard key={cat} category={cat} posts={byCategory[cat] || []} target={target} />
                ))}
              </div>
            </div>

            {/* recent published */}
            {monthPosts.filter(p => p.status === 'Posted').length > 0 && (
              <div>
                <h2 className="font-black text-slate-900 text-base mb-3 flex items-center gap-2">
                  <span>✅</span> Recently Published
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthPosts.filter(p => p.status === 'Posted')
                    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
                    .slice(0, 6)
                    .map(p => {
                      const cat = getCat(p.category);
                      return (
                        <div key={p._id} className={`bg-white rounded-2xl border-2 ${cat.border} p-4 hover:shadow-md transition-shadow`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{cat.emoji}</span>
                            <span className={`font-black text-sm ${cat.text}`}>{cat.label}</span>
                            <span className="ml-auto text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Live</span>
                          </div>
                          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed mb-2">{p.caption}</p>
                          <div className="flex items-center gap-2">
                            {p.platforms?.slice(0,3).map(pl => <span key={pl} className="text-xs text-slate-400">{PLATFORM_ICONS[pl]}</span>)}
                            <span className="ml-auto text-xs text-slate-400 font-bold">{fd(p.scheduledDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ REVIEW TAB ═══ */}
        {tab === 'review' && (
          <div>
            {pendingPosts.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-7xl mb-4">🎉</div>
                <h3 className="font-black text-slate-800 text-2xl mb-2">All caught up!</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">No content needs your review right now. We'll notify you when new posts are ready.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                {/* progress strip */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg">Content Approval</h2>
                    <p className="text-slate-400 text-sm">{pendingPosts.length} post{pendingPosts.length!==1?'s':''} waiting for your OK</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={approveIdx === 0} onClick={() => setApproveIdx(i => i - 1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 disabled:opacity-30 transition-all">
                      ‹
                    </button>
                    <span className="text-sm font-black text-slate-600 min-w-[60px] text-center">
                      {approveIdx + 1} / {pendingPosts.length}
                    </span>
                    <button disabled={approveIdx >= pendingPosts.length - 1} onClick={() => setApproveIdx(i => i + 1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 disabled:opacity-30 transition-all">
                      ›
                    </button>
                  </div>
                </div>

                {/* dots navigation */}
                <div className="flex justify-center gap-1.5 mb-5">
                  {pendingPosts.map((_, i) => (
                    <button key={i} onClick={() => setApproveIdx(i)}
                      className={`rounded-full transition-all ${i === approveIdx ? 'w-6 h-2.5 bg-blue-600' : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'}`} />
                  ))}
                </div>

                <ApprovalCard
                  key={pendingPosts[approveIdx]?._id}
                  post={pendingPosts[approveIdx]}
                  idx={approveIdx}
                  total={pendingPosts.length}
                  onApprove={async (id, note) => { await handleApprove(id, note); if (approveIdx >= pendingPosts.length - 1) setApproveIdx(0); }}
                  onRevise={async (id, note) => { await handleRevise(id, note); if (approveIdx >= pendingPosts.length - 1) setApproveIdx(0); }}
                  onReject={async (id, note) => { await handleReject(id, note); if (approveIdx >= pendingPosts.length - 1) setApproveIdx(0); }}
                />
              </div>
            )}

            {/* approved section below */}
            {monthPosts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').length > 0 && (
              <div className="mt-10 max-w-2xl mx-auto">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                  <span>📅</span> Approved & Scheduled
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {monthPosts.filter(p => p.approvalStatus === 'Approved' && p.status !== 'Posted').map(p => {
                    const cat = getCat(p.category);
                    return (
                      <div key={p._id} className={`bg-white rounded-2xl border-2 border-blue-200 p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{cat.emoji}</span>
                          <span className={`font-black text-sm ${cat.text}`}>{cat.label}</span>
                          <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📅 Ready</span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2">{p.caption}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1.5">{fdt(p.scheduledDate)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALENDAR TAB ═══ */}
        {tab === 'calendar' && <CalendarView posts={monthPosts} />}

        {/* ═══ REPORT TAB ═══ */}
        {tab === 'report' && <MonthlyReport client={client} posts={monthPosts} byCategory={byCategory} />}

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center">
        <p className="text-xs text-slate-400">
          Powered by <span className="font-black text-blue-700">DotGanga</span> · Jodhpur, Rajasthan
          <span className="mx-2">·</span>
          <a href="https://wa.me/917891234567" target="_blank" rel="noopener noreferrer"
            className="text-green-600 font-bold hover:underline">💬 WhatsApp Support</a>
        </p>
      </footer>
    </div>
  );
}
