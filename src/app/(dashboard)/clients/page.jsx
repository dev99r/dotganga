'use client';
import { useState, useEffect } from 'react';

const PLATFORM_CFG = {
  Instagram: { bg:'bg-pink-500/15', text:'text-pink-400' },
  Facebook:  { bg:'bg-blue-500/15', text:'text-blue-400' },
  YouTube:   { bg:'bg-red-500/15',  text:'text-red-400'  },
  LinkedIn:  { bg:'bg-sky-500/15',  text:'text-sky-400'  },
  Twitter:   { bg:'bg-cyan-500/15', text:'text-cyan-400' },
  WhatsApp:  { bg:'bg-emerald-500/15',text:'text-emerald-400'},
};
const ALL_PLATFORMS = ['Instagram','Facebook','YouTube','LinkedIn','Twitter','WhatsApp'];
const ALL_SERVICES  = ['Social Media Management','Meta Ads','Content Creation','Video Editing','Graphic Design','SEO','Website','Branding','Photography'];

function AddClientModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name:'', email:'', phone:'', company:'', industry:'', website:'',
    platforms:[], services:[], monthlyBudget:'', notes:'',
    createLogin:false, password:'',
    contractStart:'', contractEnd:'',
  });
  const [saving, setSaving] = useState(false);
  const f = u => setForm(p => ({ ...p, ...u }));

  const toggleArr = (key, val) => {
    const arr = form[key].includes(val) ? form[key].filter(x => x !== val) : [...form[key], val];
    f({ [key]: arr });
  };

  const submit = async () => {
    if (!form.name.trim()) { alert('Name required'); return; }
    setSaving(true);
    const res  = await fetch('/api/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { onAdded(data.client); onClose(); }
    else alert(data.message || 'Failed');
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface-100 border border-border w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight:'92vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-black text-slate-100 text-lg">Add Client</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-surface-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Client Name *</label>
              <input value={form.name} onChange={e => f({name:e.target.value})} className="input" placeholder="Full name" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Company</label>
              <input value={form.company} onChange={e => f({company:e.target.value})} className="input" placeholder="Business name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={e => f({email:e.target.value})} className="input" type="email" placeholder="client@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => f({phone:e.target.value})} className="input" placeholder="9876543210" />
            </div>
            <div>
              <label className="label">Industry</label>
              <input value={form.industry} onChange={e => f({industry:e.target.value})} className="input" placeholder="e.g. Fashion" />
            </div>
            <div>
              <label className="label">Monthly Budget (₹)</label>
              <input value={form.monthlyBudget} onChange={e => f({monthlyBudget:e.target.value})} className="input" placeholder="25000" type="number" />
            </div>
            <div>
              <label className="label">Contract Start</label>
              <input type="date" value={form.contractStart} onChange={e => f({contractStart:e.target.value})} className="input" />
            </div>
            <div>
              <label className="label">Contract End</label>
              <input type="date" value={form.contractEnd} onChange={e => f({contractEnd:e.target.value})} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map(p => {
                const sel = form.platforms.includes(p);
                const c   = PLATFORM_CFG[p];
                return (
                  <button key={p} onClick={() => toggleArr('platforms', p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${sel ? `${c.bg} ${c.text} border-transparent` : 'border-border text-muted hover:border-border-light'}`}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Services</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map(s => {
                const sel = form.services.includes(s);
                return (
                  <button key={s} onClick={() => toggleArr('services', s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${sel ? 'bg-primary/15 text-primary-light border-primary/30' : 'border-border text-muted hover:border-border-light'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => f({notes:e.target.value})} rows={2}
              className="input resize-none" placeholder="Special requirements, preferences…" />
          </div>

          <div className="bg-surface-200 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.createLogin} onChange={e => f({createLogin:e.target.checked})}
                className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm font-bold text-slate-300">Create client login account</span>
            </label>
            {form.createLogin && (
              <div>
                <label className="label">Temporary Password</label>
                <input type="password" value={form.password} onChange={e => f({password:e.target.value})}
                  className="input" placeholder="Set initial password" />
                <p className="text-[10px] text-muted mt-1">Client will be able to access their portal at /login</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0">
          <button onClick={submit} disabled={saving} className="btn-primary w-full py-3 text-sm">
            {saving ? 'Creating…' : '+ Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/clients?search=${search}`);
    const d   = await res.json();
    if (d.success) setClients(d.clients);
    setLoading(false);
  };

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const openClient = async (c) => {
    setSelected(c);
    const res = await fetch(`/api/clients/${c._id}`);
    const d   = await res.json();
    if (d.success) setDetail(d);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-100">Clients</h1>
          <p className="text-sm text-muted mt-0.5">{clients.length} total clients</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Client
        </button>
      </div>

      <div className="relative">
        <svg className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9"
          placeholder="Search clients by name, company, email…" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card h-40 skeleton" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-black text-slate-300">No clients yet</p>
          <p className="text-sm text-muted mt-1 mb-4">Add your first client to get started</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">+ Add Client</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.map(c => (
            <button key={c._id} onClick={() => openClient(c)}
              className="card p-4 text-left hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center font-black text-primary-light text-sm shrink-0 group-hover:bg-primary/20 transition-colors">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-200 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted truncate">{c.company || c.industry || 'Client'}</p>
                </div>
                <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${c.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {c.platforms?.slice(0,3).map(p => {
                  const cfg = PLATFORM_CFG[p];
                  return <span key={p} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cfg?.bg} ${cfg?.text}`}>{p}</span>;
                })}
                {c.platforms?.length > 3 && <span className="text-[9px] text-muted">+{c.platforms.length-3}</span>}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{c.email || c.phone || '—'}</span>
                {c.monthlyBudget > 0 && <span className="font-bold text-emerald-400">₹{Number(c.monthlyBudget).toLocaleString()}/mo</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Client Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => { setSelected(null); setDetail(null); }} />
          <div className="w-full max-w-sm bg-surface-100 border-l border-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center font-black text-primary-light">
                  {selected.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-100">{selected.name}</p>
                  <p className="text-xs text-muted">{selected.company}</p>
                </div>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null); }}
                className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-surface-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detail && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:'Posts',      value:detail.stats?.totalPosts || 0,   color:'text-slate-100' },
                      { label:'Published',  value:detail.stats?.published  || 0,   color:'text-primary-light' },
                      { label:'Pending',    value:detail.stats?.pending    || 0,   color:'text-amber-400' },
                      { label:'Scheduled',  value:detail.stats?.scheduled  || 0,   color:'text-blue-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-surface-200 rounded-xl p-3 text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-muted font-bold uppercase mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {[
                      { label:'Email',   value:selected.email },
                      { label:'Phone',   value:selected.phone },
                      { label:'Industry',value:selected.industry },
                      { label:'Budget',  value:selected.monthlyBudget ? `₹${Number(selected.monthlyBudget).toLocaleString()}/mo` : null },
                      { label:'Contract',value:selected.contractStart ? `${selected.contractStart?.slice(0,10)} → ${selected.contractEnd?.slice(0,10) || '—'}` : null },
                    ].filter(x => x.value).map(x => (
                      <div key={x.label} className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-xs text-muted font-semibold">{x.label}</span>
                        <span className="text-xs text-slate-300 font-bold">{x.value}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.platforms?.map(p => {
                        const c = PLATFORM_CFG[p];
                        return <span key={p} className={`text-xs font-bold px-2 py-1 rounded-lg ${c?.bg} ${c?.text}`}>{p}</span>;
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">Recent Posts</p>
                    <div className="space-y-2">
                      {detail.posts?.slice(0,5).map(p => (
                        <div key={p._id} className="flex items-center gap-2 py-2 border-b border-border/50">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-200 shrink-0">
                            {p.mediaUrls?.[0] ? <img src={p.mediaUrls[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">📄</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-300 truncate">{p.title}</p>
                            <p className="text-[9px] text-muted">{p.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected.notes && (
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2">Notes</p>
                      <p className="text-xs text-slate-400 bg-surface-200 rounded-xl p-3">{selected.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={c => { setClients(p => [c, ...p]); }} />}
    </div>
  );
}
