import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─── Config ────────────────────────────────────────────────────────────────────
const PIPELINE = [
  { key:'New',            label:'New',           emoji:'🆕', bg:'bg-blue-50',    border:'border-blue-200',    dot:'bg-blue-500',    text:'text-blue-700',    count:'bg-blue-500'    },
  { key:'Contacted',      label:'Contacted',      emoji:'📞', bg:'bg-violet-50',  border:'border-violet-200',  dot:'bg-violet-500',  text:'text-violet-700',  count:'bg-violet-500'  },
  { key:'Interested',     label:'Interested',     emoji:'🔥', bg:'bg-orange-50',  border:'border-orange-200',  dot:'bg-orange-500',  text:'text-orange-700',  count:'bg-orange-500'  },
  { key:'Demo Scheduled', label:'Demo',           emoji:'📅', bg:'bg-amber-50',   border:'border-amber-200',   dot:'bg-amber-500',   text:'text-amber-700',   count:'bg-amber-500'   },
  { key:'Proposal Sent',  label:'Proposal',       emoji:'📋', bg:'bg-cyan-50',    border:'border-cyan-200',    dot:'bg-cyan-500',    text:'text-cyan-700',    count:'bg-cyan-500'    },
  { key:'Won',            label:'Won ✓',          emoji:'🏆', bg:'bg-emerald-50', border:'border-emerald-200', dot:'bg-emerald-500', text:'text-emerald-700', count:'bg-emerald-500' },
  { key:'Lost',           label:'Lost',           emoji:'❌', bg:'bg-red-50',     border:'border-red-200',     dot:'bg-red-400',     text:'text-red-700',     count:'bg-red-400'     },
  { key:'Not Interested', label:'Not Interested', emoji:'🚫', bg:'bg-slate-50',   border:'border-slate-200',   dot:'bg-slate-400',   text:'text-slate-600',   count:'bg-slate-400'   },
];

const SOURCES  = ['Meta Ads','Instagram','Facebook','WhatsApp','Referral','Walk-in','Google','Website','Cold Call','Other'];
const SERVICES = ['Social Media','Meta Ads','Video Editing','Graphic Design','Website','SEO','Shoot','Branding','Other'];

const PRIORITY_CFG = {
  Hot:  { label:'Hot',  bg:'bg-red-100 text-red-700',    bar:'bg-gradient-to-r from-red-500 to-orange-400'    },
  Warm: { label:'Warm', bg:'bg-amber-100 text-amber-700',bar:'bg-gradient-to-r from-amber-400 to-yellow-300'  },
  Cold: { label:'Cold', bg:'bg-blue-100 text-blue-700',  bar:'bg-gradient-to-r from-blue-400 to-cyan-400'     },
};

const SOURCE_ICONS = {
  'Meta Ads':'🎯','Instagram':'📸','Facebook':'📘','WhatsApp':'💬','Referral':'🤝',
  'Walk-in':'🚶','Google':'🔍','Website':'🌐','Cold Call':'📱','Other':'📌',
};

const getStage = k => PIPELINE.find(p => p.key === k) || PIPELINE[0];
const waLink   = phone => phone ? `https://wa.me/91${phone.replace(/\D/g,'')}` : null;
const today    = () => new Date().toISOString().slice(0, 10);

// ─── WhatsApp Import Modal ─────────────────────────────────────────────────────
function WaImportModal({ onClose, onImported }) {
  const [mode, setMode]       = useState('quick');  // quick | bulk | excel
  const [quick, setQuick]     = useState({ name:'', phone:'', message:'' });
  const [bulkText, setBulkText] = useState('');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [quickDone, setQuickDone] = useState(false);
  const fileRef = useRef();

  /* parse bulk numbers */
  const parseBulk = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const named = line.match(/^(.+?)\s*[-:–]\s*(\+?[\d\s]{8,})$/);
      if (named) {
        const phone = named[2].replace(/\s/g, '');
        if (phone.length >= 8) { out.push({ name: named[1].trim(), phone, source:'WhatsApp' }); continue; }
      }
      const raw = line.replace(/[\s\-()]/g,'');
      if (/^\+?\d{8,15}$/.test(raw)) out.push({ name:'WA Lead', phone:line.trim(), source:'WhatsApp' });
    }
    return out;
  };

  const handleBulkPreview = () => {
    const leads = parseBulk();
    if (!leads.length) { toast.error('No valid numbers found. One per line, e.g. "Name - 9876543210"'); return; }
    setPreview(leads);
  };

  const confirmBulk = async () => {
    if (!preview?.length) return;
    setSaving(true);
    try {
      const { data } = await api.post('/leads/bulk', { leads: preview });
      if (data.success) { toast.success(`${data.imported} WhatsApp leads added! 🎉`); onImported(); onClose(); }
    } catch { toast.error('Import failed'); }
    setSaving(false);
  };

  const quickAdd = async e => {
    e.preventDefault();
    if (!quick.name.trim() && !quick.phone.trim()) { toast.error('Enter name or phone'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/leads', { ...quick, source:'WhatsApp', status:'New', priority:'Warm' });
      if (data.success) {
        setQuickDone(true);
        toast.success('WhatsApp lead added!');
        onImported();
        setQuick({ name:'', phone:'', message:'' });
        setTimeout(() => setQuickDone(false), 2500);
      }
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleExcel = async file => {
    if (!file) return;
    setSaving(true);
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = e.target.result.split(',')[1];
        const { data } = await api.post('/leads/import', { fileData: base64 });
        if (data.success) { toast.success(data.message || `${data.imported} leads imported!`); onImported(); onClose(); }
        else toast.error(data.message || 'Import failed');
        setSaving(false);
      };
      reader.readAsDataURL(file);
    } catch { toast.error('Import failed'); setSaving(false); }
  };

  const MODES = [
    { key:'quick', label:'⚡ Quick Add',     desc:'Add one lead instantly' },
    { key:'bulk',  label:'📋 Bulk Numbers',  desc:'Paste a list of numbers' },
    { key:'excel', label:'📊 Excel / Meta',  desc:'Import from file' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight:'92vh' }}>

        {/* Header */}
        <div className="shrink-0 bg-emerald-600 sm:rounded-t-3xl rounded-t-3xl px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="font-black text-white text-lg">WhatsApp Import</p>
                <p className="text-emerald-200 text-xs">Add leads from WhatsApp instantly</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Mode selector */}
          <div className="flex gap-1.5 mt-4 bg-emerald-700/50 rounded-2xl p-1">
            {MODES.map(m => (
              <button key={m.key} onClick={() => { setMode(m.key); setPreview(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${mode === m.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Quick Add ── */}
          {mode === 'quick' && (
            <form onSubmit={quickAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Name</label>
                  <input className="input-field" placeholder="Customer name" value={quick.name} onChange={e => setQuick(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <label className="label">WhatsApp Number *</label>
                  <input className="input-field" placeholder="9876543210" required value={quick.phone} onChange={e => setQuick(p=>({...p,phone:e.target.value}))} type="tel" />
                </div>
              </div>
              <div>
                <label className="label">Message / Interest</label>
                <textarea className="input-field resize-none" rows={2} placeholder="What did they ask about?" value={quick.message} onChange={e => setQuick(p=>({...p,message:e.target.value}))} />
              </div>
              <button type="submit" disabled={saving}
                className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all ${quickDone ? 'bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} disabled:opacity-60`}>
                {quickDone ? '✓ Lead Added! Add another?' : saving ? 'Adding…' : '+ Add WhatsApp Lead'}
              </button>
              <p className="text-center text-xs text-slate-400">Lead will be tagged as WhatsApp source · New stage · Warm priority</p>
            </form>
          )}

          {/* ── Bulk Numbers ── */}
          {mode === 'bulk' && (
            <div className="space-y-3">
              {!preview ? (
                <>
                  <div>
                    <label className="label">Paste Phone Numbers</label>
                    <textarea className="input-field resize-none font-mono text-sm leading-relaxed" rows={10}
                      placeholder={"One per line. Formats accepted:\n\n9876543210\n+91 9876543210\nRahul Sharma - 9876543210\nPriya: 9123456789\n+91-8765432109"}
                      value={bulkText} onChange={e => setBulkText(e.target.value)} />
                  </div>
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2">
                    💡 Tip: Copy numbers from your WhatsApp contacts, messages, or any list and paste here
                  </p>
                  <button onClick={handleBulkPreview} disabled={!bulkText.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm disabled:opacity-50">
                    Preview Leads →
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="font-black text-emerald-700">{preview.length} leads ready to import</p>
                    </div>
                    <button onClick={() => setPreview(null)} className="text-xs text-slate-400 hover:text-slate-600">Edit</button>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {preview.map((l, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 text-xs font-black shrink-0">
                            {(l.name?.[0] || '#').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{l.name}</p>
                          </div>
                          <p className="text-sm text-emerald-600 font-mono">{l.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={confirmBulk} disabled={saving}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm disabled:opacity-60">
                    {saving ? 'Importing…' : `💬 Import ${preview.length} WhatsApp Leads`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Excel ── */}
          {mode === 'excel' && (
            <div className="space-y-3">
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl p-10 text-center cursor-pointer transition-all">
                <p className="text-4xl mb-2">📊</p>
                <p className="font-black text-slate-700">Drop Excel / CSV file here</p>
                <p className="text-xs text-slate-400 mt-1">Meta Ads export format auto-detected</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleExcel(e.target.files[0])} />
              </div>
              <div className="bg-blue-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2">Required Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Name','Phone','Email','Campaign Name','Ad Set Name'].map(c => (
                    <span key={c} className="text-[10px] bg-white text-blue-700 font-bold px-2 py-0.5 rounded-lg border border-blue-200">{c}</span>
                  ))}
                </div>
              </div>
              {saving && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold text-slate-600">Importing…</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Lead Modal ────────────────────────────────────────────────────────────
function AddLeadModal({ staff, onClose, onCreated }) {
  const [form, setForm] = useState({
    name:'', phone:'', email:'', company:'', source:'Meta Ads', service:'Social Media',
    status:'New', priority:'Warm', budget:'', location:'', followUpDate:'',
    adCampaign:'', adSet:'', adName:'', assignedToId:'', assignedToName:'',
  });
  const [saving, setSaving] = useState(false);
  const f = u => setForm(p => ({...p,...u}));

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
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input value={form.name} onChange={e=>f({name:e.target.value})} placeholder="Full name" className="input-field" autoFocus /></div>
            <div><label className="label">Phone *</label><input value={form.phone} onChange={e=>f({phone:e.target.value})} placeholder="9876543210" className="input-field" type="tel" /></div>
            <div><label className="label">Email</label><input value={form.email} onChange={e=>f({email:e.target.value})} placeholder="email@gmail.com" className="input-field" /></div>
            <div><label className="label">Company</label><input value={form.company} onChange={e=>f({company:e.target.value})} placeholder="Business name" className="input-field" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Source</label>
              <select value={form.source} onChange={e=>f({source:e.target.value})} className="input-field">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Service</label>
              <select value={form.service} onChange={e=>f({service:e.target.value})} className="input-field">
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select value={form.priority} onChange={e=>f({priority:e.target.value})} className="input-field">
                <option>Hot</option><option>Warm</option><option>Cold</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Budget (₹)</label><input value={form.budget} onChange={e=>f({budget:e.target.value})} placeholder="15000" className="input-field" /></div>
            <div><label className="label">Location</label><input value={form.location} onChange={e=>f({location:e.target.value})} placeholder="City" className="input-field" /></div>
            <div><label className="label">Follow-up</label><input type="date" value={form.followUpDate} min={today()} onChange={e=>f({followUpDate:e.target.value})} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Assign To</label>
              <select value={form.assignedToId} onChange={e => {
                const s = staff.find(x=>x._id===e.target.value);
                f({ assignedToId:e.target.value, assignedToName:s?.name||'' });
              }} className="input-field">
                <option value="">Unassigned</option>
                {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Meta Campaign</label><input value={form.adCampaign} onChange={e=>f({adCampaign:e.target.value})} placeholder="Campaign name" className="input-field" /></div>
          </div>
        </div>
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-slate-100">
          <button onClick={submit} disabled={saving} className="w-full btn-primary py-3.5 text-base">
            {saving ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Adding…</span> : '🎯 Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Card ─────────────────────────────────────────────────────────────────
function LeadCard({ lead, onSelect, onStatusChange }) {
  const st     = getStage(lead.status);
  const pCfg   = PRIORITY_CFG[lead.priority] || PRIORITY_CFG.Warm;
  const t      = today();
  const overdue = lead.followUpDate && lead.followUpDate < t && !['Won','Lost','Not Interested'].includes(lead.status);
  const dueToday = lead.followUpDate === t;
  const wa     = waLink(lead.phone);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${overdue ? 'border-red-300 shadow-red-100/50' : 'border-slate-200 hover:border-slate-300'}`}>
      {/* Priority stripe */}
      <div className={`h-1 rounded-t-2xl ${pCfg.bar}`} />

      <div className="p-3.5">
        {/* Name + Priority */}
        <div className="flex items-start justify-between gap-2 mb-2.5 cursor-pointer" onClick={() => onSelect(lead)}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm shrink-0">
              {lead.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate">{lead.name}</p>
              {lead.company && <p className="text-[10px] text-slate-400 truncate">🏢 {lead.company}</p>}
            </div>
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${pCfg.bg}`}>{pCfg.label}</span>
        </div>

        {/* Phone + quick actions */}
        {lead.phone && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs text-slate-500 font-mono flex-1 truncate">{lead.phone}</span>
            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
              title="Call"
              className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                title="WhatsApp"
                className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Source + service */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {SOURCE_ICONS[lead.source]} {lead.source}
          </span>
          {lead.service && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{lead.service}</span>}
          {lead.budget  && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">₹{lead.budget}</span>}
        </div>

        {/* Follow-up */}
        {lead.followUpDate && (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl mb-2 ${overdue ? 'bg-red-50 text-red-600' : dueToday ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
            {overdue ? '⚠ Overdue:' : dueToday ? '🔔 Today:' : '📅'}
            <span className="font-black ml-1">{lead.followUpDate}</span>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer" onClick={() => onSelect(lead)}>
          <span className="text-[10px] text-slate-400 font-semibold">
            {lead.assignedTo?.userName ? `👤 ${lead.assignedTo.userName.split(' ')[0]}` : 'Unassigned'}
          </span>
          {lead.notes?.length > 0 && <span className="text-[10px] text-slate-400 font-bold">💬 {lead.notes.length}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Lead Drawer ───────────────────────────────────────────────────────────────
function LeadDrawer({ lead, staff, onClose, onUpdate, onDelete }) {
  const [note,    setNote]    = useState('');
  const [followUp,setFollowUp]= useState('');
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm,setEditForm]= useState({ ...lead });
  const st   = getStage(lead.status);
  const pCfg = PRIORITY_CFG[lead.priority] || PRIORITY_CFG.Warm;
  const wa   = waLink(lead.phone);
  const t    = today();
  const overdue = lead.followUpDate && lead.followUpDate < t && !['Won','Lost','Not Interested'].includes(lead.status);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/leads/${lead._id}/note`, { text: note, followUpDate: followUp || undefined });
      if (data.success) { onUpdate(data.lead); setNote(''); setFollowUp(''); toast.success('Note added!'); }
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const changeStatus = async status => {
    try {
      const { data } = await api.patch(`/leads/${lead._id}/status`, { status });
      if (data.success) { onUpdate(data.lead); toast.success(`Moved to ${status}`); }
    } catch { toast.error('Failed'); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/leads/${lead._id}`, editForm);
      if (data.success) { onUpdate(data.lead); setEditing(false); toast.success('Updated!'); }
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm(`Delete "${lead.name}"?`)) return;
    try { await api.delete(`/leads/${lead._id}`); onDelete(lead._id); onClose(); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`${st.bg} border-b ${st.border} px-5 py-4 shrink-0`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-slate-700 text-lg shrink-0">
                {lead.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${st.bg} ${st.text} border ${st.border}`}>{st.emoji} {lead.status}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${pCfg.bg}`}>{pCfg.label}</span>
                </div>
                <h2 className="font-black text-slate-900 text-lg leading-tight truncate">{lead.name}</h2>
                {lead.company && <p className="text-xs text-slate-500">🏢 {lead.company}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditing(e=>!e)} className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button onClick={del} className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-red-400 hover:text-red-600 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-950 text-white py-2.5 rounded-xl text-sm font-black hover:bg-blue-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                Call
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-black hover:bg-emerald-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Email
              </a>
            )}
          </div>

          {/* Overdue banner */}
          {overdue && (
            <div className="mt-2 bg-red-100 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-red-500">⚠</span>
              <p className="text-xs font-black text-red-600">Follow-up overdue since {lead.followUpDate}</p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Edit form */}
          {editing && (
            <div className="p-4 border-b border-slate-100 space-y-3 bg-blue-50/30">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Edit Lead</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Name</label><input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} className="input-field" /></div>
                <div><label className="label">Phone</label><input value={editForm.phone} onChange={e=>setEditForm(p=>({...p,phone:e.target.value}))} className="input-field" /></div>
                <div><label className="label">Email</label><input value={editForm.email} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} className="input-field" /></div>
                <div><label className="label">Budget (₹)</label><input value={editForm.budget} onChange={e=>setEditForm(p=>({...p,budget:e.target.value}))} className="input-field" /></div>
                <div><label className="label">Source</label>
                  <select value={editForm.source} onChange={e=>setEditForm(p=>({...p,source:e.target.value}))} className="input-field">
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">Priority</label>
                  <select value={editForm.priority} onChange={e=>setEditForm(p=>({...p,priority:e.target.value}))} className="input-field">
                    <option>Hot</option><option>Warm</option><option>Cold</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 btn-primary py-2.5">
                  {saving ? 'Saving…' : '💾 Save'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary py-2.5 px-4">Cancel</button>
              </div>
            </div>
          )}

          {/* Stage mover */}
          {!editing && (
            <div className="p-4 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Move Stage</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {PIPELINE.map(p => (
                  <button key={p.key} onClick={() => changeStatus(p.key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all shrink-0 border ${
                      lead.status === p.key ? `${p.bg} ${p.text} ${p.border}` : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}>
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details grid */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Phone',    value: lead.phone   || '—' },
                { label:'Email',    value: lead.email   || '—' },
                { label:'Source',   value: `${SOURCE_ICONS[lead.source]||''} ${lead.source}` },
                { label:'Service',  value: lead.service || '—' },
                { label:'Budget',   value: lead.budget  ? `₹${lead.budget}` : '—' },
                { label:'Location', value: lead.location || '—' },
                { label:'Assigned', value: lead.assignedTo?.userName || 'Unassigned' },
                { label:'Follow Up',value: lead.followUpDate || '—' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{item.label}</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>
            {(lead.adCampaign || lead.adSet) && (
              <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-1.5">📢 Meta Ads</p>
                {lead.adCampaign && <p className="text-xs text-slate-700"><b>Campaign:</b> {lead.adCampaign}</p>}
                {lead.adSet      && <p className="text-xs text-slate-700"><b>Ad Set:</b> {lead.adSet}</p>}
              </div>
            )}
          </div>

          {/* Add note */}
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Add Note / Follow-Up</p>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
              placeholder="Call summary, meeting notes, next steps…"
              className="input-field resize-none mb-2 text-sm" />
            <div className="flex gap-2">
              <input type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)}
                min={today()} className="input-field flex-1 text-xs" placeholder="Follow-up date" />
              <button onClick={addNote} disabled={saving || !note.trim()}
                className="btn-primary px-4 py-2 text-xs disabled:opacity-40">
                {saving ? '…' : '+ Add'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {lead.notes?.length > 0 && (
            <div className="p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                Timeline ({lead.notes.length})
              </p>
              <div className="space-y-3">
                {lead.notes.map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {i < lead.notes.length-1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-slate-800 leading-relaxed">{n.text}</p>
                      {n.followUpDate && <p className="text-[10px] text-orange-600 font-bold mt-0.5">📅 Follow-up: {n.followUpDate}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.addedBy} · {n.addedAt ? new Date(n.addedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</p>
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

// ─── Main LeadsView ────────────────────────────────────────────────────────────
export default function LeadsView() {
  const [leads,    setLeads]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal,    setModal]    = useState(null); // 'add' | 'wa'
  const [filter,   setFilter]   = useState({ status:'', source:'', priority:'', search:'' });
  const [view,     setView]     = useState('pipeline');

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

  const onUpdate  = upd => { setLeads(p => p.map(l => l._id===upd._id ? upd : l)); setSelected(upd); };
  const onDelete  = id  => { setLeads(p => p.filter(l => l._id!==id)); setSelected(null); };
  const onCreated = l   => { setLeads(p => [l,...p]); if (stats) setStats(s => s ? ({...s,total:s.total+1,new:s.new+1}) : s); };

  const exportLeads = async () => {
    try {
      const res = await api.get('/leads/export', { responseType:'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a'); a.href=url;
      a.download=`leads-${today()}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  const t = today();
  const overdueCount = leads.filter(l => l.followUpDate && l.followUpDate < t && !['Won','Lost','Not Interested'].includes(l.status)).length;
  const todayCount   = leads.filter(l => l.followUpDate === t).length;

  return (
    <div className="h-full flex flex-col bg-slate-50">

      {/* ══ HEADER ══ */}
      <div className="bg-blue-950 text-white shrink-0">
        <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">CRM</p>
            <h1 className="text-xl font-black">Leads Management</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp import — primary CTA */}
            <button onClick={() => setModal('wa')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/40">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Import
            </button>
            <button onClick={exportLeads}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2.5 rounded-xl text-sm">
              📤 Export
            </button>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 bg-white text-blue-950 font-black px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Add Lead
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="px-5 pb-4 flex items-center gap-5 overflow-x-auto">
            {[
              { label:'Total',       value:stats.total,                  color:'text-white'       },
              { label:'New',         value:stats.new,                    color:'text-blue-300'    },
              { label:'Interested',  value:stats.interested,             color:'text-orange-300'  },
              { label:'Won 🏆',      value:stats.won,                    color:'text-emerald-300' },
              { label:'Hot 🔥',      value:stats.hot,                    color:'text-orange-200'  },
              { label:'Conversion',  value:`${stats.conversionRate}%`,   color:'text-emerald-300' },
            ].map((s,i) => (
              <div key={s.label} className={`shrink-0 ${i>0?'pl-4 border-l border-white/10':''}`}>
                <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ ALERT BANNERS ══ */}
      {(overdueCount > 0 || todayCount > 0) && (
        <div className="flex gap-2 px-5 py-2.5 bg-white border-b border-slate-200 flex-wrap shrink-0">
          {overdueCount > 0 && (
            <button onClick={() => setFilter(p=>({...p,status:'',source:'',priority:'Hot'}))}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 font-black text-xs px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              ⚠ {overdueCount} overdue follow-up{overdueCount!==1?'s':''}
            </button>
          )}
          {todayCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs px-3 py-1.5 rounded-xl">
              🔔 {todayCount} follow-up{todayCount!==1?'s':''} due today
            </div>
          )}
        </div>
      )}

      {/* ══ FILTER BAR ══ */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 flex-wrap shrink-0">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={filter.search} onChange={e=>setFilter(p=>({...p,search:e.target.value}))}
            placeholder="Search name, phone, company…"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 w-52 bg-slate-50 focus:bg-white" />
        </div>

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
            className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100">
            ✕ Clear
          </button>
        )}

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
          <div className="flex gap-4 p-5 h-full overflow-x-auto">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-56 shrink-0 space-y-3">
                <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
                {[1,2].map(j => <div key={j} className="h-36 bg-white rounded-2xl shadow-sm animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : view === 'pipeline' ? (

          // ── Pipeline ──
          <div className="flex h-full overflow-x-auto">
            {PIPELINE.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage.key);
              if (stageLeads.length === 0 && filter.status && filter.status !== stage.key) return null;
              return (
                <div key={stage.key} className={`flex flex-col border-r border-slate-200 last:border-r-0 ${stage.bg}`}
                  style={{ minWidth:'220px', flex:'1', maxWidth:'280px' }}>
                  <div className={`px-3 py-3 border-b ${stage.border} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{stage.emoji}</span>
                      <span className={`font-black text-sm ${stage.text}`}>{stage.label}</span>
                    </div>
                    <span className={`${stage.count} text-white text-xs font-black px-2 py-0.5 rounded-full`}>{stageLeads.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {stageLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <p className="text-2xl mb-1">{stage.emoji}</p>
                        <p className="text-xs text-slate-400 font-bold">Empty</p>
                      </div>
                    ) : stageLeads.map(lead => (
                      <LeadCard key={lead._id} lead={lead} onSelect={setSelected}
                        onStatusChange={status => {
                          api.patch(`/leads/${lead._id}/status`,{status})
                            .then(({data}) => { if(data.success) onUpdate(data.lead); })
                            .catch(()=>toast.error('Failed'));
                        }}
                      />
                    ))}
                  </div>
                  <div className={`shrink-0 px-3 py-2 border-t ${stage.border} flex items-center justify-between`}>
                    <span className="text-[10px] font-bold text-slate-400">{stageLeads.length} lead{stageLeads.length!==1?'s':''}</span>
                    {stageLeads.filter(l=>l.priority==='Hot').length > 0 && (
                      <span className="text-[10px] font-black text-red-500">🔥 {stageLeads.filter(l=>l.priority==='Hot').length}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          // ── Table ──
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr>
                  {['Lead','Phone','Actions','Stage','Priority','Source','Follow Up','Assigned'].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => {
                  const st     = getStage(lead.status);
                  const pCfg   = PRIORITY_CFG[lead.priority] || PRIORITY_CFG.Warm;
                  const overdue = lead.followUpDate && lead.followUpDate < t && !['Won','Lost','Not Interested'].includes(lead.status);
                  const dueToday = lead.followUpDate === t;
                  const wa = waLink(lead.phone);
                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="table-td cursor-pointer" onClick={()=>setSelected(lead)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm shrink-0">
                            {lead.name?.[0]?.toUpperCase()||'?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                            {lead.company && <p className="text-xs text-slate-400">{lead.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        {lead.phone
                          ? <span className="font-mono text-sm text-slate-700">{lead.phone}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1.5">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`}
                              className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                              title="Call">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            </a>
                          )}
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer"
                              className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                              title="WhatsApp">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="table-td cursor-pointer" onClick={()=>setSelected(lead)}>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text} border ${st.border}`}>
                          {st.emoji} {lead.status}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pCfg.bg}`}>
                          {lead.priority === 'Hot' ? '🔥' : lead.priority === 'Warm' ? '🟡' : '🔵'} {lead.priority}
                        </span>
                      </td>
                      <td className="table-td text-xs text-slate-500">{SOURCE_ICONS[lead.source]} {lead.source}</td>
                      <td className="table-td whitespace-nowrap">
                        {lead.followUpDate ? (
                          <span className={`text-xs font-bold ${overdue ? 'text-red-600' : dueToday ? 'text-amber-600' : 'text-slate-500'}`}>
                            {overdue ? '⚠ ' : dueToday ? '🔔 ' : ''}{lead.followUpDate}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="table-td text-xs text-slate-500">{lead.assignedTo?.userName?.split(' ')[0] || '—'}</td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-20">
                      <p className="text-5xl mb-3">🎯</p>
                      <p className="font-black text-slate-600 text-lg">No leads found</p>
                      <p className="text-sm text-slate-400 mt-1 mb-4">Import from WhatsApp or add manually</p>
                      <button onClick={() => setModal('wa')}
                        className="bg-emerald-600 text-white font-black px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-500">
                        💬 Import from WhatsApp
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ MODALS ══ */}
      {modal === 'wa'  && <WaImportModal onClose={() => setModal(null)} onImported={load} />}
      {modal === 'add' && <AddLeadModal staff={staff} onClose={() => setModal(null)} onCreated={onCreated} />}
      {selected && <LeadDrawer lead={selected} staff={staff} onClose={() => setSelected(null)} onUpdate={onUpdate} onDelete={onDelete} />}
    </div>
  );
}
