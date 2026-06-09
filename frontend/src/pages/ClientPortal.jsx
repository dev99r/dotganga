import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isSameMonth, addMonths, subMonths, isThisMonth,
} from 'date-fns';

// ─── Config ───────────────────────────────────────────────────────────────────
const CAT = {
  Reel:         { icon:'🎬', label:'Reel',         grad:'from-pink-500 to-rose-600',    dot:'bg-pink-500',    light:'bg-pink-50 text-pink-700',      border:'border-pink-200'    },
  Carousel:     { icon:'🎠', label:'Carousel',     grad:'from-violet-500 to-purple-600',dot:'bg-violet-500',  light:'bg-violet-50 text-violet-700',  border:'border-violet-200'  },
  Story:        { icon:'📱', label:'Story',        grad:'from-blue-500 to-cyan-600',    dot:'bg-blue-500',    light:'bg-blue-50 text-blue-700',      border:'border-blue-200'    },
  Organic:      { icon:'📸', label:'Organic',      grad:'from-emerald-500 to-teal-600', dot:'bg-emerald-500', light:'bg-emerald-50 text-emerald-700',border:'border-emerald-200' },
  'Ad Creative':{ icon:'🎯', label:'Ad Creative',  grad:'from-orange-500 to-red-600',   dot:'bg-orange-500',  light:'bg-orange-50 text-orange-700',  border:'border-orange-200'  },
  Other:        { icon:'📋', label:'Other',        grad:'from-slate-400 to-slate-600',  dot:'bg-slate-400',   light:'bg-slate-100 text-slate-600',   border:'border-slate-200'   },
};
const getCat = k => CAT[k] || CAT.Other;

const PLATFORM_ICONS = { Instagram:'📸', Facebook:'📘', LinkedIn:'💼', Twitter:'🐦', YouTube:'▶️', WhatsApp:'💬' };

const AP = {
  Pending:  { bg:'bg-amber-50',   ring:'ring-amber-200',   text:'text-amber-700',   badge:'bg-amber-100 text-amber-800',    bar:'bg-amber-400',    icon:'⏳', title:'Waiting for Your Review' },
  Approved: { bg:'bg-emerald-50', ring:'ring-emerald-200', text:'text-emerald-700', badge:'bg-emerald-100 text-emerald-800',bar:'bg-emerald-500',  icon:'✅', title:'Approved by You'         },
  Rejected: { bg:'bg-red-50',     ring:'ring-red-200',     text:'text-red-700',     badge:'bg-red-100 text-red-800',        bar:'bg-red-500',      icon:'❌', title:'Rejected'               },
  Revision: { bg:'bg-violet-50',  ring:'ring-violet-200',  text:'text-violet-700',  badge:'bg-violet-100 text-violet-800',  bar:'bg-violet-500',   icon:'✏️', title:'Changes Requested'      },
};
const getAP = k => AP[k] || AP.Pending;

// ─── Post Approval Card ───────────────────────────────────────────────────────
function ApprovalCard({ post, onRefresh }) {
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [showNote,setShowNote]= useState(false);
  const [expanded,setExpanded]= useState(false);
  const c  = getCat(post.category);
  const ap = getAP(post.approvalStatus);

  const act = async (status) => {
    setLoading(true);
    try {
      await api.patch(`/posts/${post._id}/approve`, { status, note });
      toast.success(status === 'Approved' ? '✅ Post Approved!' : status === 'Rejected' ? '❌ Post Rejected' : '✏️ Revision Requested');
      setNote(''); setShowNote(false);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm border-2 ${post.approvalStatus === 'Pending' ? 'border-amber-200' : 'border-slate-100'}`}>
      {/* Category color stripe */}
      <div className={`h-2 bg-gradient-to-r ${c.grad}`}/>

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
              {c.icon}
            </div>
            <div>
              <p className="font-black text-slate-900 text-base">{c.label}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {post.scheduledDate ? format(new Date(post.scheduledDate), 'dd MMM yyyy · HH:mm') : 'Not scheduled'}
              </p>
            </div>
          </div>
          <span className={`text-sm font-black px-3 py-1.5 rounded-full shrink-0 ${ap.badge}`}>
            {ap.icon} {post.approvalStatus}
          </span>
        </div>

        {/* Media */}
        {post.mediaUrls?.length > 0 && (
          <div className="mb-5 rounded-2xl overflow-hidden">
            {post.mediaUrls.length === 1 ? (
              <img src={post.mediaUrls[0]} alt="" className="w-full aspect-video object-cover bg-slate-100"/>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {post.mediaUrls.slice(0, 4).map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-full aspect-square object-cover bg-slate-100"/>
                    {i === 3 && post.mediaUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xl">+{post.mediaUrls.length - 4}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-5">
            <p className={`text-base text-slate-700 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
              {post.caption}
            </p>
            {post.caption.length > 200 && (
              <button onClick={() => setExpanded(!expanded)} className="text-sm text-blue-600 font-bold mt-2 hover:text-blue-800">
                {expanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
            {post.hashtags && <p className="text-sm text-blue-400 mt-2 font-medium">{post.hashtags}</p>}
          </div>
        )}

        {/* Platforms */}
        {post.platforms?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {post.platforms.map(p => (
              <div key={p} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                <span className="text-base">{PLATFORM_ICONS[p]}</span>
                <span className="text-sm font-bold text-slate-600">{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* Previous note from team */}
        {post.approvalNote && post.approvalStatus !== 'Pending' && (
          <div className={`rounded-2xl px-4 py-3 mb-5 border ${
            post.approvalStatus === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-violet-50 border-violet-100 text-violet-700'
          }`}>
            <p className="text-xs font-black uppercase tracking-wide mb-1">Your Note</p>
            <p className="text-sm italic">"{post.approvalNote}"</p>
          </div>
        )}

        {/* Action area — only for pending */}
        {post.approvalStatus === 'Pending' && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <p className="text-sm font-black text-slate-700">What would you like to do with this post?</p>

            {showNote && (
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Tell the team what to change (optional)…"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"/>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => act('Approved')} disabled={loading}
                className="py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-black transition-all disabled:opacity-50 shadow-sm active:scale-95">
                ✓ Approve
              </button>
              <button onClick={() => setShowNote(!showNote)} disabled={loading}
                className={`py-3 rounded-2xl text-sm font-black transition-all disabled:opacity-50 active:scale-95 ${showNote ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                ✏️ Revise
              </button>
              <button onClick={() => act('Rejected')} disabled={loading}
                className="py-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-black transition-all disabled:opacity-50 shadow-sm active:scale-95">
                ✕ Reject
              </button>
            </div>
            {showNote && note.trim() && (
              <button onClick={() => act('Revision')} disabled={loading}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black transition-all active:scale-95">
                Send Revision Request →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Daily Report Feed ────────────────────────────────────────────────────────
function DailyReport({ posts }) {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const todayPosts     = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), today));
  const yesterdayPosts = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), yesterday));
  const tomorrowPosts  = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), tomorrow));

  const DaySection = ({ label, dayPosts, highlight }) => {
    if (dayPosts.length === 0 && !highlight) return null;
    return (
      <div className={`bg-white rounded-3xl border ${highlight ? 'border-blue-200 shadow-md' : 'border-slate-100 shadow-sm'} overflow-hidden`}>
        <div className={`px-6 py-4 ${highlight ? 'bg-gradient-to-r from-blue-950 to-blue-900' : 'bg-slate-50'} flex items-center justify-between`}>
          <div>
            <p className={`font-black text-base ${highlight ? 'text-white' : 'text-slate-700'}`}>{label}</p>
            <p className={`text-sm ${highlight ? 'text-blue-300' : 'text-slate-400'} mt-0.5`}>
              {dayPosts.length === 0 ? 'Nothing scheduled' : `${dayPosts.length} post${dayPosts.length > 1 ? 's' : ''}`}
            </p>
          </div>
          {dayPosts.length > 0 && (
            <span className={`text-sm font-black px-3 py-1.5 rounded-full ${highlight ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
              {dayPosts.length} posts
            </span>
          )}
        </div>

        {dayPosts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-slate-400 font-semibold">Nothing scheduled for this day</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dayPosts.map(post => {
              const c  = getCat(post.category);
              const ap = getAP(post.approvalStatus);
              return (
                <div key={post._id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-xl shrink-0`}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-sm font-black px-2.5 py-0.5 rounded-full ${c.light}`}>{c.icon} {post.category}</span>
                      <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${ap.badge}`}>{ap.icon} {post.approvalStatus}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{post.caption || '(no caption)'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {post.platforms?.map(p => <span key={p} className="text-base">{PLATFORM_ICONS[p]}</span>)}
                      {post.scheduledDate && <span className="text-xs text-slate-400 font-semibold">📅 {format(new Date(post.scheduledDate), 'HH:mm')}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <DaySection label={`Today — ${format(today, 'EEEE, dd MMMM')}`} dayPosts={todayPosts} highlight />
      <DaySection label={`Tomorrow — ${format(tomorrow, 'EEEE, dd MMMM')}`} dayPosts={tomorrowPosts} highlight={false}/>
      <DaySection label={`Yesterday — ${format(yesterday, 'dd MMMM')}`} dayPosts={yesterdayPosts} highlight={false}/>
    </div>
  );
}

// ─── Content Calendar ─────────────────────────────────────────────────────────
function ContentCalendar({ posts }) {
  const [month, setMonth] = useState(new Date());

  const calDays = useMemo(() => {
    const start    = startOfMonth(month);
    const end      = endOfMonth(month);
    const days     = eachDayOfInterval({ start, end });
    const leading  = start.getDay();
    const trailing = 6 - end.getDay();
    return [
      ...Array.from({ length: leading },  (_, i) => new Date(start.getFullYear(), start.getMonth(), -leading + i + 1)),
      ...days,
      ...Array.from({ length: trailing }, (_, i) => new Date(end.getFullYear(), end.getMonth() + 1, i + 1)),
    ];
  }, [month]);

  const [selectedDay, setSelectedDay] = useState(null);
  const selectedPosts = selectedDay ? posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), selectedDay)) : [];

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={() => setMonth(m => subMonths(m, 1))}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <p className="font-black text-slate-900 text-lg">{format(month, 'MMMM yyyy')}</p>
            <p className="text-sm text-slate-400 mt-0.5">{posts.filter(p => p.scheduledDate && isSameMonth(new Date(p.scheduledDate), month)).length} posts this month</p>
          </div>
          <div className="flex items-center gap-1">
            {!isSameMonth(month, new Date()) && (
              <button onClick={() => setMonth(new Date())} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors mr-1">Today</button>
            )}
            <button onClick={() => setMonth(m => addMonths(m, 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center py-3 text-xs font-black text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            const dayPosts = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), day));
            const inMonth  = isSameMonth(day, month);
            const isTd     = isToday(day);
            const isSel    = selectedDay && isSameDay(day, selectedDay);
            return (
              <div key={i} onClick={() => inMonth && setSelectedDay(s => s && isSameDay(s, day) ? null : day)}
                className={`border-r border-b border-slate-100 min-h-[64px] sm:min-h-[90px] p-1.5 cursor-pointer transition-colors ${
                  !inMonth ? 'bg-slate-50/50' : isSel ? 'bg-indigo-50' : isTd ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full ${
                    isTd ? 'bg-blue-950 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'
                  }`}>{format(day, 'd')}</span>
                  {dayPosts.length > 0 && inMonth && (
                    <span className="text-[10px] font-black text-slate-400">{dayPosts.length}</span>
                  )}
                </div>
                {/* Dots on mobile */}
                {dayPosts.length > 0 && inMonth && (
                  <div className="flex flex-wrap gap-0.5 sm:hidden mt-1">
                    {dayPosts.slice(0, 4).map(p => <div key={p._id} className={`w-2 h-2 rounded-full ${getCat(p.category).dot}`}/>)}
                  </div>
                )}
                {/* Mini bars on desktop */}
                <div className="hidden sm:flex flex-col gap-0.5 mt-1">
                  {dayPosts.slice(0, 3).map(p => {
                    const c  = getCat(p.category);
                    const ap = getAP(p.approvalStatus);
                    return (
                      <div key={p._id} className={`h-1.5 rounded-full bg-gradient-to-r ${c.grad} opacity-80`} title={p.category}/>
                    );
                  })}
                  {dayPosts.length > 3 && <p className="text-[9px] text-slate-400 font-bold">+{dayPosts.length - 3}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
          {Object.entries(CAT).slice(0, 5).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${v.dot}`}/>
              <span className="text-xs font-semibold text-slate-500">{v.icon} {k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
          <div className="px-6 py-4 bg-blue-950 flex items-center justify-between">
            <div>
              <p className="font-black text-white text-base">{format(selectedDay, 'EEEE, dd MMMM')}</p>
              <p className="text-blue-300 text-sm mt-0.5">{selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-black transition-colors">✕</button>
          </div>
          {selectedPosts.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-slate-400 font-semibold">Nothing scheduled on this day</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {selectedPosts.map(post => {
                const c  = getCat(post.category);
                const ap = getAP(post.approvalStatus);
                return (
                  <div key={post._id} className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-xl shrink-0`}>{c.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-black px-2.5 py-0.5 rounded-full ${c.light}`}>{post.category}</span>
                          <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${ap.badge}`}>{ap.icon} {post.approvalStatus}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {post.platforms?.map(p => <span key={p} className="text-base">{PLATFORM_ICONS[p]}</span>)}
                          {post.scheduledDate && <span className="text-xs text-slate-400">{format(new Date(post.scheduledDate), 'HH:mm')}</span>}
                        </div>
                      </div>
                    </div>
                    {post.caption && <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{post.caption}</p>}
                    {post.mediaUrls?.[0] && <img src={post.mediaUrls[0]} alt="" className="w-full aspect-video object-cover rounded-2xl mt-3 bg-slate-100"/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────
function MonthlySummary({ posts, client }) {
  const now   = new Date();
  const month = format(now, 'MMMM yyyy');

  const byCategory = useMemo(() => {
    const m = {};
    posts.forEach(p => { m[p.category] = (m[p.category] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const byPlatform = useMemo(() => {
    const m = {};
    posts.forEach(p => { p.platforms?.forEach(pl => { m[pl] = (m[pl] || 0) + 1; }); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const approvalRate = posts.length > 0 ? Math.round((posts.filter(p => p.approvalStatus === 'Approved').length / posts.length) * 100) : 0;
  const postedCount  = posts.filter(p => p.status === 'Posted').length;
  const pending      = posts.filter(p => p.approvalStatus === 'Pending').length;
  const maxCat       = Math.max(...byCategory.map(([, v]) => v), 1);
  const maxPlat      = Math.max(...byPlatform.map(([, v]) => v), 1);

  const targets = { ...{ Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 }, ...(client?.contentTargets || {}) };

  return (
    <div className="space-y-5">
      {/* Summary headline */}
      <div className="bg-gradient-to-br from-blue-950 to-violet-900 rounded-3xl p-6 text-white">
        <p className="text-blue-300 text-sm font-bold uppercase tracking-wider mb-1">Monthly Report</p>
        <h3 className="text-2xl font-black mb-1">{month}</h3>
        <p className="text-blue-200 text-base leading-relaxed">
          Your team created <span className="text-white font-black">{posts.length} posts</span> this month.{' '}
          {postedCount > 0 && <><span className="text-white font-black">{postedCount}</span> have been published. </>}
          {pending > 0
            ? <span className="text-amber-300 font-black">{pending} still need your approval.</span>
            : <span className="text-emerald-300 font-black">You're all caught up on approvals!</span>
          }
        </p>
      </div>

      {/* Big stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Posts',    value:posts.length,     icon:'📝', color:'text-slate-800',   bg:'bg-white border border-slate-100'     },
          { label:'Published',      value:postedCount,      icon:'✅', color:'text-emerald-700', bg:'bg-emerald-50 border border-emerald-100'},
          { label:'Your Approvals', value:posts.filter(p=>p.approvalStatus==='Approved').length, icon:'👍', color:'text-blue-700', bg:'bg-blue-50 border border-blue-100' },
          { label:'Awaiting You',   value:pending,          icon:'⏳', color:'text-amber-700',   bg:'bg-amber-50 border border-amber-100'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center shadow-sm`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm text-slate-500 font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly targets progress */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <p className="font-black text-slate-800 text-lg mb-1">Content Plan Progress</p>
        <p className="text-sm text-slate-400 mb-5">How much of your agreed monthly plan is complete</p>
        <div className="space-y-4">
          {Object.entries(targets).map(([cat, target]) => {
            const count = posts.filter(p => p.category === cat).length;
            const pct   = Math.min(Math.round((count / target) * 100), 100);
            const done  = count >= target;
            const c     = getCat(cat);
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-base font-bold text-slate-700">{cat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {done && <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Complete</span>}
                    <span className={`text-base font-black ${done ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {count}<span className="text-slate-400 font-normal text-sm">/{target}</span>
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${c.grad} rounded-full transition-all duration-700`} style={{ width:`${pct}%` }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <p className="font-black text-slate-800 text-lg mb-5">Content by Type</p>
          <div className="space-y-4">
            {byCategory.map(([cat, count]) => {
              const c = getCat(cat);
              return (
                <div key={cat} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-sm font-bold text-slate-700">{cat}</span>
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${c.grad} rounded-full transition-all duration-700`} style={{ width:`${(count / maxCat) * 100}%` }}/>
                  </div>
                  <span className="text-base font-black text-slate-700 w-6 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform breakdown */}
      {byPlatform.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <p className="font-black text-slate-800 text-lg mb-5">Platforms Used</p>
          <div className="space-y-4">
            {byPlatform.map(([plt, count]) => (
              <div key={plt} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <span className="text-xl">{PLATFORM_ICONS[plt]}</span>
                  <span className="text-sm font-bold text-slate-700">{plt}</span>
                </div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width:`${(count / maxPlat) * 100}%` }}/>
                </div>
                <span className="text-base font-black text-slate-700 w-6 text-right shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ClientPortal ────────────────────────────────────────────────────────
export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [client,  setClient]  = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  const load = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/clients/my/portal'),
        api.get('/posts?limit=300'),
      ]);
      setClient(cRes.data.client);
      setPosts(pRes.data.posts || []);
    } catch { toast.error('Failed to load portal data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingCount = useMemo(() => posts.filter(p => p.approvalStatus === 'Pending').length, [posts]);
  const pendingPosts = useMemo(() => posts.filter(p => p.approvalStatus === 'Pending'), [posts]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const TABS = [
    { id:'today',    label:"Today's Report", icon:'📋', desc:'What was posted today' },
    { id:'calendar', label:'Content Calendar', icon:'📅', desc:'See all scheduled content' },
    { id:'approve',  label:'Approve Content',  icon:'✅', desc:'Review & approve posts', badge: pendingCount },
    { id:'summary',  label:'Monthly Report',   icon:'📊', desc:'Stats & progress' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-950/30 border-t-blue-950 rounded-full animate-spin"/>
          <p className="text-slate-500 font-semibold text-base">Loading your portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3.5 flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {client?.logoUrl ? (
              <img src={client.logoUrl} alt={client.businessName} className="h-10 w-10 rounded-2xl object-cover bg-slate-100 shrink-0"/>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-black text-base shrink-0">
                {client?.businessName?.charAt(0) || 'C'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-base truncate">{client?.businessName || 'Client Portal'}</p>
              <p className="text-xs text-slate-400 font-medium">Content Portal by DotGanga</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {pendingCount > 0 && (
              <button onClick={() => setActiveTab('approve')}
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-black text-sm px-3 py-2 rounded-xl hover:bg-amber-100 transition-colors">
                <span className="w-5 h-5 bg-amber-400 text-white text-xs font-black rounded-full flex items-center justify-center">{pendingCount}</span>
                <span className="hidden sm:inline">Needs Review</span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-black">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-slate-700 hidden sm:block max-w-[120px] truncate">{user?.name}</span>
            </div>
            <button onClick={logout} className="w-9 h-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 flex items-center justify-center transition-colors" title="Sign out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-slate-100 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-3.5 text-sm font-bold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === t.id
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className="w-5 h-5 bg-amber-400 text-white text-xs font-black rounded-full flex items-center justify-center">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-violet-900 text-white px-4 sm:px-6 py-7 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none"/>
        <div className="absolute -bottom-8 right-24 w-32 h-32 bg-white/5 rounded-full pointer-events-none"/>
        <div className="relative max-w-4xl">
          <p className="text-blue-300 font-bold text-sm mb-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            {greeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-xl">
            {pendingCount > 0
              ? `You have ${pendingCount} post${pendingCount > 1 ? 's' : ''} waiting for your review. Tap "Approve Content" above to action them.`
              : `You're all caught up! Your content calendar is on track for ${format(new Date(), 'MMMM')}.`
            }
          </p>
          {client?.services?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {client.services.map(s => (
                <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/80 border border-white/10">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">

        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <div className="space-y-2 animate-fade-in">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-800">Today's Activity</h2>
              <p className="text-slate-500 text-sm mt-1">See what your team posted today and what's coming up</p>
            </div>
            <DailyReport posts={posts}/>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-800">Content Calendar</h2>
              <p className="text-slate-500 text-sm mt-1">Your complete content schedule — tap any day to see the posts</p>
            </div>
            <ContentCalendar posts={posts}/>
          </div>
        )}

        {/* APPROVE TAB */}
        {activeTab === 'approve' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-800">Review Content</h2>
              <p className="text-slate-500 text-sm mt-1">
                {pendingCount > 0
                  ? `${pendingCount} post${pendingCount > 1 ? 's are' : ' is'} waiting for your feedback. Approve, request changes, or reject each one.`
                  : 'All content has been reviewed — great job!'}
              </p>
            </div>

            {pendingCount === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-20 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
                <h3 className="text-xl font-black text-slate-800 mb-2">All caught up!</h3>
                <p className="text-slate-400 text-base">No posts waiting for your approval right now.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* How-to guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                  <span className="text-xl shrink-0">💡</span>
                  <div>
                    <p className="font-black text-blue-900 text-sm">How to approve content</p>
                    <p className="text-blue-700 text-sm mt-0.5 leading-relaxed">
                      Review each post below. Tap <strong>✓ Approve</strong> to publish it, <strong>✏️ Revise</strong> to ask for changes, or <strong>✕ Reject</strong> to cancel it.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {pendingPosts.map(p => <ApprovalCard key={p._id} post={p} onRefresh={load}/>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-800">Monthly Report</h2>
              <p className="text-slate-500 text-sm mt-1">A full breakdown of your content performance this month</p>
            </div>
            <MonthlySummary posts={posts} client={client}/>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white px-4 sm:px-6 py-4 text-center">
        <p className="text-xs text-slate-400">Powered by <span className="font-black text-slate-600">DotGanga</span> · Content Management Platform</p>
      </footer>
    </div>
  );
}
