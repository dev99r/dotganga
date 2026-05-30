import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CATS = [
  { key:'Ads',            icon:'📢', grad:'from-violet-500 to-purple-600', light:'bg-violet-50 text-violet-700 border-violet-200'  },
  { key:'Video Editing',  icon:'🎬', grad:'from-pink-500 to-rose-600',     light:'bg-pink-50 text-pink-700 border-pink-200'        },
  { key:'Graphic Design', icon:'🎨', grad:'from-orange-400 to-red-500',    light:'bg-orange-50 text-orange-700 border-orange-200'  },
  { key:'Social Media',   icon:'📱', grad:'from-cyan-500 to-blue-500',     light:'bg-cyan-50 text-cyan-700 border-cyan-200'        },
  { key:'Shoot',          icon:'📸', grad:'from-emerald-500 to-teal-600',  light:'bg-emerald-50 text-emerald-700 border-emerald-200'},
  { key:'Content Writing',icon:'✍️', grad:'from-amber-400 to-orange-500',  light:'bg-amber-50 text-amber-700 border-amber-200'    },
  { key:'Operations',     icon:'⚙️', grad:'from-slate-500 to-slate-700',   light:'bg-slate-100 text-slate-700 border-slate-200'   },
  { key:'General',        icon:'📋', grad:'from-blue-500 to-indigo-600',   light:'bg-blue-50 text-blue-700 border-blue-200'       },
];

const PRIORITIES = [
  { key:'Urgent', emoji:'🔴', bg:'bg-red-50 border-red-300 text-red-700',      sel:'bg-red-500 text-white border-red-500'    },
  { key:'High',   emoji:'🟠', bg:'bg-orange-50 border-orange-300 text-orange-700', sel:'bg-orange-500 text-white border-orange-500'},
  { key:'Medium', emoji:'🟡', bg:'bg-amber-50 border-amber-300 text-amber-700', sel:'bg-amber-500 text-white border-amber-500'  },
  { key:'Low',    emoji:'⚪', bg:'bg-slate-50 border-slate-200 text-slate-600', sel:'bg-slate-500 text-white border-slate-500'  },
];

const ini = n => n?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)||'?';

const DEPT_COLORS = {
  Sales:'bg-violet-500', Creative:'bg-pink-500', Marketing:'bg-cyan-500',
  Management:'bg-amber-500', Operations:'bg-emerald-500', Tech:'bg-blue-500',
};
const deptColor = d => DEPT_COLORS[d] || 'bg-slate-500';

export default function AssignTaskModal({ onClose, onCreated }) {
  const scrollRef = useRef(null);
  const [directory, setDirectory] = useState([]);
  const [search, setSearch]       = useState('');
  const [step,   setStep]         = useState(1); // 1=details, 2=assign+category
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    title:'', description:'', assignedToId:'', assignedToName:'',
    category:'General', priority:'Medium', dueDate:'', notes:'', client:'', campaign:'',
  });
  const s = f => setForm(p=>({...p,...f}));

  useEffect(() => {
    api.get('/staff/directory').then(({data})=>{ if(data.success) setDirectory(data.staff); }).catch(()=>{});
    // Scroll to top on open
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [step]);

  const filtered = directory.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async () => {
    if (!form.title.trim())  { toast.error('Give this task a title'); return; }
    if (!form.assignedToId)  { toast.error('Select who to assign this to'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/tasks', form);
      if (data.success) {
        toast.success(`Task assigned to ${form.assignedToName}! 🚀`);
        onCreated(data.task);
        onClose();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign'); }
    setSaving(false);
  };

  const selCat = CATS.find(c=>c.key===form.category);
  const selPri = PRIORITIES.find(p=>p.key===form.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh', height: 'auto' }}>

        {/* ── Sticky Header ── */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
          {/* Drag handle on mobile */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{selCat?.icon}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${selCat?.light}`}>
                  {form.category}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${selPri?.bg}`}>
                  {selPri?.emoji} {form.priority}
                </span>
              </div>
              <p className="font-black text-slate-900 text-lg leading-tight">
                {form.title || 'New Task'}
              </p>
              {form.assignedToId && (
                <p className="text-sm text-slate-500 mt-0.5">→ {form.assignedToName}</p>
              )}
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex gap-1 mt-3 bg-slate-100 rounded-2xl p-1">
            <button onClick={() => setStep(1)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${step===1?'bg-white text-slate-900 shadow-sm':'text-slate-400'}`}>
              1. Task Details
            </button>
            <button onClick={() => setStep(2)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${step===2?'bg-white text-slate-900 shadow-sm':'text-slate-400'}`}>
              2. Assign & Type
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {step === 1 ? (
            <>
              {/* Task Title */}
              <div>
                <label className="label">Task Title *</label>
                <input value={form.title} onChange={e=>s({title:e.target.value})}
                  placeholder="e.g. Design 5 Instagram posts for Diwali campaign"
                  className="input-field text-base font-semibold" autoFocus />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e=>s({description:e.target.value})}
                  rows={3} placeholder="What exactly needs to be done? Include style, format, size..."
                  className="input-field resize-none" />
              </div>

              {/* Client + Campaign */}
              <div>
                <label className="label">Client & Campaign</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🏢</span>
                    <input value={form.client} onChange={e=>s({client:e.target.value})}
                      placeholder="Client name" className="input-field pl-8" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">📌</span>
                    <input value={form.campaign} onChange={e=>s({campaign:e.target.value})}
                      placeholder="Campaign name" className="input-field pl-8" />
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="label">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p.key} type="button" onClick={() => s({priority:p.key})}
                      className={`py-2.5 rounded-2xl border-2 text-xs font-black transition-all active:scale-95 flex flex-col items-center gap-1 ${
                        form.priority===p.key ? p.sel : p.bg
                      }`}>
                      <span className="text-base">{p.emoji}</span>
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date + Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" value={form.dueDate}
                    min={new Date().toISOString().slice(0,10)}
                    onChange={e=>s({dueDate:e.target.value})}
                    className="input-field" />
                </div>
                <div>
                  <label className="label">Notes / Links</label>
                  <input value={form.notes} onChange={e=>s({notes:e.target.value})}
                    placeholder="Reference link..." className="input-field" />
                </div>
              </div>

              <button onClick={() => setStep(2)}
                className="w-full btn-primary py-3.5 text-sm">
                Continue → Assign to Someone
              </button>
            </>
          ) : (
            <>
              {/* Assign To */}
              <div>
                <label className="label">Assign To *</label>
                {/* Search */}
                <div className="relative mb-3">
                  <svg className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search teammate..."
                    className="input-field pl-10" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map(p => (
                    <button key={p._id} type="button"
                      onClick={() => s({assignedToId:p._id, assignedToName:p.name})}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                        form.assignedToId===p._id
                          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}>
                      <div className={`w-9 h-9 rounded-xl ${deptColor(p.department)} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                        {ini(p.name)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${form.assignedToId===p._id?'text-blue-900':'text-slate-800'}`}>{p.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{p.designation}</p>
                      </div>
                      {form.assignedToId===p._id && (
                        <span className="ml-auto text-blue-500 shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Type / Category */}
              <div>
                <label className="label">Work Type / Department</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATS.map(c => (
                    <button key={c.key} type="button" onClick={() => s({category:c.key})}
                      className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 text-[10px] font-black transition-all active:scale-95 overflow-hidden ${
                        form.category===c.key
                          ? `border-transparent text-white`
                          : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                      }`}
                      style={form.category===c.key ? {background:`linear-gradient(135deg, var(--from), var(--to))`} : {}}
                    >
                      {form.category===c.key && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} -z-0`} />
                      )}
                      <span className="text-xl relative z-10">{c.icon}</span>
                      <span className="text-center leading-tight relative z-10">{c.key.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary preview */}
              {form.title && form.assignedToId && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-2">Task Summary</p>
                  <p className="font-black text-slate-900 text-sm">{form.title}</p>
                  <p className="text-xs text-slate-500 mt-1">→ {form.assignedToName} · {form.category} · {form.priority} priority</p>
                  {form.client && <p className="text-xs text-slate-500">🏢 {form.client}{form.campaign?` · 📌 ${form.campaign}`:''}</p>}
                  {form.dueDate && <p className="text-xs text-slate-500">📅 Due {form.dueDate}</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-slate-100">
          {step === 2 ? (
            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="btn-secondary px-5 py-3.5">
                ← Back
              </button>
              <button onClick={submit} disabled={saving || !form.title || !form.assignedToId}
                className="flex-1 btn-primary py-3.5 text-base disabled:opacity-50">
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Assigning…</>
                  : `🚀 Assign to ${form.assignedToName || 'someone'}`
                }
              </button>
            </div>
          ) : (
            <button onClick={() => setStep(2)} disabled={!form.title.trim()}
              className="w-full btn-primary py-3.5 text-base disabled:opacity-50">
              Next → Choose Who
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
