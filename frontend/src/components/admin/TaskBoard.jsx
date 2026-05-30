import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AssignTaskModal from '../shared/AssignTaskModal';

const CATS = [
  { key:'Ads',            icon:'📢', grad:'from-violet-500 to-purple-600', light:'bg-violet-50 text-violet-700', dot:'bg-violet-500' },
  { key:'Video Editing',  icon:'🎬', grad:'from-pink-500 to-rose-600',     light:'bg-pink-50 text-pink-700',     dot:'bg-pink-500'   },
  { key:'Graphic Design', icon:'🎨', grad:'from-orange-400 to-red-500',    light:'bg-orange-50 text-orange-700', dot:'bg-orange-500' },
  { key:'Social Media',   icon:'📱', grad:'from-cyan-500 to-blue-500',     light:'bg-cyan-50 text-cyan-700',     dot:'bg-cyan-500'   },
  { key:'Shoot',          icon:'📸', grad:'from-emerald-500 to-teal-600',  light:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
  { key:'Content Writing',icon:'✍️', grad:'from-amber-400 to-orange-500',  light:'bg-amber-50 text-amber-700',   dot:'bg-amber-500'  },
  { key:'Operations',     icon:'⚙️', grad:'from-slate-500 to-slate-700',   light:'bg-slate-100 text-slate-700',  dot:'bg-slate-500'  },
  { key:'General',        icon:'📋', grad:'from-blue-500 to-indigo-600',   light:'bg-blue-50 text-blue-700',     dot:'bg-blue-500'   },
];
const getCat = k => CATS.find(c=>c.key===k) || CATS[CATS.length-1];

const PRIORITY_CFG = {
  Urgent:{ badge:'bg-red-500 text-white',      ring:'ring-red-300'    },
  High:  { badge:'bg-orange-400 text-white',   ring:'ring-orange-200' },
  Medium:{ badge:'bg-amber-400 text-slate-900',ring:'ring-amber-200'  },
  Low:   { badge:'bg-slate-200 text-slate-600',ring:'ring-slate-100'  },
};

const COLS = [
  { key:'To Do',       label:'To Do',       emoji:'📋', headerBg:'bg-slate-100',   accentBg:'bg-slate-500',    cardBorder:'border-slate-200', colBg:'bg-slate-50/60'   },
  { key:'In Progress', label:'In Progress', emoji:'⚡', headerBg:'bg-blue-100',    accentBg:'bg-blue-600',     cardBorder:'border-blue-200',  colBg:'bg-blue-50/40'    },
  { key:'Review',      label:'Review',      emoji:'👀', headerBg:'bg-amber-100',   accentBg:'bg-amber-500',    cardBorder:'border-amber-200', colBg:'bg-amber-50/40'   },
  { key:'Done',        label:'Done',        emoji:'✅', headerBg:'bg-emerald-100', accentBg:'bg-emerald-600',  cardBorder:'border-emerald-200',colBg:'bg-emerald-50/40' },
];

const ini = n => n?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)||'?';
const DEPT_COLORS = { Sales:'bg-violet-500',Creative:'bg-pink-500',Marketing:'bg-cyan-500',Management:'bg-amber-500',Operations:'bg-emerald-500',Tech:'bg-blue-500' };
const dc = d => DEPT_COLORS[d] || 'bg-slate-500';

// ── Premium Task Card ─────────────────────────────────────────────────────────
function TaskCard({ task, onStatus, onDelete }) {
  const [busy,    setBusy]    = useState(false);
  const [expanded,setExpanded]= useState(false);
  const cat   = getCat(task.category);
  const pCfg  = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;
  const overdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0,10) && task.status !== 'Done';
  const STATUS_ORDER = ['To Do','In Progress','Review','Done'];
  const idx   = STATUS_ORDER.indexOf(task.status);

  const move = async (status) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/status`, { status });
      if (data.success) { onStatus(data.task); toast.success(`Moved to ${status}!`); }
    } catch { toast.error('Failed to update'); }
    setBusy(false);
  };

  const del = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try { await api.delete(`/tasks/${task._id}`); onDelete(task._id); toast.success('Task deleted'); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className={`group bg-white rounded-2xl shadow-sm hover:shadow-lg border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
      overdue ? 'border-red-300 shadow-red-100/50' :
      task.status === 'Done' ? 'border-emerald-200 opacity-70' :
      'border-slate-200 hover:border-slate-300'
    }`} onClick={() => setExpanded(e => !e)}>

      {/* Gradient accent top */}
      <div className={`h-1 rounded-t-2xl bg-gradient-to-r ${cat.grad}`} />

      <div className="p-3.5">
        {/* Row 1: Category + Priority + Menu */}
        <div className="flex items-center justify-between mb-2 gap-1">
          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${cat.light}`}>
            {cat.icon} {task.category}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${pCfg.badge}`}>
              {task.priority}
            </span>
            <button onClick={e=>{e.stopPropagation();del()}}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <p className={`font-black text-sm leading-snug mb-2 ${task.status==='Done'?'line-through text-slate-400':'text-slate-900'}`}>
          {task.title}
        </p>

        {/* Client/Campaign pills */}
        {(task.client || task.campaign) && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {task.client   && <span className="text-[9px] font-black bg-blue-950 text-white px-2 py-0.5 rounded-full">🏢 {task.client}</span>}
            {task.campaign && <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">📌 {task.campaign}</span>}
          </div>
        )}

        {/* Expanded: description + notes */}
        {expanded && (
          <div onClick={e=>e.stopPropagation()} className="mb-2 space-y-1.5 animate-fade-in">
            {task.description && <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">{task.description}</p>}
            {task.notes && <p className="text-xs text-blue-500 bg-blue-50 rounded-xl px-3 py-2">📎 {task.notes}</p>}
          </div>
        )}

        {/* Assignee + Due */}
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${dc(task.department)} flex items-center justify-center text-white text-[9px] font-black shrink-0`}>
            {ini(task.assignedTo?.userName)}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold flex-1 truncate">{task.assignedTo?.userName}</p>
          {task.dueDate && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${overdue?'bg-red-50 text-red-600':'bg-slate-50 text-slate-500'}`}>
              {overdue ? '⚠' : '📅'} {task.dueDate}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100" onClick={e=>e.stopPropagation()}>
          {idx > 0 && (
            <button onClick={() => move(STATUS_ORDER[idx-1])} disabled={busy}
              className="text-[9px] font-black px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
              ← Back
            </button>
          )}
          {idx < 3 && (
            <button onClick={() => move(STATUS_ORDER[idx+1])} disabled={busy}
              className={`flex-1 text-[9px] font-black py-1.5 rounded-xl bg-gradient-to-r ${cat.grad} text-white transition-all hover:opacity-90 active:scale-95`}>
              {busy ? '…' : `→ ${STATUS_ORDER[idx+1]}`}
            </button>
          )}
          {idx === 3 && (
            <div className="flex-1 text-center text-[9px] font-black text-emerald-600">
              ✅ Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Board ────────────────────────────────────────────────────────────────
export default function TaskBoard() {
  const { user }    = useAuth();
  const [tasks,     setTasks]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [modal,     setModal]    = useState(false);
  const [catFilter, setCatFilter]= useState('All');
  const [search,    setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks');
      if (data.success) setTasks(data.tasks);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onStatus  = t  => setTasks(p => p.map(x => x._id===t._id ? t : x));
  const onDelete  = id => setTasks(p => p.filter(x => x._id!==id));
  const onCreated = t  => { setTasks(p => [t,...p]); toast.success('Task assigned! 🎉'); };

  const filtered = tasks
    .filter(t => catFilter==='All' || t.category===catFilter)
    .filter(t => !search || [t.title, t.assignedTo?.userName, t.client, t.campaign]
      .some(v => v?.toLowerCase().includes(search.toLowerCase())));

  const stats = {
    total:   tasks.length,
    todo:    tasks.filter(t=>t.status==='To Do').length,
    doing:   tasks.filter(t=>t.status==='In Progress').length,
    review:  tasks.filter(t=>t.status==='Review').length,
    done:    tasks.filter(t=>t.status==='Done').length,
    overdue: tasks.filter(t=>t.dueDate&&t.dueDate<new Date().toISOString().slice(0,10)&&t.status!=='Done').length,
  };

  const usedCats = CATS.filter(c => tasks.some(t=>t.category===c.key));

  return (
    <div className="flex flex-col bg-slate-50" style={{ height:'calc(100vh - 64px)' }}>

      {/* ══ TOP HEADER ══ */}
      <div className="bg-blue-950 text-white shrink-0">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Task Board</p>
              <h1 className="text-xl font-black leading-tight">Work Assignments</h1>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-2xl px-3 py-1.5">
              <span className="text-blue-300 text-xs">Social Media Agency</span>
              <span className="text-blue-600 mx-1">·</span>
              <span className="text-white text-xs font-bold">DotGanga</span>
            </div>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-white text-blue-950 font-black px-4 py-2.5 rounded-2xl text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-lg shadow-black/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Assign Task
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-6 pb-4 flex items-center gap-6 overflow-x-auto">
          {[
            { label:'Total',      value:stats.total,  color:'text-white'        },
            { label:'To Do',      value:stats.todo,   color:'text-slate-300'    },
            { label:'In Progress',value:stats.doing,  color:'text-blue-300'     },
            { label:'Review',     value:stats.review, color:'text-amber-300'    },
            { label:'Done',       value:stats.done,   color:'text-emerald-300'  },
            ...(stats.overdue > 0 ? [{ label:'Overdue', value:stats.overdue, color:'text-red-300' }] : []),
          ].map((s,i) => (
            <div key={s.label} className={`shrink-0 ${i > 0 ? 'pl-6 border-l border-white/10' : ''}`}>
              <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FILTER BAR ══ */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search tasks, people, clients…"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 w-52 bg-slate-50 focus:bg-white transition-all" />
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto flex-1">
          <button onClick={()=>setCatFilter('All')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 ${
              catFilter==='All' ? 'bg-blue-950 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            🗂 All <span className="opacity-60">({tasks.length})</span>
          </button>
          {usedCats.map(c => {
            const count = tasks.filter(t=>t.category===c.key).length;
            return (
              <button key={c.key} onClick={()=>setCatFilter(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 ${
                  catFilter===c.key
                    ? `bg-gradient-to-r ${c.grad} text-white shadow-md`
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {c.icon} {c.key} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ KANBAN BOARD ══ */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex gap-4 p-6 h-full">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex-1 space-y-3">
                <div className="h-12 rounded-2xl bg-slate-200 animate-pulse" />
                {[1,2].map(j => <div key={j} className="h-32 rounded-2xl bg-white animate-pulse shadow-sm" />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-0 h-full overflow-x-auto">
            {COLS.map((col, ci) => {
              const colTasks = filtered.filter(t => t.status===col.key);
              return (
                <div key={col.key} className={`flex flex-col border-r border-slate-200 last:border-r-0 ${col.colBg}`}
                  style={{ minWidth:'260px', flex:'1' }}>

                  {/* Column header */}
                  <div className={`${col.headerBg} px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{col.emoji}</span>
                      <span className="font-black text-slate-800 text-sm">{col.label}</span>
                    </div>
                    <div className={`${col.accentBg} text-white text-xs font-black px-2.5 py-0.5 rounded-full min-w-[24px] text-center`}>
                      {colTasks.length}
                    </div>
                  </div>

                  {/* Cards area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {colTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 opacity-40">
                        <div className="text-4xl mb-2 opacity-50">
                          {col.emoji}
                        </div>
                        <p className="text-xs font-bold text-slate-400 text-center">
                          {col.key === 'To Do' ? 'Nothing queued' :
                           col.key === 'In Progress' ? 'No active work' :
                           col.key === 'Review' ? 'Nothing to review' : 'Nothing done yet'}
                        </p>
                        {col.key === 'To Do' && (
                          <button onClick={() => setModal(true)}
                            className="mt-3 text-[10px] font-black text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                            + Assign Task
                          </button>
                        )}
                      </div>
                    ) : (
                      colTasks.map(t => (
                        <TaskCard key={t._id} task={t} onStatus={onStatus} onDelete={onDelete} />
                      ))
                    )}
                  </div>

                  {/* Column footer: quick stats */}
                  {colTasks.length > 0 && (
                    <div className="shrink-0 px-4 py-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold">{colTasks.length} task{colTasks.length!==1?'s':''}</span>
                      {col.key === 'Done' && (
                        <span className="text-[10px] text-emerald-600 font-black">✓ All complete</span>
                      )}
                      {col.key === 'In Progress' && colTasks.some(t=>t.dueDate&&t.dueDate<new Date().toISOString().slice(0,10)) && (
                        <span className="text-[10px] text-red-500 font-black">⚠ Overdue</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <AssignTaskModal onClose={() => setModal(false)} onCreated={onCreated} />}
    </div>
  );
}
