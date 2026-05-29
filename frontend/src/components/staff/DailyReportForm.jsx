import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SENTIMENTS = [
  { value: 'Happy',    emoji: '😊', label: 'Happy',    bg: 'bg-emerald-500' },
  { value: 'Neutral',  emoji: '😐', label: 'Neutral',  bg: 'bg-blue-500'   },
  { value: 'Stressed', emoji: '😓', label: 'Stressed', bg: 'bg-amber-500'  },
  { value: 'Burnout',  emoji: '🔥', label: 'Burnout',  bg: 'bg-red-500'    },
];

const STATUS = {
  Done:        { emoji: '✅', label: 'Done',     bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', barBg: 'bg-emerald-100' },
  'In Progress':{ emoji: '🔄', label: 'In Progress', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700',   border: 'border-blue-200',    barBg: 'bg-blue-100'    },
  Blocked:     { emoji: '🚫', label: 'Blocked',  bg: 'bg-red-500',     light: 'bg-red-50 text-red-700',     border: 'border-red-200',     barBg: 'bg-red-100'     },
};

const getSt = v => STATUS[v] || STATUS['Done'];

const TODAY = new Date().toISOString().slice(0, 10);
const FRIENDLY_DATE = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

// ── Task card for the editor ──────────────────────────────────────────────────
function TaskInput({ task, index, total, onChange, onRemove, onEnter, autoFocus }) {
  const ref = useRef(null);
  const st  = getSt(task.status);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [autoFocus]);

  return (
    <div className={`rounded-xl border ${st.border} overflow-hidden`}>
      {/* Top bar: status pills + remove */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${st.barBg}`}>
        {Object.entries(STATUS).map(([k, s]) => (
          <button key={k} type="button"
            onClick={() => onChange(index, 'status', k)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
              task.status === k ? `${s.bg} text-white shadow-sm` : 'bg-white/70 text-slate-400 hover:bg-white'
            }`}>
            {s.emoji} {k === 'In Progress' ? 'WIP' : k}
          </button>
        ))}
        {total > 1 && (
          <button type="button" onClick={() => onRemove(index)}
            className="ml-auto w-5 h-5 rounded-md bg-white/60 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {/* Input */}
      <input ref={ref} value={task.task}
        onChange={e => onChange(index, 'task', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onEnter(index); } }}
        placeholder={
          task.status === 'Done'         ? 'What did you complete?' :
          task.status === 'In Progress'  ? 'What are you working on?' : 'What is blocking you?'
        }
        className="w-full px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none placeholder:text-slate-300"
      />
    </div>
  );
}

// ── Read-only task chip ───────────────────────────────────────────────────────
function TaskChip({ task }) {
  const st = getSt(task.status);
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${st.light} border ${st.border}`}>
      <span className="text-base shrink-0">{st.emoji}</span>
      <span className="text-sm flex-1">{task.task}</span>
      <span className="text-[10px] font-bold opacity-50 shrink-0">{task.status === 'In Progress' ? 'WIP' : task.status}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DailyReportForm() {
  const [report,     setReport]     = useState(null);   // submitted report
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(false);  // edit mode
  const [submitting, setSubmitting] = useState(false);
  const [tab,        setTab]        = useState('All');  // task filter tab

  // Form state (used for both new + edit)
  const [hoursWorked, setHoursWorked] = useState('');
  const [tasks,       setTasks]       = useState([{ task: '', status: 'Done' }]);
  const [highlights,  setHighlights]  = useState('');
  const [blockers,    setBlockers]    = useState('');
  const [plan,        setPlan]        = useState(['']);
  const [sentiment,   setSentiment]   = useState('Neutral');
  const [newIdx,      setNewIdx]      = useState(null);

  useEffect(() => {
    api.get('/daily-report?mine=true')
      .then(({ data }) => { if (data.reports?.[0]) setReport(data.reports[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Populate edit form from existing report
  const startEdit = () => {
    setHoursWorked(String(report.hoursWorked || ''));
    setTasks(report.tasks?.length ? report.tasks.map(t => ({ ...t })) : [{ task: '', status: 'Done' }]);
    setHighlights(report.highlights || '');
    setBlockers(report.blockers || '');
    setPlan(report.tomorrowPlan?.length ? report.tomorrowPlan : ['']);
    setSentiment(report.sentiment || 'Neutral');
    setNewIdx(null);
    setEditing(true);
  };

  // Task helpers
  const addTask = (status = 'Done') => {
    setTasks(t => [...t, { task: '', status }]);
    setNewIdx(tasks.length);
  };
  const insertAfter = (i) => {
    const next = [...tasks];
    next.splice(i + 1, 0, { task: '', status: tasks[i].status });
    setTasks(next);
    setNewIdx(i + 1);
  };
  const removeTask = (i) => { if (tasks.length > 1) setTasks(t => t.filter((_, x) => x !== i)); };
  const editTask   = (i, f, v) => setTasks(t => t.map((x, x2) => x2 === i ? { ...x, [f]: v } : x));

  const addPlan    = () => setPlan(p => [...p, '']);
  const removePlan = (i) => { if (plan.length > 1) setPlan(p => p.filter((_, x) => x !== i)); };
  const editPlan   = (i, v) => setPlan(p => p.map((x, x2) => x2 === i ? v : x));

  const validTasks = () => tasks.filter(t => t.task.trim());

  const handleSubmit = async () => {
    if (!validTasks().length) { toast.error('Add at least one task.'); return; }
    setSubmitting(true);
    const payload = {
      hoursWorked:  Number(hoursWorked) || 0,
      tasks:        validTasks(),
      highlights:   highlights.trim(),
      blockers:     blockers.trim(),
      tomorrowPlan: plan.filter(Boolean),
      sentiment,
    };
    try {
      if (editing && report) {
        const { data } = await api.put(`/daily-report/${report._id}`, payload);
        if (data.success) { toast.success('Report updated!'); setReport(data.report); setEditing(false); }
        else toast.error(data.message || 'Update failed.');
      } else {
        const { data } = await api.post('/daily-report', payload);
        if (data.success) { toast.success('Report submitted! 🚀'); setReport(data.report); }
        else toast.error(data.message || 'Submit failed.');
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Network error.'); }
    finally { setSubmitting(false); }
  };

  // Live task stats
  const filled  = tasks.filter(t => t.task.trim()).length;
  const doneN   = tasks.filter(t => t.task.trim() && t.status === 'Done').length;
  const wipN    = tasks.filter(t => t.task.trim() && t.status === 'In Progress').length;
  const blkN    = tasks.filter(t => t.task.trim() && t.status === 'Blocked').length;

  if (loading) return (
    <div className="space-y-3">{[1,2,3].map(i =>
      <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // EDIT MODE (or new report form)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!report || editing) {
    return (
      <div className="space-y-4 pb-10">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-blue-950 text-white px-5 py-5">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            {editing && (
              <button type="button" onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-blue-400 text-xs font-semibold mb-2 hover:text-blue-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to report
              </button>
            )}
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">
              {editing ? 'Edit Report' : 'Daily Report'}
            </p>
            <p className="text-sm font-black mt-0.5">{FRIENDLY_DATE}</p>
            {filled > 0 && (
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {doneN > 0 && <span className="bg-emerald-500/25 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-lg">✅ {doneN}</span>}
                {wipN  > 0 && <span className="bg-blue-500/25    text-blue-300    text-[10px] font-black px-2 py-0.5 rounded-lg">🔄 {wipN}</span>}
                {blkN  > 0 && <span className="bg-red-500/25     text-red-300     text-[10px] font-black px-2 py-0.5 rounded-lg">🚫 {blkN}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours Worked</p>
            <div className="flex items-baseline gap-1">
              <input type="number" min="0" max="24" step="0.5"
                value={hoursWorked} onChange={e => setHoursWorked(e.target.value)}
                placeholder="0"
                className="w-14 text-xl font-black text-blue-600 bg-transparent focus:outline-none placeholder:text-slate-200"
              />
              <span className="text-slate-400 text-xs">hrs</span>
            </div>
          </div>
          <div className="flex gap-1">
            {[4,6,8,9].map(h => (
              <button key={h} type="button" onClick={() => setHoursWorked(String(h))}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${hoursWorked === String(h) ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-sm font-black text-slate-800">Tasks</p>
            <span className="text-xs text-slate-400">{filled} added · Enter = next task</span>
          </div>

          {tasks.map((t, i) => (
            <TaskInput key={i} task={t} index={i} total={tasks.length}
              onChange={editTask} onRemove={removeTask} onEnter={insertAfter}
              autoFocus={newIdx === i}
            />
          ))}

          {/* Add buttons */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {Object.entries(STATUS).map(([k, s]) => (
              <button key={k} type="button" onClick={() => addTask(k)}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-dashed transition-all active:scale-95 ${
                  k === 'Done'         ? 'border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 text-emerald-500' :
                  k === 'In Progress'  ? 'border-blue-200   hover:bg-blue-50   hover:border-blue-400   text-blue-500'    :
                                         'border-red-200    hover:bg-red-50    hover:border-red-400    text-red-500'
                }`}>
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-black">+ {k === 'In Progress' ? 'In Progress' : k}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
            <p className="text-[11px] font-bold text-emerald-700">🏆 Highlights — What went well?</p>
          </div>
          <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={2}
            placeholder="Wins, good feedback, breakthroughs…"
            className="w-full px-4 py-3 text-sm text-slate-600 bg-transparent resize-none focus:outline-none placeholder:text-slate-300" />
        </div>

        {/* Blockers */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-2 bg-red-50 border-b border-red-100">
            <p className="text-[11px] font-bold text-red-600">🚧 Blockers & Challenges</p>
          </div>
          <textarea value={blockers} onChange={e => setBlockers(e.target.value)} rows={2}
            placeholder="Anything blocking your progress…"
            className="w-full px-4 py-3 text-sm text-slate-600 bg-transparent resize-none focus:outline-none placeholder:text-slate-300" />
        </div>

        {/* Tomorrow's plan */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <p className="text-[11px] font-bold text-blue-700">📋 Tomorrow's Plan</p>
            <button type="button" onClick={addPlan}
              className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg hover:bg-blue-200">+ Add</button>
          </div>
          <div className="px-4 py-3 space-y-2">
            {plan.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-blue-400 text-xs font-black w-4 shrink-0">{i + 1}.</span>
                <input value={item} onChange={e => editPlan(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlan(); } }}
                  placeholder={`Plan item ${i + 1}…`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white" />
                {plan.length > 1 && (
                  <button type="button" onClick={() => removePlan(i)}
                    className="w-7 h-7 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">How are you feeling?</p>
          <div className="grid grid-cols-4 gap-2">
            {SENTIMENTS.map(s => (
              <button key={s.value} type="button" onClick={() => setSentiment(s.value)}
                className={`flex flex-col items-center gap-1 py-3.5 rounded-2xl border-2 transition-all active:scale-95 ${
                  sentiment === s.value ? `${s.bg} text-white border-transparent shadow-md` : 'bg-white border-slate-200 text-slate-400'
                }`}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] font-black">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="w-full bg-blue-950 hover:bg-blue-900 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-blue-950/20 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{editing ? 'Updating…' : 'Submitting…'}</>
            : editing
              ? `💾 Update Report${filled > 0 ? ` (${filled} tasks)` : ''}`
              : `🚀 Submit Report${filled > 0 ? ` (${filled} tasks)` : ''}`
          }
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMITTED VIEW (read-only with edit button)
  // ─────────────────────────────────────────────────────────────────────────────
  const sent  = SENTIMENTS.find(s => s.value === report.sentiment) || SENTIMENTS[1];
  const badge = { Pending: 'bg-amber-100 text-amber-700', Approved: 'bg-emerald-100 text-emerald-700', Flagged: 'bg-red-100 text-red-700' };

  const doneT   = report.tasks?.filter(t => t.status === 'Done').length || 0;
  const wipT    = report.tasks?.filter(t => t.status === 'In Progress').length || 0;
  const blkT    = report.tasks?.filter(t => t.status === 'Blocked').length || 0;
  const total   = report.tasks?.length || 0;
  const donePct = total > 0 ? Math.round(doneT / total * 100) : 0;

  const TABS = [
    { key: 'All',         label: 'All',      count: total },
    { key: 'Done',        label: '✅ Done',   count: doneT },
    { key: 'In Progress', label: '🔄 WIP',    count: wipT  },
    { key: 'Blocked',     label: '🚫 Blocked',count: blkT  },
  ].filter(t => t.key === 'All' || t.count > 0);

  const filteredTasks = tab === 'All' ? report.tasks : report.tasks?.filter(t => t.status === tab);

  return (
    <div className="space-y-4 pb-6">

      {/* Status banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">Report submitted</p>
          <p className="text-xs text-emerald-500">{report.date}</p>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 ${badge[report.status]}`}>
          {report.status}
        </span>
      </div>

      {/* Summary strip */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{sent.emoji}</span>
            <p className="text-sm font-bold text-slate-800">{sent.label} day</p>
            {report.hoursWorked > 0 && (
              <span className="text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{report.hoursWorked}h</span>
            )}
          </div>
          {/* Edit button */}
          {report.status !== 'Approved' && (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit / Add Tasks
            </button>
          )}
        </div>

        {/* Task progress bar */}
        {total > 0 && (
          <>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>{doneT} of {total} tasks done</span>
              <span className="font-bold text-emerald-600">{donePct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${donePct}%` }} />
            </div>

            {/* Stat pills */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {doneT > 0 && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg">✅ {doneT} Done</span>}
              {wipT  > 0 && <span className="text-[10px] font-bold bg-blue-50   text-blue-700   px-2 py-0.5 rounded-lg">🔄 {wipT} WIP</span>}
              {blkT  > 0 && <span className="text-[10px] font-bold bg-red-50    text-red-700    px-2 py-0.5 rounded-lg">🚫 {blkT} Blocked</span>}
            </div>
          </>
        )}
      </div>

      {/* Tasks with filter tabs */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Filter tabs */}
          {TABS.length > 1 && (
            <div className="flex border-b border-slate-100">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                    tab === t.key ? 'text-blue-950 border-b-2 border-blue-950' : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  {t.label} <span className="ml-0.5 opacity-60">({t.count})</span>
                </button>
              ))}
            </div>
          )}

          <div className="p-3 space-y-2">
            {filteredTasks?.length > 0
              ? filteredTasks.map((t, i) => <TaskChip key={i} task={t} />)
              : <p className="text-center text-slate-400 text-sm py-4">No tasks in this category</p>
            }
          </div>
        </div>
      )}

      {/* Highlights / Blockers / Plan */}
      {(report.highlights || report.blockers || report.tomorrowPlan?.length > 0) && (
        <div className="space-y-2">
          {report.highlights && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">🏆 Highlights</p>
              <p className="text-sm text-slate-700 leading-relaxed">{report.highlights}</p>
            </div>
          )}
          {report.blockers && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">🚧 Blockers</p>
              <p className="text-sm text-slate-700 leading-relaxed">{report.blockers}</p>
            </div>
          )}
          {report.tomorrowPlan?.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">📋 Tomorrow's Plan</p>
              <div className="space-y-1.5">
                {report.tomorrowPlan.map((p, i) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-blue-400 font-bold shrink-0">→</span><span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manager note */}
      {report.managerComment && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Manager's Note</p>
          <p className="text-sm text-slate-700 italic leading-relaxed">"{report.managerComment}"</p>
          {report.reviewedBy && <p className="text-[10px] text-slate-400 mt-1">— {report.reviewedBy}</p>}
        </div>
      )}

      {/* Bottom edit button */}
      {report.status !== 'Approved' && (
        <button onClick={startEdit}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 font-bold py-3.5 rounded-2xl text-sm transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add More Tasks / Edit Report
        </button>
      )}
    </div>
  );
}
