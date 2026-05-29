import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const DEPT = {
  Sales:      { bg: 'bg-violet-500', text: 'text-violet-700', light: 'bg-violet-50', bar: 'bg-violet-400' },
  Creative:   { bg: 'bg-pink-500',   text: 'text-pink-700',   light: 'bg-pink-50',   bar: 'bg-pink-400'   },
  Marketing:  { bg: 'bg-cyan-500',   text: 'text-cyan-700',   light: 'bg-cyan-50',   bar: 'bg-cyan-400'   },
  Management: { bg: 'bg-amber-500',  text: 'text-amber-700',  light: 'bg-amber-50',  bar: 'bg-amber-400'  },
  Operations: { bg: 'bg-emerald-500',text: 'text-emerald-700',light: 'bg-emerald-50',bar: 'bg-emerald-400'},
  Tech:       { bg: 'bg-blue-500',   text: 'text-blue-700',   light: 'bg-blue-50',   bar: 'bg-blue-400'   },
};
const getDept = d => DEPT[d] || { bg: 'bg-slate-400', text: 'text-slate-600', light: 'bg-slate-100', bar: 'bg-slate-300' };

const TASK = {
  Done:          { icon: '✓', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'In Progress': { icon: '⟳', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  Blocked:       { icon: '✕', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },
};
const getTask = s => TASK[s] || TASK['Done'];

const SENT = {
  Happy:    { emoji: '😊', label: 'Happy',    bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Neutral:  { emoji: '😐', label: 'Neutral',  bg: 'bg-blue-50',    text: 'text-blue-700'    },
  Stressed: { emoji: '😓', label: 'Stressed', bg: 'bg-amber-50',   text: 'text-amber-700'   },
  Burnout:  { emoji: '🔥', label: 'Burnout',  bg: 'bg-red-50',     text: 'text-red-700'     },
};

const STATUS = {
  Pending:  { badge: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-400',   label: 'Pending'  },
  Approved: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', label: 'Approved' },
  Flagged:  { badge: 'bg-red-100 text-red-700',         bar: 'bg-red-400',     label: 'Flagged'  },
};

function ini(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report, onUpdate }) {
  const [open,    setOpen]    = useState(false);
  const [comment, setComment] = useState(report.managerComment || '');
  const [saving,  setSaving]  = useState(false);

  const patch = async (payload) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/daily-report/${report._id}`, payload);
      if (data.success) {
        onUpdate(data.report);
        if (payload.status === 'Approved') toast.success(`✅ Approved ${report.userName}'s report`);
        if (payload.status === 'Flagged')  toast(`🚩 Flagged ${report.userName}'s report`);
        if (payload.managerComment !== undefined) toast.success('Note sent!');
      }
    } catch { toast.error('Action failed'); }
    setSaving(false);
  };

  const s    = SENT[report.sentiment] || SENT.Neutral;
  const d    = getDept(report.department);
  const st   = STATUS[report.status] || STATUS.Pending;
  const done = report.tasks?.filter(t => t.status === 'Done').length || 0;
  const tot  = report.tasks?.length || 0;
  const wip  = report.tasks?.filter(t => t.status === 'In Progress').length || 0;
  const blk  = report.tasks?.filter(t => t.status === 'Blocked').length || 0;
  const pct  = tot > 0 ? Math.round(done / tot * 100) : 0;

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
      report.status === 'Flagged'  ? 'border-red-200'     :
      report.status === 'Approved' ? 'border-emerald-200' : 'border-slate-100'
    }`}>
      {/* Accent bar */}
      <div className={`h-1 ${st.bar}`} />

      {/* Header row — always visible, tappable */}
      <div className="px-4 pt-3.5 pb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl ${d.bg} flex items-center justify-center font-black text-white text-sm shrink-0`}>
            {ini(report.userName)}
          </div>

          {/* Name + dept + mood */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-slate-900 text-sm">{report.userName}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${d.light} ${d.text}`}>{report.department}</span>
              <span className="text-sm">{s.emoji}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{report.designation}</p>
          </div>

          {/* Right: status + hours + chevron */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${st.badge}`}>{st.label}</span>
            {report.hoursWorked > 0 && (
              <span className="text-[10px] font-bold text-slate-400">{report.hoursWorked}h</span>
            )}
          </div>
          <svg className={`w-4 h-4 text-slate-300 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Progress bar + stats — always visible */}
        {tot > 0 && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex gap-2">
                {done > 0 && <span className="text-[10px] font-bold text-emerald-600">✓ {done} done</span>}
                {wip  > 0 && <span className="text-[10px] font-bold text-blue-500">⟳ {wip} wip</span>}
                {blk  > 0 && <span className="text-[10px] font-bold text-red-500">✕ {blk} blocked</span>}
              </div>
              <span className="text-[10px] font-black text-slate-400">{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'
              }`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Task chips preview */}
        {!open && tot > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {report.tasks.slice(0, 3).map((t, i) => {
              const tc = getTask(t.status);
              return (
                <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${tc.bg} ${tc.text} ${tc.border}`}>
                  {tc.icon} <span className="truncate max-w-[100px]">{t.task}</span>
                </span>
              );
            })}
            {tot > 3 && <span className="text-[10px] text-slate-400 self-center">+{tot - 3} more</span>}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-slate-100">

          {/* Mood strip */}
          <div className={`px-4 py-2.5 flex items-center gap-2 ${s.bg}`}>
            <span className="text-xl">{s.emoji}</span>
            <span className={`text-sm font-bold ${s.text}`}>{s.label} day</span>
            <span className="text-xs text-slate-400 ml-auto">{report.hoursWorked || 0}h worked</span>
          </div>

          {/* All tasks */}
          {tot > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Tasks ({done}/{tot} complete)
              </p>
              <div className="space-y-1.5">
                {report.tasks.map((t, i) => {
                  const tc = getTask(t.status);
                  return (
                    <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 border ${tc.bg} ${tc.border}`}>
                      <span className={`w-4 h-4 rounded-md ${tc.dot} flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5`}>
                        {tc.icon}
                      </span>
                      <span className={`text-sm flex-1 leading-snug ${tc.text}`}>{t.task}</span>
                      <span className="text-[9px] font-bold opacity-50 shrink-0 mt-0.5">
                        {t.status === 'In Progress' ? 'WIP' : t.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Highlights / Blockers / Plan */}
          {(report.highlights || report.blockers || report.tomorrowPlan?.length > 0) && (
            <div className="px-4 pb-3 space-y-2">
              {report.highlights && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">🏆 Highlights</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{report.highlights}</p>
                </div>
              )}
              {report.blockers && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">🚧 Blockers</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{report.blockers}</p>
                </div>
              )}
              {report.tomorrowPlan?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">📋 Tomorrow</p>
                  {report.tomorrowPlan.map((p, i) => (
                    <div key={i} className="flex gap-1.5 text-sm text-slate-700 mt-1">
                      <span className="text-blue-400 font-black">→</span><span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manager note */}
          {report.managerComment && (
            <div className="mx-4 mb-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Manager Note</p>
              <p className="text-sm text-slate-600 italic">"{report.managerComment}"</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 space-y-2.5">
            {/* Approve / Flag */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => patch({ status: 'Approved' })}
                disabled={saving || report.status === 'Approved'}
                className={`py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  report.status === 'Approved'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                } disabled:opacity-50`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {report.status === 'Approved' ? 'Approved ✓' : 'Approve'}
              </button>
              <button onClick={() => patch({ status: 'Flagged' })}
                disabled={saving || report.status === 'Flagged'}
                className={`py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  report.status === 'Flagged'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-red-50 text-red-700 hover:bg-red-500 hover:text-white'
                } disabled:opacity-50`}>
                <span>🚩</span>
                {report.status === 'Flagged' ? 'Flagged' : 'Flag Issue'}
              </button>
            </div>

            {/* Comment box */}
            <div className="flex gap-2">
              <input value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) patch({ managerComment: comment }); }}
                placeholder="Write feedback for this member… (Enter to send)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white placeholder:text-slate-300"
              />
              <button onClick={() => patch({ managerComment: comment })}
                disabled={saving || !comment.trim()}
                className="bg-blue-950 hover:bg-blue-900 active:scale-95 text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all disabled:opacity-40 shrink-0">
                {saving ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function DailyReportsView() {
  const [reports,  setReports]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get(`/daily-report?date=${date}`),
        api.get('/staff'),
      ]);
      if (r.data.success) { setReports(r.data.reports); setSummary(r.data.summary); }
      if (s.data.success) setAllStaff(s.data.staff.filter(x => x.role !== 'Admin'));
    } catch {}
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (updated) => {
    setReports(prev => {
      const next = prev.map(r => r._id === updated._id ? updated : r);
      setSummary({
        total:    next.length,
        approved: next.filter(r => r.status === 'Approved').length,
        pending:  next.filter(r => r.status === 'Pending').length,
        flagged:  next.filter(r => r.status === 'Flagged').length,
      });
      return next;
    });
  };

  const active        = allStaff.filter(s => s.isActive);
  const submittedIds  = new Set(reports.map(r => String(r.userId)));
  const missing       = active.filter(s => !submittedIds.has(String(s._id)));
  const subPct        = active.length > 0 ? Math.round(reports.length / active.length * 100) : 0;
  const isToday       = date === new Date().toISOString().slice(0, 10);

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)); };
  const nextDay = () => {
    const d = new Date(date); d.setDate(d.getDate() + 1);
    if (d.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10)) setDate(d.toISOString().slice(0, 10));
  };

  const filtered = filter === 'All' ? reports : reports.filter(r => r.status === filter);
  let dateLabel = '';
  try { dateLabel = format(parseISO(date), 'EEEE, dd MMM yyyy'); } catch {}

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-blue-950 text-white px-5 pt-5 pb-4 shadow-xl">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Daily Reports</p>
          <p className="font-black text-lg mt-0.5 mb-3">{dateLabel}</p>

          {/* Date nav */}
          <div className="flex items-center gap-2">
            <button onClick={prevDay} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input type="date" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-center [color-scheme:dark]"
            />
            <button onClick={nextDay} disabled={isToday}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {!isToday && (
              <button onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                className="text-xs font-black bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl transition-colors whitespace-nowrap">
                Today
              </button>
            )}
          </div>

          {/* Submission progress */}
          {active.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-blue-300 text-xs font-semibold">Team Submissions</span>
                <span className="font-black text-sm">{reports.length}<span className="text-blue-300 font-normal text-xs"> / {active.length}</span></span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  subPct === 100 ? 'bg-emerald-400' : subPct >= 70 ? 'bg-blue-400' : subPct >= 40 ? 'bg-amber-400' : 'bg-red-400'
                }`} style={{ width: `${subPct}%` }} />
              </div>
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {active.map(s => {
                  const submitted = submittedIds.has(String(s._id));
                  const dc = getDept(s.department);
                  return (
                    <div key={s._id} title={`${s.name} — ${submitted ? 'submitted' : 'not submitted'}`}
                      className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all ${
                        submitted ? `${dc.bg} text-white` : 'bg-white/10 text-white/30'
                      }`}>
                      {ini(s.name)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total',    value: summary.total,    icon: '📋', num: 'text-slate-800',   bg: 'bg-white'       },
            { label: 'Approved', value: summary.approved, icon: '✅', num: 'text-emerald-700', bg: 'bg-emerald-50'  },
            { label: 'Pending',  value: summary.pending,  icon: '⏳', num: 'text-amber-700',   bg: 'bg-amber-50'    },
            { label: 'Flagged',  value: summary.flagged,  icon: '🚩', num: 'text-red-700',     bg: 'bg-red-50'      },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl border border-slate-100 p-3 text-center shadow-sm`}>
              <div className="text-lg mb-0.5">{c.icon}</div>
              <p className={`text-2xl font-black tabular-nums ${c.num}`}>{c.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Not submitted ── */}
      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2 bg-amber-100/50">
            <span className="text-base">⚠️</span>
            <p className="text-xs font-black text-amber-800 flex-1">NOT SUBMITTED</p>
            <span className="text-xs font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">{missing.length}</span>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-1.5">
            {missing.map(s => {
              const dc = getDept(s.department);
              return (
                <span key={s._id} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl ${dc.light} ${dc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dc.bg}`} />
                  {s.name}
                  <span className="opacity-40">·</span>
                  <span className="opacity-60 text-[10px]">{s.designation}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      {reports.length > 0 && (
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
          {[
            { key: 'All',      count: reports.length },
            { key: 'Pending',  count: reports.filter(r => r.status === 'Pending').length  },
            { key: 'Approved', count: reports.filter(r => r.status === 'Approved').length },
            { key: 'Flagged',  count: reports.filter(r => r.status === 'Flagged').length  },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                filter === f.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {f.key} {f.count > 0 && <span className="opacity-60">({f.count})</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Cards ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/3" />
                  <div className="h-2 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-4xl mb-3">{filter === 'All' ? '📭' : filter === 'Approved' ? '✅' : filter === 'Flagged' ? '🚩' : '⏳'}</p>
          <p className="font-black text-slate-700">{filter === 'All' ? 'No reports yet' : `No ${filter.toLowerCase()} reports`}</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'All' ? 'Reports appear once staff submit for this day' : 'Switch tabs to see other reports'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => <ReportCard key={r._id} report={r} onUpdate={handleUpdate} />)}
        </div>
      )}
    </div>
  );
}
