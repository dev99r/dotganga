import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEPT = {
  Sales:      { bg: 'bg-violet-500',  ring: 'ring-violet-200',  text: 'text-violet-700',  light: 'bg-violet-50'  },
  Creative:   { bg: 'bg-pink-500',    ring: 'ring-pink-200',    text: 'text-pink-700',    light: 'bg-pink-50'    },
  Marketing:  { bg: 'bg-cyan-500',    ring: 'ring-cyan-200',    text: 'text-cyan-700',    light: 'bg-cyan-50'    },
  Management: { bg: 'bg-amber-500',   ring: 'ring-amber-200',   text: 'text-amber-700',   light: 'bg-amber-50'   },
  Operations: { bg: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700', light: 'bg-emerald-50' },
  Tech:       { bg: 'bg-blue-500',    ring: 'ring-blue-200',    text: 'text-blue-700',    light: 'bg-blue-50'    },
};
const getDept = d => DEPT[d] || { bg: 'bg-slate-400', ring: 'ring-slate-200', text: 'text-slate-600', light: 'bg-slate-100' };

const TASK_CFG = {
  Done:          { icon: '✓', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'In Progress': { icon: '⟳', cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500'    },
  Blocked:       { icon: '✕', cls: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500'     },
};
const getTTask = s => TASK_CFG[s] || TASK_CFG['Done'];

const SENT_CFG = {
  Happy:    { emoji: '😊', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  Neutral:  { emoji: '😐', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
  Stressed: { emoji: '😓', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'   },
  Burnout:  { emoji: '🔥', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100'     },
};

const STATUS_CFG = {
  Pending:  { badge: 'bg-amber-100 text-amber-700',   bar: 'bg-amber-400',   icon: '⏳' },
  Approved: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', icon: '✓'  },
  Flagged:  { badge: 'bg-red-100 text-red-700',       bar: 'bg-red-400',     icon: '⚑'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function Avatar({ name, department, size = 'md' }) {
  const d  = getDept(department);
  const sz = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-2xl ${d.bg} flex items-center justify-center font-black text-white shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
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
        if (payload.status === 'Approved') toast.success(`Approved ${report.userName}'s report`);
        if (payload.status === 'Flagged')  toast(`Flagged ${report.userName}'s report`, { icon: '🚩' });
        if (payload.managerComment !== undefined) toast.success('Note sent');
      }
    } catch { toast.error('Action failed'); }
    setSaving(false);
  };

  const sent  = SENT_CFG[report.sentiment] || SENT_CFG.Neutral;
  const dept  = getDept(report.department);
  const sCfg  = STATUS_CFG[report.status] || STATUS_CFG.Pending;
  const doneCount  = report.tasks?.filter(t => t.status === 'Done').length || 0;
  const totalTasks = report.tasks?.length || 0;
  const pct        = totalTasks > 0 ? Math.round(doneCount / totalTasks * 100) : 0;
  const blockedN   = report.tasks?.filter(t => t.status === 'Blocked').length || 0;
  const wipN       = report.tasks?.filter(t => t.status === 'In Progress').length || 0;

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm transition-all duration-200 ${
      report.status === 'Flagged'  ? 'ring-1 ring-red-200'     :
      report.status === 'Approved' ? 'ring-1 ring-emerald-200' :
      'ring-1 ring-slate-100 hover:ring-slate-200'
    }`}>
      {/* Status accent line */}
      <div className={`h-1 w-full ${sCfg.bar}`} />

      {/* Card header — always visible */}
      <button className="w-full text-left px-5 pt-4 pb-3" onClick={() => setOpen(o => !o)}>
        <div className="flex items-start gap-3">
          <Avatar name={report.userName} department={report.department} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 text-sm">{report.userName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dept.light} ${dept.text}`}>
                    {report.department}
                  </span>
                  <span className="text-base">{sent.emoji}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{report.designation}</p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${sCfg.badge}`}>
                  {report.status}
                </span>
                {report.hoursWorked > 0 && (
                  <span className="text-[11px] font-black text-slate-400">{report.hoursWorked}h</span>
                )}
              </div>
            </div>

            {/* Progress + mini stats */}
            {totalTasks > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {doneCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600">✓ {doneCount} done</span>
                    )}
                    {wipN > 0 && (
                      <span className="text-[10px] font-bold text-blue-500">⟳ {wipN} wip</span>
                    )}
                    {blockedN > 0 && (
                      <span className="text-[10px] font-bold text-red-500">✕ {blockedN} blocked</span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview task chips — collapsed only */}
        {!open && report.tasks?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {report.tasks.slice(0, 4).map((t, i) => {
              const tc = getTTask(t.status);
              return (
                <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border ${tc.cls}`}>
                  <span className="font-bold">{tc.icon}</span>
                  <span className="truncate max-w-[100px]">{t.task}</span>
                </span>
              );
            })}
            {report.tasks.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center font-semibold">+{report.tasks.length - 4} more</span>
            )}
          </div>
        )}

        {/* Expand chevron */}
        <div className="flex justify-center mt-2.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-300 font-semibold">
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            {open ? 'collapse' : 'view details'}
          </div>
        </div>
      </button>

      {/* ── Expanded panel ── */}
      {open && (
        <div className="border-t border-slate-100">

          {/* Mood + meta row */}
          <div className={`px-5 py-3 flex items-center gap-4 ${sent.bg} border-b ${sent.border}`}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{sent.emoji}</span>
              <div>
                <p className={`text-sm font-bold ${sent.color}`}>{report.sentiment}</p>
                <p className="text-[10px] text-slate-500">{report.hoursWorked || 0}h worked</p>
              </div>
            </div>
            {report.reviewedBy && (
              <div className="ml-auto text-right">
                <p className="text-[10px] text-slate-400">Reviewed by</p>
                <p className="text-xs font-bold text-slate-600">{report.reviewedBy}</p>
              </div>
            )}
          </div>

          {/* All tasks */}
          {report.tasks?.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Tasks — {doneCount}/{totalTasks} complete
              </p>
              <div className="space-y-2">
                {report.tasks.map((t, i) => {
                  const tc = getTTask(t.status);
                  return (
                    <div key={i} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 border ${tc.cls}`}>
                      <span className={`w-4 h-4 rounded-md ${tc.dot} flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5`}>
                        {tc.icon}
                      </span>
                      <span className="text-sm leading-snug flex-1 text-slate-700">{t.task}</span>
                      <span className="text-[10px] font-bold opacity-50 shrink-0 self-start mt-0.5">
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
            <div className="px-5 pb-4 grid gap-2.5">
              {report.highlights && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">🏆 Highlights</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{report.highlights}</p>
                </div>
              )}
              {report.blockers && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5">🚧 Blockers</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{report.blockers}</p>
                </div>
              )}
              {report.tomorrowPlan?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">📋 Tomorrow's Plan</p>
                  <div className="space-y-1.5">
                    {report.tomorrowPlan.map((p, i) => (
                      <div key={i} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-blue-400 font-black shrink-0 mt-0.5">→</span>
                        <span className="leading-snug">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing manager note */}
          {report.managerComment && (
            <div className="mx-5 mb-4 flex items-start gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Manager Note</p>
                <p className="text-sm text-slate-600 italic">"{report.managerComment}"</p>
              </div>
            </div>
          )}

          {/* Action strip */}
          <div className="px-5 pb-5 space-y-3">
            {/* Approve / Flag */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => patch({ status: 'Approved' })}
                disabled={saving || report.status === 'Approved'}
                className={`py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                  report.status === 'Approved'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 cursor-default'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:shadow-md hover:shadow-emerald-200'
                } disabled:opacity-50`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {report.status === 'Approved' ? 'Approved' : 'Approve'}
              </button>
              <button
                onClick={() => patch({ status: 'Flagged' })}
                disabled={saving || report.status === 'Flagged'}
                className={`py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                  report.status === 'Flagged'
                    ? 'bg-red-500 text-white shadow-md shadow-red-200 cursor-default'
                    : 'bg-red-50 text-red-700 hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-200'
                } disabled:opacity-50`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                {report.status === 'Flagged' ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Comment box */}
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') patch({ managerComment: comment }); }}
                placeholder="Write a note for this team member…"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors placeholder:text-slate-300"
              />
              <button
                onClick={() => patch({ managerComment: comment })}
                disabled={saving || !comment.trim()}
                className="bg-blue-950 hover:bg-blue-900 active:scale-95 text-white font-black text-xs py-2.5 px-4 rounded-xl shrink-0 transition-all disabled:opacity-40"
              >
                {saving ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
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
      const [repRes, staffRes] = await Promise.all([
        api.get(`/daily-report?date=${date}`),
        api.get('/staff'),
      ]);
      if (repRes.data.success)   { setReports(repRes.data.reports); setSummary(repRes.data.summary); }
      if (staffRes.data.success) setAllStaff(staffRes.data.staff.filter(s => s.role !== 'Admin'));
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

  const activeStaff   = allStaff.filter(s => s.isActive);
  const submittedIds  = new Set(reports.map(r => String(r.userId)));
  const missing       = activeStaff.filter(s => !submittedIds.has(String(s._id)));
  const submissionPct = activeStaff.length > 0 ? Math.round(reports.length / activeStaff.length * 100) : 0;
  const isToday       = date === new Date().toISOString().slice(0, 10);

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)); };
  const nextDay = () => {
    const d = new Date(date); d.setDate(d.getDate() + 1);
    if (d.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10)) setDate(d.toISOString().slice(0, 10));
  };

  const filtered = filter === 'All' ? reports : reports.filter(r => r.status === filter);
  const filterCfg = [
    { key: 'All',      label: 'All',      count: reports.length,                                   color: 'text-slate-700' },
    { key: 'Pending',  label: 'Pending',  count: reports.filter(r => r.status==='Pending').length,  color: 'text-amber-600' },
    { key: 'Approved', label: 'Approved', count: reports.filter(r => r.status==='Approved').length, color: 'text-emerald-600' },
    { key: 'Flagged',  label: 'Flagged',  count: reports.filter(r => r.status==='Flagged').length,  color: 'text-red-600' },
  ];

  // ── friendly date string
  let friendlyDate = '';
  try { friendlyDate = format(parseISO(date), 'EEEE, dd MMMM yyyy'); } catch {}

  return (
    <div className="space-y-5 max-w-3xl animate-fade-in">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-blue-950 text-white px-6 pt-6 pb-5 shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Daily Reports</p>
          <p className="text-xl font-black mt-0.5 mb-4">{friendlyDate || date}</p>

          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button onClick={prevDay}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input type="date" value={date}
              onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
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

          {/* Submission progress inside hero */}
          {activeStaff.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-blue-300 text-xs font-semibold">Team Submissions</span>
                <span className="text-white font-black text-sm">
                  {reports.length}
                  <span className="text-blue-300 font-normal text-xs"> / {activeStaff.length}</span>
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    submissionPct === 100 ? 'bg-emerald-400' :
                    submissionPct >= 70   ? 'bg-blue-400'    :
                    submissionPct >= 40   ? 'bg-amber-400'   : 'bg-red-400'
                  }`}
                  style={{ width: `${submissionPct}%` }}
                />
              </div>

              {/* Avatar row */}
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {activeStaff.map(s => {
                  const submitted = submittedIds.has(String(s._id));
                  const d = getDept(s.department);
                  return (
                    <div key={s._id}
                      title={`${s.name} — ${submitted ? 'submitted' : 'not submitted'}`}
                      className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all ${
                        submitted ? `${d.bg} text-white ring-2 ring-white/30` : 'bg-white/10 text-white/30'
                      }`}>
                      {initials(s.name)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat tiles ── */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 stagger">
          {[
            { label: 'Submitted', value: summary.total,    bg: 'bg-white',        num: 'text-slate-900',   icon: '📋' },
            { label: 'Approved',  value: summary.approved, bg: 'bg-emerald-50',   num: 'text-emerald-700', icon: '✅' },
            { label: 'Pending',   value: summary.pending,  bg: 'bg-amber-50',     num: 'text-amber-700',   icon: '⏳' },
            { label: 'Flagged',   value: summary.flagged,  bg: 'bg-red-50',       num: 'text-red-700',     icon: '🚩' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl border border-slate-100 p-3.5 text-center shadow-sm`}>
              <div className="text-lg mb-0.5">{c.icon}</div>
              <p className={`text-2xl font-black tabular-nums ${c.num}`}>{c.value}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Missing staff banner ── */}
      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2.5 border-b border-amber-200/50">
            <div className="w-7 h-7 rounded-xl bg-amber-400 flex items-center justify-center text-white shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-xs font-black text-amber-800">NOT SUBMITTED YET</p>
            <span className="ml-auto text-xs font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
              {missing.length} {missing.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2">
            {missing.map(s => {
              const d = getDept(s.department);
              return (
                <span key={s._id}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl ${d.light} ${d.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${d.bg} shrink-0`} />
                  {s.name}
                  <span className="opacity-40 text-[10px]">·</span>
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
          {filterCfg.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                filter === f.key
                  ? `bg-white text-slate-900 shadow-sm`
                  : `text-slate-400 hover:text-slate-600`
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1 text-[10px] font-black ${filter === f.key ? f.color : 'opacity-50'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Report cards ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm ring-1 ring-slate-100">
              <div className="h-1 bg-slate-100 shimmer" />
              <div className="p-5 flex gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-1/3" />
                  <div className="h-2 bg-slate-100 rounded-full animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl ring-1 ring-slate-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-4">
            {filter === 'All' ? '📭' : filter === 'Approved' ? '✅' : filter === 'Flagged' ? '🚩' : '⏳'}
          </p>
          <p className="font-black text-slate-700 text-lg">
            {filter === 'All' ? 'No reports yet' : `No ${filter.toLowerCase()} reports`}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'All'
              ? `Reports will appear once staff submit for this day`
              : `Switch tabs to see reports in other statuses`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReportCard key={r._id} report={r} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
