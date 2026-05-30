import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AssignTaskModal from '../shared/AssignTaskModal';

const CATS = [
  { key:'Ads',            icon:'📢', color:'bg-violet-500', light:'bg-violet-50 text-violet-700'  },
  { key:'Video Editing',  icon:'🎬', color:'bg-pink-500',   light:'bg-pink-50 text-pink-700'      },
  { key:'Graphic Design', icon:'🎨', color:'bg-orange-500', light:'bg-orange-50 text-orange-700'  },
  { key:'Social Media',   icon:'📱', color:'bg-cyan-500',   light:'bg-cyan-50 text-cyan-700'      },
  { key:'Shoot',          icon:'📸', color:'bg-emerald-500',light:'bg-emerald-50 text-emerald-700'},
  { key:'Content Writing',icon:'✍️', color:'bg-amber-500',  light:'bg-amber-50 text-amber-700'   },
  { key:'Operations',     icon:'⚙️', color:'bg-slate-500',  light:'bg-slate-100 text-slate-700'  },
  { key:'General',        icon:'📋', color:'bg-blue-500',   light:'bg-blue-50 text-blue-700'     },
];
const getCat = k => CATS.find(c=>c.key===k) || CATS[CATS.length-1];
const PRIO = { Urgent:'bg-red-100 text-red-700', High:'bg-orange-100 text-orange-700', Medium:'bg-amber-100 text-amber-700', Low:'bg-slate-100 text-slate-600' };
const STATUS_ORDER = ['To Do','In Progress','Review','Done'];
const STATUS_CFG = {
  'To Do':       {bg:'bg-slate-100',   text:'text-slate-600',   dot:'bg-slate-400'  },
  'In Progress': {bg:'bg-blue-100',    text:'text-blue-700',    dot:'bg-blue-500'   },
  'Review':      {bg:'bg-amber-100',   text:'text-amber-700',   dot:'bg-amber-500'  },
  'Done':        {bg:'bg-emerald-100', text:'text-emerald-700', dot:'bg-emerald-500'},
};
const ini = n => n?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)||'?';

// ── Assign Task Modal ─────────────────────────────────────────────────────────
function AssignModal({ onClose, onCreated }) {
  const [directory, setDirectory] = useState([]);
  const [form, setForm] = useState({
    title:'', description:'', assignedToId:'', assignedToName:'',
    category:'General', priority:'Medium', dueDate:'', notes:'', client:'', campaign:'',
  });
  const [saving, setSaving] = useState(false);
  const s = f => setForm(p=>({...p,...f}));

  useEffect(() => {
    api.get('/staff/directory').then(({data}) => { if(data.success) setDirectory(data.staff); }).catch(()=>{});
  }, []);

  const submit = async () => {
    if (!form.title.trim())  { toast.error('Title required'); return; }
    if (!form.assignedToId)  { toast.error('Select who to assign'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/tasks', form);
      if (data.success) { toast.success('Task assigned!'); onCreated(data.task); onClose(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-3 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-black text-slate-900">Assign Task</p>
            <p className="text-xs text-slate-400">Delegate to a teammate</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input value={form.title} onChange={e=>s({title:e.target.value})}
              placeholder="What needs to be done?" className="input-field" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Client</label>
              <input value={form.client} onChange={e=>s({client:e.target.value})}
                placeholder="Client name" className="input-field" />
            </div>
            <div>
              <label className="label">Campaign</label>
              <input value={form.campaign} onChange={e=>s({campaign:e.target.value})}
                placeholder="Campaign name" className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Assign To *</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
              {directory.map(p => (
                <button key={p._id} type="button"
                  onClick={() => s({assignedToId:p._id, assignedToName:p.name})}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 text-left transition-all ${
                    form.assignedToId===p._id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                  }`}>
                  <div className="w-7 h-7 rounded-lg bg-blue-950 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                    {ini(p.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{p.designation}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Work Type</label>
            <div className="grid grid-cols-4 gap-1">
              {CATS.map(c => (
                <button key={c.key} type="button" onClick={() => s({category:c.key})}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border-2 text-[9px] font-black transition-all ${
                    form.category===c.key ? `border-blue-400 ${c.light}` : 'border-slate-100 text-slate-400'
                  }`}>
                  <span className="text-base">{c.icon}</span>
                  <span className="text-center leading-tight px-0.5">{c.key.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e=>s({priority:e.target.value})} className="input-field">
                <option>Urgent</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.dueDate} min={new Date().toISOString().slice(0,10)}
                onChange={e=>s({dueDate:e.target.value})} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e=>s({notes:e.target.value})}
              rows={2} placeholder="Any reference links or extra info..." className="input-field resize-none" />
          </div>

          <button onClick={submit} disabled={saving} className="w-full btn-primary py-3.5 text-sm">
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Assigning…</> : '🚀 Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Item ─────────────────────────────────────────────────────────────────
function TaskItem({ task, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const cat = getCat(task.category);
  const st  = STATUS_CFG[task.status] || STATUS_CFG['To Do'];
  const overdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0,10) && task.status !== 'Done';
  const idx = STATUS_ORDER.indexOf(task.status);

  const move = async (status) => {
    setUpdating(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/status`, { status });
      if (data.success) { onUpdate(data.task); toast.success(`→ ${status}`); }
    } catch { toast.error('Failed'); }
    setUpdating(false);
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
      overdue ? 'border-red-200' : task.status === 'Done' ? 'border-emerald-200 opacity-75' : 'border-slate-100'
    }`}>
      <div className={`h-1 ${cat.color}`} />
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cat.light}`}>{cat.icon} {task.category}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIO[task.priority]}`}>{task.priority}</span>
              {overdue && <span className="text-[10px] font-black text-red-600">⚠ Overdue</span>}
            </div>
            <p className={`font-black text-sm leading-snug ${task.status==='Done'?'line-through text-slate-400':'text-slate-900'}`}>
              {task.title}
            </p>
            {(task.client || task.campaign) && (
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {task.client   && <span className="text-[9px] font-bold bg-blue-950 text-white px-1.5 py-0.5 rounded-full">🏢 {task.client}</span>}
                {task.campaign && <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">📌 {task.campaign}</span>}
              </div>
            )}
          </div>
          {task.dueDate && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg shrink-0 ${overdue?'bg-red-50 text-red-600':'bg-slate-50 text-slate-500'}`}>
              📅 {task.dueDate}
            </span>
          )}
        </div>

        {task.description && <p className="text-xs text-slate-500 mb-2 leading-relaxed">{task.description}</p>}
        {task.notes && <p className="text-xs text-slate-400 mb-2 italic">📎 {task.notes}</p>}

        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>{task.status}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold">from {task.assignedBy?.userName}</span>
        </div>

        {task.status !== 'Done' ? (
          <div className="flex gap-2">
            <button onClick={() => move(STATUS_ORDER[idx+1])} disabled={updating}
              className="flex-1 bg-blue-950 hover:bg-blue-900 text-white font-black text-xs py-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-50">
              {updating ? '…' : idx===0 ? '▶ Start Task' : idx===1 ? '✓ Send for Review' : '✅ Mark Done'}
            </button>
            {idx > 0 && (
              <button onClick={() => move(STATUS_ORDER[idx-1])} disabled={updating}
                className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">← Back</button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
            <span className="text-lg">✅</span>
            <p className="text-xs font-black text-emerald-700">Completed!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyTasks() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('Active');
  const [modal,   setModal]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks?mine=true');
      if (data.success) setTasks(data.tasks);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onUpdate  = (t) => setTasks(p => p.map(x => x._id===t._id ? t : x));
  const onCreated = (t) => setTasks(p => [t, ...p]);

  const myActive   = tasks.filter(t => t.status !== 'Done');
  const myDone     = tasks.filter(t => t.status === 'Done');
  const overdue    = myActive.filter(t => t.dueDate && t.dueDate < new Date().toISOString().slice(0,10));
  const displayed  = tab === 'Active' ? myActive : myDone;

  return (
    <div className="space-y-4 animate-slide-up pb-6">
      {modal && <AssignTaskModal onClose={() => setModal(false)} onCreated={onCreated} />}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-blue-950 text-white px-5 py-5">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">My Tasks</p>
          <p className="text-2xl font-black mt-0.5">{myActive.length} active tasks</p>
          <div className="flex gap-5 mt-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-xl font-black text-blue-300 tabular-nums">{tasks.filter(t=>t.status==='In Progress').length}</p>
              <p className="text-[10px] text-blue-400">In Progress</p>
            </div>
            <div>
              <p className="text-xl font-black text-emerald-300 tabular-nums">{myDone.length}</p>
              <p className="text-[10px] text-blue-400">Completed</p>
            </div>
            {overdue.length > 0 && (
              <div>
                <p className="text-xl font-black text-red-300 tabular-nums">{overdue.length}</p>
                <p className="text-[10px] text-blue-400">Overdue</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign button */}
      <button onClick={() => setModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-dashed border-blue-200 rounded-2xl text-sm font-black text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all active:scale-[0.98]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Assign Task to Teammate
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {[{key:'Active',label:`Active (${myActive.length})`},{key:'Done',label:`Done (${myDone.length})`}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              tab===t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        [1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"/>)
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">{tab==='Active'?'🎉':'📋'}</p>
          <p className="font-black text-slate-700">{tab==='Active'?'All caught up!':'No completed tasks'}</p>
          <p className="text-sm text-slate-400 mt-1">{tab==='Active'?'No active tasks assigned to you.':'Complete tasks to see them here.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(t => <TaskItem key={t._id} task={t} onUpdate={onUpdate} />)}
        </div>
      )}
    </div>
  );
}
