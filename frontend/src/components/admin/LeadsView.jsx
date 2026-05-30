import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ── Config ────────────────────────────────────────────────────────────────────
const PIPELINE = [
  { key:'New',             label:'New',            emoji:'🆕', bg:'bg-blue-50',    border:'border-blue-200',    dot:'bg-blue-500',    text:'text-blue-700',    count:'bg-blue-500'    },
  { key:'Contacted',       label:'Contacted',       emoji:'📞', bg:'bg-violet-50',  border:'border-violet-200',  dot:'bg-violet-500',  text:'text-violet-700',  count:'bg-violet-500'  },
  { key:'Interested',      label:'Interested',      emoji:'🔥', bg:'bg-orange-50',  border:'border-orange-200',  dot:'bg-orange-500',  text:'text-orange-700',  count:'bg-orange-500'  },
  { key:'Demo Scheduled',  label:'Demo',            emoji:'📅', bg:'bg-amber-50',   border:'border-amber-200',   dot:'bg-amber-500',   text:'text-amber-700',   count:'bg-amber-500'   },
  { key:'Proposal Sent',   label:'Proposal',        emoji:'📋', bg:'bg-cyan-50',    border:'border-cyan-200',    dot:'bg-cyan-500',    text:'text-cyan-700',    count:'bg-cyan-500'    },
  { key:'Won',             label:'Won ✓',           emoji:'🏆', bg:'bg-emerald-50', border:'border-emerald-200', dot:'bg-emerald-500', text:'text-emerald-700', count:'bg-emerald-500' },
  { key:'Lost',            label:'Lost',            emoji:'❌', bg:'bg-red-50',     border:'border-red-200',     dot:'bg-red-400',     text:'text-red-700',     count:'bg-red-400'     },
  { key:'Not Interested',  label:'Not Interested',  emoji:'🚫', bg:'bg-slate-50',   border:'border-slate-200',   dot:'bg-slate-400',   text:'text-slate-600',   count:'bg-slate-400'   },
];

const SOURCES = ['Meta Ads','Instagram','Facebook','WhatsApp','Referral','Walk-in','Google','Website','Cold Call','Other'];
const SERVICES = ['Social Media','Meta Ads','Video Editing','Graphic Design','Website','SEO','Shoot','Branding','Other'];

const PRIORITY_CFG = {
  Hot:  { label:'🔥 Hot',  bg:'bg-red-100 text-red-700',    dot:'bg-red-500'    },
  Warm: { label:'🟡 Warm', bg:'bg-amber-100 text-amber-700',dot:'bg-amber-400'  },
  Cold: { label:'🔵 Cold', bg:'bg-blue-100 text-blue-700',  dot:'bg-blue-400'   },
};

const SOURCE_ICONS = {
  'Meta Ads':'🎯','Instagram':'📸','Facebook':'📘','WhatsApp':'💬','Referral':'🤝',
  'Walk-in':'🚶','Google':'🔍','Website':'🌐','Cold Call':'📱','Other':'📌',
};

const getStatus = k => PIPELINE.find(p=>p.key===k) || PIPELINE[0];

// ── Lead Card (pipeline view) ──────────────────────────────────────────────────
function LeadCard({ lead, onStatusChange, onSelect }) {
  const st   = getStatus(lead.status);
  const pCfg = PRIORITY_CFG[lead.priority] || PRIORITY_CFG.Warm;
  const today = new Date().toISOString().slice(0,10);
  const overdue = lead.followUpDate && lead.followUpDate < today && !['Won','Lost','Not Interested'].includes(lead.status);
  const dueToday = lead.followUpDate === today;

  return (
    <div onClick={() => onSelect(lead)}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
        overdue ? 'border-red-300 shadow-red-100/50' : 'border-slate-200 hover:border-slate-300'
      }`}>
      {/* Priority bar */}
      <div className={`h-1 rounded-t-2xl ${
        lead.priority==='Hot' ? 'bg-gradient-to-r from-red-500 to-orange-400' :
        lead.priority==='Warm'? 'bg-gradient-to-r from-amber-400 to-yellow-300' :
                                'bg-gradient-to-r from-blue-400 to-cyan-400'
      }`} />

      <div className="p-3.5">
        {/* Row 1: Name + Priority */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-black text-slate-900 text-sm truncate">{lead.name}</p>
            {lead.company && <p className="text-[10px] text-slate-400 truncate">🏢 {lead.company}</p>}
          </div>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${pCfg.bg}`}>
            {pCfg.label}
          </span>
        </div>

        {/* Contact info */}
        <div className="space-y-1 mb-2.5">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} onClick={e=>e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors">
              <span className="text-base">📞</span> {lead.phone}
            </a>
          )}
          {lead.email && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <span className="text-base">✉️</span> {lead.email}
            </p>
          )}
        </div>

        {/* Source + Service */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {SOURCE_ICONS[lead.source]} {lead.source}
          </span>
          {lead.service && (
            <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {lead.service}
            </span>
          )}
          {lead.budget && (
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              ₹{lead.budget}
            </span>
          )}
        </div>

        {/* Follow-up */}
        {lead.followUpDate && (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl mb-2 ${
            overdue  ? 'bg-red-50 text-red-600'   :
            dueToday ? 'bg-amber-50 text-amber-700' :
                       'bg-slate-50 text-slate-500'
          }`}>
            {overdue ? '⚠️ Overdue:' : dueToday ? '🔔 Today:' : '📅 Follow up:'}
            <span className="font-black ml-1">{lead.followUpDate}</span>
          </div>
        )}

        {/* Assigned + notes count */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {lead.assignedTo?.userName ? (
              <span className="text-[10px] text-slate-500 font-semibold">
                👤 {lead.assignedTo.userName.split(' ')[0]}
              </span>
            ) : (
              <span className="text-[10px] text-slate-300">Unassigned</span>
            )}
          </div>
          {lead.notes?.length > 0 && (
            <span className="text-[9px] text-slate-400 font-bold">
              💬 {lead.notes.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lead Detail Drawer ────────────────────────────────────────────────────────
function LeadDrawer({ lead, staff, onClose, onUpdate, onDelete }) {
  const [note,      setNote]      = useState('');
  const [followUp,  setFollowUp]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [editForm,  setEditForm]  = useState({ ...lead });
  const st = getStatus(lead.status);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/leads/${lead._id}/note`, { text: note, followUpDate: followUp || undefined });
      if (data.success) { onUpdate(data.lead); setNote(''); setFollowUp(''); toast.success('Note added!'); }
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const changeStatus = async (status) => {
    try {
      const { data } = await api.patch(`/leads/${lead._id}/status`, { status });
      if (data.success) { onUpdate(data.lead); toast.success(`Moved to ${status}`); }
    } catch { toast.error('Failed'); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/leads/${lead._id}`, editForm);
      if (data.success) { onUpdate(data.lead); setEditing(false); toast.success('Lead updated!'); }
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm(`Delete lead "${lead.name}"?`)) return;
    try { await api.delete(`/leads/${lead._id}`); onDelete(lead._id); onClose(); toast.success('Lead deleted'); }
    catch { toast.error('Failed'); }
  };

  const ef = f => setEditForm(p => ({...p, ...f}));

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-left">

        {/* Header */}
        <div className={`${st.bg} border-b ${st.border} px-5 py-4 shrink-0`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{st.emoji}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${st.bg} ${st.text} border ${st.border}`}>
                  {lead.status}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${PRIORITY_CFG[lead.priority]?.bg}`}>
                  {PRIORITY_CFG[lead.priority]?.label}
                </span>
              </div>
              <h2 className="font-black text-slate-900 text-xl leading-tight truncate">{lead.name}</h2>
              {lead.company && <p className="text-sm text-slate-500 mt-0.5">🏢 {lead.company}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setEditing(e=>!e)}
                className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={del}
                className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick contact */}
          <div className="flex gap-2 mt-3">
            {lead.phone && (
              <a href={`tel:${lead.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-950 text-white py-2.5 rounded-xl text-sm font-black hover:bg-blue-900 transition-colors">
                📞 Call
              </a>
            )}
            {lead.phone && (
              <a href={`https://wa.me/91${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-black hover:bg-emerald-500 transition-colors">
                💬 WhatsApp
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors">
                ✉️ Email
              </a>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Edit form */}
          {editing && (
            <div className="p-5 border-b border-slate-100 space-y-3 bg-blue-50/30">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Edit Lead</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Name</label>
                  <input value={editForm.name} onChange={e=>ef({name:e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={editForm.phone} onChange={e=>ef({phone:e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={editForm.email} onChange={e=>ef({email:e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input value={editForm.company} onChange={e=>ef({company:e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="label">Budget (₹)</label>
                  <input value={editForm.budget} onChange={e=>ef({budget:e.target.value})} placeholder="e.g. 15000" className="input-field" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input value={editForm.location} onChange={e=>ef({location:e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="label">Source</label>
                  <select value={editForm.source} onChange={e=>ef({source:e.target.value})} className="input-field">
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Service</label>
                  <select value={editForm.service} onChange={e=>ef({service:e.target.value})} className="input-field">
                    {SERVICES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select value={editForm.priority} onChange={e=>ef({priority:e.target.value})} className="input-field">
                    <option>Hot</option><option>Warm</option><option>Cold</option>
                  </select>
                </div>
                <div>
                  <label className="label">Assign To</label>
                  <select value={editForm.assignedTo?.userId || ''} onChange={e => {
                    const s = staff.find(x=>x._id===e.target.value);
                    ef({ assignedTo: s ? { userId: s._id, userName: s.name } : null });
                  }} className="input-field">
                    <option value="">Unassigned</option>
                    {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[...PIPELINE].slice(0,6).map(p => (
                  <button key={p.key} type="button" onClick={() => ef({status:p.key})}
                    className={`py-2 rounded-xl text-xs font-black border-2 transition-all ${
                      editForm.status===p.key ? `${p.bg} ${p.text} ${p.border}` : 'border-slate-100 text-slate-400 hover:border-slate-300'
                    }`}>
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 btn-primary py-2.5">
                  {saving ? 'Saving…' : '💾 Save Changes'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary py-2.5">Cancel</button>
              </div>
            </div>
          )}

          {/* Pipeline stage mover */}
          {!editing && (
            <div className="p-4 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Move Stage</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {PIPELINE.map(p => (
                  <button key={p.key} onClick={() => changeStatus(p.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                      lead.status===p.key
                        ? `${p.bg} ${p.text} ${p.border} shadow-sm`
                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}>
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lead info */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Lead Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label:'Source',   value:`${SOURCE_ICONS[lead.source]} ${lead.source}` },
                { label:'Service',  value:lead.service },
                { label:'Budget',   value:lead.budget ? `₹${lead.budget}` : '—' },
                { label:'Location', value:lead.location || '—' },
                { label:'Assigned', value:lead.assignedTo?.userName || 'Unassigned' },
                { label:'Follow Up',value:lead.followUpDate || '—' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            {(lead.adCampaign || lead.adSet) && (
              <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-1.5">📢 Meta Ads Info</p>
                {lead.adCampaign && <p className="text-xs text-slate-700"><b>Campaign:</b> {lead.adCampaign}</p>}
                {lead.adSet      && <p className="text-xs text-slate-700"><b>Ad Set:</b> {lead.adSet}</p>}
                {lead.adName     && <p className="text-xs text-slate-700"><b>Ad:</b> {lead.adName}</p>}
              </div>
            )}
          </div>

          {/* Add note */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Add Note / Follow-Up</p>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
              placeholder="Write call summary, meeting notes, next steps..."
              className="input-field resize-none mb-2" />
            <div className="flex items-center gap-2">
              <input type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)}
                min={new Date().toISOString().slice(0,10)}
                className="input-field flex-1 text-xs" />
              <button onClick={addNote} disabled={saving || !note.trim()}
                className="btn-primary px-4 py-2.5 text-xs disabled:opacity-40">
                {saving ? '…' : '+ Add Note'}
              </button>
            </div>
          </div>

          {/* Notes timeline */}
          {lead.notes?.length > 0 && (
            <div className="p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                Activity Timeline ({lead.notes.length})
              </p>
              <div className="space-y-3">
                {lead.notes.map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {i < lead.notes.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-slate-800 leading-relaxed">{n.text}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {n.addedBy} · {n.addedAt ? new Date(n.addedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Lead Modal ────────────────────────────────────────────────────────────
function AddLeadModal({ staff, onClose, onCreated }) {
  const [form, setForm] = useState({
    name:'', phone:'', email:'', company:'', source:'Meta Ads', service:'Social Media',
    status:'New', priority:'Warm', budget:'', location:'', followUpDate:'',
    adCampaign:'', adSet:'', adName:'', assignedToId:'', assignedToName:'',
  });
  const [saving, setSaving] = useState(false);
  const f = u => setForm(p=>({...p,...u}));

  const submit = async () => {
    if (!form.name.trim() && !form.phone.trim()) { toast.error('Enter name or phone'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.assignedToId) payload.assignedTo = { userId: form.assignedToId, userName: form.assignedToName };
      const { data } = await api.post('/leads', payload);
      if (data.success) { toast.success('Lead added! 🎉'); onCreated(data.lead); onClose(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight:'92vh' }}>
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-black text-slate-900 text-lg">Add New Lead</p>
            <p className="text-xs text-slate-400 mt-0.5">Add manually or import Excel below</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input value={form.name} onChange={e=>f({name:e.target.value})} placeholder="Lead name" className="input-field" autoFocus />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input value={form.phone} onChange={e=>f({phone:e.target.value})} placeholder="9876543210" className="input-field" type="tel" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={e=>f({email:e.target.value})} placeholder="email@gmail.com" className="input-field" />
            </div>
            <div>
              <label className="label">Company / Business</label>
              <input value={form.company} onChange={e=>f({company:e.target.value})} placeholder="Business name" className="input-field" />
            </div>
          </div>

          {/* Source + Service + Priority */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Source</label>
              <select value={form.source} onChange={e=>f({source:e.target.value})} className="input-field">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Service</label>
              <select value={form.service} onChange={e=>f({service:e.target.value})} className="input-field">
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e=>f({priority:e.target.value})} className="input-field">
                <option>Hot</option><option>Warm</option><option>Cold</option>
              </select>
            </div>
          </div>

          {/* Budget + Location + Follow-up */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Budget (₹)</label>
              <input value={form.budget} onChange={e=>f({budget:e.target.value})} placeholder="15000" className="input-field" />
            </div>
            <div>
              <label className="label">Location</label>
              <input value={form.location} onChange={e=>f({location:e.target.value})} placeholder="City" className="input-field" />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" value={form.followUpDate} min={new Date().toISOString().slice(0,10)}
                onChange={e=>f({followUpDate:e.target.value})} className="input-field" />
            </div>
          </div>

          {/* Assign + Meta */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Assign To</label>
              <select value={form.assignedToId} onChange={e => {
                const s = staff.find(x=>x._id===e.target.value);
                f({ assignedToId: e.target.value, assignedToName: s?.name || '' });
              }} className="input-field">
                <option value="">Unassigned</option>
                {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Meta Campaign</label>
              <input value={form.adCampaign} onChange={e=>f({adCampaign:e.target.value})} placeholder="Campaign name" className="input-field" />
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-slate-100">
          <button onClick={submit} disabled={saving} className="w-full btn-primary py-3.5 text-base">
            {saving ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : '🎯 Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }) {
  const fileRef   = useRef(null);
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);

  const doImport = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const { data } = await api.post('/leads/import', { fileData: base64 });
        if (data.success) {
          toast.success(data.message || `${data.imported} leads imported!`);
          onImported();
          onClose();
        } else {
          toast.error(data.message || 'Import failed');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-black text-slate-900 text-lg">Import Leads from Excel</p>
            <p className="text-xs text-slate-400 mt-0.5">Meta Ads / Facebook Leads format supported</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'
            }`}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <>
                <p className="text-3xl mb-2">✅</p>
                <p className="font-black text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-600 mt-1">{(file.size/1024).toFixed(1)} KB — ready to import</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-2">📊</p>
                <p className="font-black text-slate-700">Drop Excel file here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse · .xlsx .xls .csv supported</p>
              </>
            )}
          </div>

          {/* Format guide */}
          <div className="bg-blue-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2">Required Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {['Name','Phone','Email','Company','Campaign Name','Ad Set Name'].map(c => (
                <span key={c} className="text-[10px] bg-white text-blue-700 font-bold px-2 py-0.5 rounded-lg border border-blue-200">{c}</span>
              ))}
            </div>
            <p className="text-[10px] text-blue-500 mt-2">✓ Meta Ads lead export format auto-detected</p>
          </div>

          <button onClick={doImport} disabled={!file || loading}
            className="w-full btn-primary py-3.5 text-base disabled:opacity-50">
            {loading ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing…</> : '📥 Import Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main LeadsView ────────────────────────────────────────────────────────────
export default function LeadsView() {
  const [leads,    setLeads]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal,    setModal]    = useState(null); // 'add' | 'import'
  const [filter,   setFilter]   = useState({ status:'', source:'', priority:'', search:'' });
  const [view,     setView]     = useState('pipeline'); // pipeline | table

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status)   params.set('status',   filter.status);
      if (filter.source)   params.set('source',   filter.source);
      if (filter.priority) params.set('priority', filter.priority);
      if (filter.search)   params.set('search',   filter.search);
      const [lr, sr] = await Promise.all([
        api.get(`/leads?${params}`),
        api.get('/staff/directory'),
      ]);
      if (lr.data.success) { setLeads(lr.data.leads); setStats(lr.data.stats); }
      if (sr.data.success) setStaff(sr.data.staff);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const onUpdate = (updated) => {
    setLeads(p => p.map(l => l._id===updated._id ? updated : l));
    setSelected(updated);
  };
  const onDelete  = id => { setLeads(p=>p.filter(l=>l._id!==id)); setSelected(null); };
  const onCreated = l  => setLeads(p => [l,...p]);

  const exportLeads = async () => {
    try {
      const res = await api.get('/leads/export', { responseType:'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a'); a.href=url;
      a.download=`leads-${new Date().toISOString().slice(0,10)}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Leads exported!');
    } catch { toast.error('Export failed'); }
  };

  const today = new Date().toISOString().slice(0,10);

  return (
    <div className="h-full flex flex-col animate-fade-in">

      {/* ══ TOP HEADER ══ */}
      <div className="bg-blue-950 text-white shrink-0">
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Meta Ads CRM</p>
            <h1 className="text-xl font-black">Leads Management</h1>
            <p className="text-blue-300 text-sm mt-0.5">DotGanga · Digital Marketing Agency</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setModal('import')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all">
              📥 Import Excel
            </button>
            <button onClick={exportLeads}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all">
              📤 Export
            </button>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 bg-white text-blue-950 font-black px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Lead
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="px-6 pb-4 flex items-center gap-6 overflow-x-auto">
            {[
              { label:'Total',        value:stats.total,          color:'text-white'       },
              { label:'New',          value:stats.new,            color:'text-blue-300'    },
              { label:'Interested',   value:stats.interested,     color:'text-orange-300'  },
              { label:'Won 🏆',       value:stats.won,            color:'text-emerald-300' },
              { label:'Lost',         value:stats.lost,           color:'text-red-300'     },
              { label:'Hot 🔥',       value:stats.hot,            color:'text-orange-200'  },
              { label:'Overdue ⚠',   value:stats.overdue,        color:'text-red-300'     },
              { label:'Conversion',   value:`${stats.conversionRate}%`, color:'text-emerald-300'},
            ].map((s,i) => (
              <div key={s.label} className={`shrink-0 ${i>0?'pl-5 border-l border-white/10':''}`}>
                <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ FILTER BAR ══ */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 flex-wrap shrink-0">
        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={filter.search} onChange={e=>setFilter(p=>({...p,search:e.target.value}))}
            placeholder="Search name, phone, company…"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 w-52 bg-slate-50 focus:bg-white transition-all" />
        </div>

        {/* Filters */}
        <select value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
          <option value="">All Stages</option>
          {PIPELINE.map(p => <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>)}
        </select>

        <select value={filter.source} onChange={e=>setFilter(p=>({...p,source:e.target.value}))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{SOURCE_ICONS[s]} {s}</option>)}
        </select>

        <select value={filter.priority} onChange={e=>setFilter(p=>({...p,priority:e.target.value}))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
          <option value="">All Priority</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">🟡 Warm</option>
          <option value="Cold">🔵 Cold</option>
        </select>

        {(filter.status || filter.source || filter.priority || filter.search) && (
          <button onClick={() => setFilter({status:'',source:'',priority:'',search:''})}
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-xl transition-colors">
            ✕ Clear
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex gap-1 bg-slate-100 rounded-xl p-1">
          <button onClick={() => setView('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view==='pipeline'?'bg-white text-slate-900 shadow-sm':'text-slate-400'}`}>
            📋 Pipeline
          </button>
          <button onClick={() => setView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view==='table'?'bg-white text-slate-900 shadow-sm':'text-slate-400'}`}>
            📊 Table
          </button>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex gap-4 p-6 h-full overflow-x-auto">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-56 shrink-0 space-y-3">
                <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
                {[1,2].map(j => <div key={j} className="h-32 bg-white rounded-2xl shadow-sm animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : view === 'pipeline' ? (

          // ── PIPELINE VIEW ──
          <div className="flex gap-0 h-full overflow-x-auto">
            {PIPELINE.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage.key);
              if (stageLeads.length === 0 && filter.status && filter.status !== stage.key) return null;
              return (
                <div key={stage.key} className={`flex flex-col border-r border-slate-200 last:border-r-0 ${stage.bg} min-w-0`}
                  style={{ minWidth:'220px', flex:'1', maxWidth: '280px' }}>
                  {/* Column header */}
                  <div className={`px-3 py-3 border-b ${stage.border} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage.emoji}</span>
                      <span className={`font-black text-sm ${stage.text}`}>{stage.label}</span>
                    </div>
                    <span className={`${stage.count} text-white text-xs font-black px-2 py-0.5 rounded-full`}>
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {stageLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <p className="text-3xl mb-1">{stage.emoji}</p>
                        <p className="text-xs text-slate-400 font-bold text-center">No leads here</p>
                      </div>
                    ) : stageLeads.map(lead => (
                      <LeadCard key={lead._id} lead={lead}
                        onStatusChange={status => {
                          api.patch(`/leads/${lead._id}/status`, { status })
                            .then(({ data }) => { if(data.success) onUpdate(data.lead); })
                            .catch(() => toast.error('Failed'));
                        }}
                        onSelect={setSelected}
                      />
                    ))}
                  </div>

                  {/* Footer */}
                  <div className={`shrink-0 px-3 py-2 border-t ${stage.border} flex items-center justify-between`}>
                    <span className="text-[10px] font-bold text-slate-400">{stageLeads.length} lead{stageLeads.length!==1?'s':''}</span>
                    {stageLeads.filter(l=>l.priority==='Hot').length > 0 && (
                      <span className="text-[10px] font-black text-red-500">🔥 {stageLeads.filter(l=>l.priority==='Hot').length} hot</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          // ── TABLE VIEW ──
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  {['Name','Phone','Source','Service','Status','Priority','Follow Up','Assigned','Added'].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const st   = getStatus(lead.status);
                  const pCfg = PRIORITY_CFG[lead.priority] || PRIORITY_CFG.Warm;
                  const overdue = lead.followUpDate && lead.followUpDate < today && !['Won','Lost','Not Interested'].includes(lead.status);
                  return (
                    <tr key={lead._id} onClick={() => setSelected(lead)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                      <td className="table-td">
                        <p className="font-bold text-slate-900">{lead.name}</p>
                        {lead.company && <p className="text-xs text-slate-400">{lead.company}</p>}
                      </td>
                      <td className="table-td">
                        <a href={`tel:${lead.phone}`} onClick={e=>e.stopPropagation()}
                          className="text-blue-600 hover:underline font-medium">{lead.phone}</a>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        <span className="text-sm">{SOURCE_ICONS[lead.source]}</span> {lead.source}
                      </td>
                      <td className="table-td">{lead.service}</td>
                      <td className="table-td">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text} border ${st.border}`}>
                          {st.emoji} {lead.status}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pCfg.bg}`}>{pCfg.label}</span>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        {lead.followUpDate ? (
                          <span className={`text-xs font-bold ${overdue?'text-red-600':'text-slate-600'}`}>
                            {overdue?'⚠ ':''}{lead.followUpDate}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-td">{lead.assignedTo?.userName?.split(' ')[0] || '—'}</td>
                      <td className="table-td whitespace-nowrap text-slate-400 text-xs">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <p className="text-4xl mb-3">🎯</p>
                      <p className="font-bold text-slate-600">No leads found</p>
                      <p className="text-sm text-slate-400 mt-1">Import from Excel or add manually</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add'    && <AddLeadModal staff={staff} onClose={() => setModal(null)} onCreated={l => { onCreated(l); setStats(p => p ? ({...p, total:p.total+1, new:p.new+1}) : p); }} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onImported={load} />}
      {selected && <LeadDrawer lead={selected} staff={staff} onClose={() => setSelected(null)} onUpdate={onUpdate} onDelete={onDelete} />}
    </div>
  );
}
