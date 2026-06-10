import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { id:'Instagram',          icon:'📸', color:'bg-gradient-to-br from-purple-500 to-pink-500'    },
  { id:'Facebook',           icon:'👍', color:'bg-gradient-to-br from-blue-600 to-blue-700'      },
  { id:'YouTube',            icon:'▶️', color:'bg-gradient-to-br from-red-500 to-red-600'        },
  { id:'LinkedIn',           icon:'💼', color:'bg-gradient-to-br from-blue-500 to-cyan-600'      },
  { id:'Twitter',            icon:'🐦', color:'bg-gradient-to-br from-sky-400 to-blue-500'       },
  { id:'Google My Business', icon:'🗺️', color:'bg-gradient-to-br from-green-500 to-emerald-600'  },
  { id:'Email',              icon:'📧', color:'bg-gradient-to-br from-slate-500 to-slate-700'    },
  { id:'Website',            icon:'🌐', color:'bg-gradient-to-br from-cyan-500 to-blue-600'      },
  { id:'Hosting',            icon:'🖥️', color:'bg-gradient-to-br from-orange-500 to-amber-600'  },
  { id:'Domain',             icon:'🔗', color:'bg-gradient-to-br from-violet-500 to-purple-600'  },
  { id:'WhatsApp Business',  icon:'💬', color:'bg-gradient-to-br from-green-400 to-emerald-500'  },
  { id:'Google Ads',         icon:'🎯', color:'bg-gradient-to-br from-yellow-500 to-orange-500'  },
  { id:'Meta Ads Manager',   icon:'📊', color:'bg-gradient-to-br from-blue-500 to-indigo-600'    },
  { id:'Canva',              icon:'🎨', color:'bg-gradient-to-br from-teal-400 to-cyan-500'      },
  { id:'Other',              icon:'🔑', color:'bg-gradient-to-br from-slate-400 to-slate-600'    },
];

const getPlatform = id => PLATFORMS.find(p => p.id === id) || PLATFORMS[PLATFORMS.length - 1];

const DOC_TYPES = ['PDF','Image','Link','Other'];

// ─── CredentialCard ───────────────────────────────────────────────────────────

function CredentialCard({ cred, onEdit, onDelete }) {
  const [showPass, setShowPass] = useState(false);
  const [copying,  setCopying]  = useState('');
  const [docsOpen, setDocsOpen] = useState(false);
  const plat = getPlatform(cred.platform);

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopying(key);
    toast.success('Copied!', { duration: 1200 });
    setTimeout(() => setCopying(''), 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* header */}
      <div className={`${plat.color} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{plat.icon}</span>
          <div>
            <p className="text-white font-black text-sm">{cred.platform}</p>
            {cred.label && <p className="text-white/70 text-[10px] font-bold">{cred.label}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {cred.twoFAEnabled && (
            <span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">🔐 2FA</span>
          )}
          <button onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs font-black transition-all active:scale-90">
            ✏️
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-red-400/60 flex items-center justify-center text-white text-xs transition-all active:scale-90">
            🗑️
          </button>
        </div>
      </div>

      {/* body */}
      <div className="p-4 space-y-2.5">
        {cred.username && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-[10px] font-black text-slate-400 uppercase w-14 shrink-0">User</span>
            <span className="flex-1 text-sm font-bold text-slate-800 truncate">{cred.username}</span>
            <button onClick={() => copy(cred.username, 'user')}
              className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${copying==='user' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {copying === 'user' ? '✓' : 'Copy'}
            </button>
          </div>
        )}

        {cred._passwordEnc && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-[10px] font-black text-slate-400 uppercase w-14 shrink-0">Pass</span>
            <span className="flex-1 text-sm font-bold text-slate-800 font-mono truncate">
              {showPass ? cred.password : '••••••••••••'}
            </span>
            <button onClick={() => setShowPass(s => !s)}
              className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              {showPass ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => copy(cred.password, 'pass')}
              className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${copying==='pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {copying === 'pass' ? '✓' : 'Copy'}
            </button>
          </div>
        )}

        {cred.notes && (
          <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
            📝 {cred.notes}
          </p>
        )}

        {/* Documents */}
        {cred.documents?.length > 0 && (
          <div>
            <button onClick={() => setDocsOpen(o => !o)}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-700 transition-colors">
              <span>📎</span>
              <span>{cred.documents.length} document{cred.documents.length !== 1 ? 's' : ''}</span>
              <span>{docsOpen ? '▲' : '▼'}</span>
            </button>
            {docsOpen && (
              <div className="mt-2 space-y-1.5">
                {cred.documents.map(doc => (
                  <a key={doc._id} href={doc.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 hover:bg-blue-100 transition-colors group">
                    <span className="text-sm">{doc.type === 'PDF' ? '📄' : doc.type === 'Image' ? '🖼️' : '🔗'}</span>
                    <span className="flex-1 text-xs font-bold text-blue-800 truncate group-hover:underline">{doc.name}</span>
                    <span className="text-[9px] font-black text-blue-400">↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {cred.addedBy && (
          <p className="text-[9px] text-slate-300 font-bold">Added by {cred.addedBy.name}</p>
        )}
      </div>
    </div>
  );
}

// ─── CredentialModal (Add / Edit) ─────────────────────────────────────────────

function CredentialModal({ clientId, cred, onClose, onSaved }) {
  const isEdit = !!cred;
  const [form, setForm] = useState({
    platform:     cred?.platform     || 'Instagram',
    label:        cred?.label        || '',
    username:     cred?.username     || '',
    password:     isEdit ? cred.password : '',
    twoFAEnabled: cred?.twoFAEnabled || false,
    notes:        cred?.notes        || '',
  });
  const [saving,   setSaving]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Document sub-form
  const [docForm,    setDocForm]    = useState({ name:'', url:'', type:'Link' });
  const [addingDoc,  setAddingDoc]  = useState(false);
  const [docs,       setDocs]       = useState(cred?.documents || []);

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.platform) return toast.error('Select a platform.');
    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        const r = await api.put(`/credentials/${cred._id}`, form);
        saved = r.data.credential;
      } else {
        const r = await api.post('/credentials', { ...form, clientId });
        saved = r.data.credential;
      }
      // Add any queued docs
      toast.success(isEdit ? 'Updated!' : 'Credential added!');
      onSaved(saved);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleAddDoc = async () => {
    if (!docForm.name || !docForm.url) return toast.error('Name and URL required.');
    if (isEdit) {
      try {
        const r = await api.post(`/credentials/${cred._id}/documents`, docForm);
        setDocs(r.data.documents);
        setDocForm({ name:'', url:'', type:'Link' });
        toast.success('Document added!');
      } catch { toast.error('Failed to add document.'); }
    } else {
      toast.error('Save the credential first, then add documents.');
    }
  };

  const IC = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all';
  const LB = 'text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block';
  const selPlatform = getPlatform(form.platform);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className={`${selPlatform.color} px-6 py-5 relative overflow-hidden shrink-0`}>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full"/>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-white font-black text-lg">
                {isEdit ? `✏️ Edit — ${cred.platform}` : '🔑 Add Credential'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">All passwords encrypted & secure</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black transition-all active:scale-90">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Platform selector */}
          <div>
            <label className={LB}>Platform</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map(p => (
                <button key={p.id} type="button" onClick={() => set('platform', p.id)}
                  title={p.id}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm border-2 transition-all active:scale-90 ${form.platform===p.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}>
                  <span className="text-base leading-none">{p.icon}</span>
                  <span className="text-[8px] font-black text-slate-500 leading-none text-center px-0.5 truncate w-full text-center">{p.id.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LB}>Label / Page Name (optional)</label>
            <input value={form.label} onChange={e=>set('label',e.target.value)}
              placeholder="e.g. Main Instagram Page, Business Email..." className={IC}/>
          </div>

          <div>
            <label className={LB}>Username / Email / Phone</label>
            <input value={form.username} onChange={e=>set('username',e.target.value)}
              placeholder="Enter login username or email" className={IC}/>
          </div>

          <div>
            <label className={LB}>Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep existing' : 'Enter password'}
                className={`${IC} pr-16`}/>
              <button type="button" onClick={() => setShowPass(s=>!s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-lg transition-all">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
              <div
                onClick={() => set('twoFAEnabled', !form.twoFAEnabled)}
                className={`w-10 h-6 rounded-full transition-all cursor-pointer ${form.twoFAEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md m-0.5 transition-all ${form.twoFAEnabled ? 'translate-x-4' : 'translate-x-0'}`}/>
              </div>
              <span className="text-xs font-black text-slate-700">🔐 2FA Enabled</span>
            </label>
          </div>

          <div>
            <label className={LB}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
              placeholder="Recovery email, backup codes, special instructions..."
              rows={2} className={`${IC} resize-none`}/>
          </div>

          {/* Documents section (only on edit) */}
          {isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={LB + ' mb-0'}>Documents & Links</label>
                <button onClick={() => setAddingDoc(s=>!s)}
                  className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all">
                  {addingDoc ? '✕ Cancel' : '+ Add'}
                </button>
              </div>

              {addingDoc && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2 mb-2">
                  <input value={docForm.name} onChange={e=>setDocForm(f=>({...f,name:e.target.value}))}
                    placeholder="Document name (e.g. Business Plan.pdf)" className={IC}/>
                  <input value={docForm.url} onChange={e=>setDocForm(f=>({...f,url:e.target.value}))}
                    placeholder="URL or link" className={IC}/>
                  <div className="flex gap-2">
                    <select value={docForm.type} onChange={e=>setDocForm(f=>({...f,type:e.target.value}))}
                      className={`${IC} flex-1`}>
                      {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <button onClick={handleAddDoc}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 transition-all active:scale-95 shrink-0">
                      Add
                    </button>
                  </div>
                </div>
              )}

              {docs.length > 0 && (
                <div className="space-y-1.5">
                  {docs.map(doc => (
                    <a key={doc._id} href={doc.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 hover:bg-blue-50 transition-colors">
                      <span>{doc.type === 'PDF' ? '📄' : doc.type === 'Image' ? '🖼️' : '🔗'}</span>
                      <span className="flex-1 text-xs font-bold text-slate-700 truncate">{doc.name}</span>
                      <span className="text-[10px] text-slate-400">↗</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-black text-sm hover:bg-slate-200 transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:opacity-90 transition-all disabled:opacity-40 active:scale-95 shadow-lg shadow-blue-500/20">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
              : (isEdit ? '✓ Update' : '🔑 Save Credential')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientCredentialsVault({ clientId, clientName }) {
  const [creds,  setCreds]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [modal,  setModal]  = useState(null);  // null | 'add' | credential object
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const r = await api.get(`/credentials?clientId=${clientId}`);
      setCreds(r.data.credentials || []);
    } catch { toast.error('Failed to load credentials.'); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this credential?')) return;
    try {
      await api.delete(`/credentials/${id}`);
      setCreds(prev => prev.filter(c => c._id !== id));
      toast.success('Deleted.');
    } catch { toast.error('Delete failed.'); }
  };

  const handleSaved = (saved) => {
    setModal(null);
    load();
  };

  const grouped = PLATFORMS.reduce((acc, p) => {
    const list = creds.filter(c => c.platform === p.id && (
      !filter || c.platform.toLowerCase().includes(filter.toLowerCase()) || c.label?.toLowerCase().includes(filter.toLowerCase()) || c.username?.toLowerCase().includes(filter.toLowerCase())
    ));
    if (list.length) acc[p.id] = list;
    return acc;
  }, {});

  const allFiltered = filter
    ? creds.filter(c => c.platform.toLowerCase().includes(filter.toLowerCase()) || c.label?.toLowerCase().includes(filter.toLowerCase()) || c.username?.toLowerCase().includes(filter.toLowerCase()))
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">🔐</div>
          <div>
            <p className="text-white font-black text-sm">Client Credentials Vault</p>
            <p className="text-slate-400 text-[10px] font-bold">{creds.length} saved · AES-256 encrypted</p>
          </div>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/30">
          <span className="text-base leading-none">+</span>
          <span>Add</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="p-4">
          {creds.length > 3 && (
            <div className="relative mb-4">
              <input value={filter} onChange={e=>setFilter(e.target.value)}
                placeholder="Search platform, username..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          )}

          {creds.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-4xl">🔐</p>
              <p className="font-black text-slate-700">No credentials yet</p>
              <p className="text-xs text-slate-400">Add Instagram, Facebook, email passwords<br/>and documents for {clientName}</p>
              <button onClick={() => setModal('add')}
                className="mt-2 text-sm font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-all active:scale-95">
                + Add First Credential
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {(allFiltered || creds).map(cred => (
                <CredentialCard
                  key={cred._id}
                  cred={cred}
                  onEdit={() => setModal(cred)}
                  onDelete={() => handleDelete(cred._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security note */}
      {creds.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <span className="text-sm">🛡️</span>
            <p className="text-[10px] font-bold text-emerald-700">All passwords are AES-256 encrypted. Only agency staff can access this vault.</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CredentialModal
          clientId={clientId}
          cred={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
