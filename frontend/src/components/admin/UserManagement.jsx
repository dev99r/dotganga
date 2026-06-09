import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ROLES = ['Admin','Manager','Staff','SMM','Meta Ads Manager','Client'];
const ROLE_COLOR = {
  'Super Admin':'bg-red-500','Admin':'bg-blue-950','Manager':'bg-amber-500',
  'Staff':'bg-slate-400','SMM':'bg-violet-500','Client':'bg-emerald-500','Meta Ads Manager':'bg-cyan-500',
};
const ROLE_LIGHT = {
  'Super Admin':'bg-red-50 text-red-700 border-red-200','Admin':'bg-blue-50 text-blue-800 border-blue-200',
  'Manager':'bg-amber-50 text-amber-700 border-amber-200','Staff':'bg-slate-100 text-slate-600 border-slate-200',
  'SMM':'bg-violet-50 text-violet-700 border-violet-200','Client':'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Meta Ads Manager':'bg-cyan-50 text-cyan-700 border-cyan-200',
};

function genPassword() {
  const c = 'abcdefghijklmnpqrstuvwxyzABCDEFGHJKLMNP123456789!@#';
  return Array.from({length:10}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

function Avatar({ name, role, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';
  const sz = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-12 h-12 text-base' }[size];
  const bg = ROLE_COLOR[role] || 'bg-slate-400';
  return (
    <div className={`${sz} rounded-xl ${bg} flex items-center justify-center font-black text-white shrink-0`}>
      {initials}
    </div>
  );
}

const EMPTY = { name:'', email:'', password:'', role:'Staff', phone:'', department:'', designation:'', clientId:'', assignedClients:[] };

function UserModal({ mode, initial, clients, onClose, onSaved }) {
  const [form,       setForm]       = useState(initial || EMPTY);
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required.'); return; }
    if (mode === 'add' && form.password.length < 6) { toast.error('Password min 6 chars.'); return; }
    setSubmitting(true);
    try {
      if (mode === 'add') {
        await api.post('/users', form);
        toast.success(`${form.name} created!`);
      } else {
        await api.put(`/users/${initial._id}`, form);
        toast.success('User updated.');
      }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-slate-100 rounded-t-3xl flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl ${ROLE_COLOR[form.role]||'bg-slate-400'} flex items-center justify-center text-white font-black text-sm`}>
            {mode === 'add' ? '+' : form.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="font-black text-slate-900">{mode === 'add' ? 'Create New User' : 'Edit User'}</h2>
            <p className="text-xs text-slate-400">{mode === 'add' ? 'Pick a role, fill details' : form.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Role picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    form.role === r ? `${ROLE_COLOR[r]} text-white border-transparent` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Rahul Verma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="user@dotganga.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
          </div>

          {/* Password (add mode) */}
          {mode === 'add' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input type={showPass?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPass
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                      }
                    </svg>
                  </button>
                </div>
                <button type="button"
                  onClick={() => { const p=genPassword(); set('password',p); setShowPass(true); toast.success(`Password: ${p}`,{duration:6000}); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 rounded-xl">
                  Generate
                </button>
              </div>
            </div>
          )}

          {/* Client link (for Client role) */}
          {form.role === 'Client' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link to Client Account</label>
              <select value={form.clientId} onChange={e=>set('clientId',e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">— Select client —</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
              </select>
            </div>
          )}

          {/* Assigned clients (SMM / Meta Ads Manager) */}
          {['SMM','Meta Ads Manager'].includes(form.role) && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Clients</label>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {clients.map(c => (
                  <label key={c._id} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                    <input type="checkbox"
                      checked={form.assignedClients.includes(c._id)}
                      onChange={e => {
                        const list = form.assignedClients;
                        set('assignedClients', e.target.checked ? [...list, c._id] : list.filter(x=>x!==c._id));
                      }}
                      className="rounded"/>
                    <span className="text-sm font-semibold text-slate-700">{c.businessName}</span>
                    <span className="text-xs text-slate-400 ml-auto">{c.services?.slice(0,2).join(', ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-blue-950 text-white text-sm font-black hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</> : (mode==='add'?'Create User':'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modal,   setModal]   = useState(null);
  const [selected,setSelected]= useState(null);

  const load = useCallback(async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/users'),
        api.get('/clients'),
      ]);
      setUsers(uRes.data.users || []);
      setClients(cRes.data.clients || []);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (user) => {
    if (!confirm(`${user.isActive ? 'Deactivate' : 'Reactivate'} ${user.name}?`)) return;
    try {
      if (user.isActive) {
        await api.delete(`/users/${user._id}`);
        toast.success(`${user.name} deactivated.`);
      } else {
        await api.put(`/users/${user._id}`, { isActive: true });
        toast.success(`${user.name} reactivated.`);
      }
      load();
    } catch { toast.error('Failed.'); }
  };

  const handleResetPass = async (user) => {
    const pass = prompt(`New password for ${user.name} (min 6 chars):`);
    if (!pass || pass.length < 6) { toast.error('Password too short.'); return; }
    try {
      await api.put(`/users/${user._id}/reset-password`, { password: pass });
      toast.success('Password reset!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const allRoles = ['All', ...ROLES];
  const displayed = users.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">User Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">{users.filter(u=>u.isActive).length} active · {users.length} total</p>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-blue-950 hover:bg-blue-900 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-950/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Create User
        </button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ROLES.map(r => {
          const cnt = users.filter(u=>u.role===r).length;
          return (
            <button key={r} onClick={()=>setRoleFilter(r===roleFilter?'All':r)}
              className={`rounded-2xl px-3 py-2.5 text-center border transition-all ${roleFilter===r?`${ROLE_COLOR[r]} text-white border-transparent`:'bg-white border-slate-100 hover:border-slate-200'}`}>
              <p className={`text-xl font-black ${roleFilter===r?'text-white':'text-slate-800'}`}>{cnt}</p>
              <p className={`text-[10px] font-bold ${roleFilter===r?'text-white/80':'text-slate-400'} leading-tight`}>{r}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"/>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse"/>)}</div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-bold text-slate-500">No users found</p>
          <button onClick={()=>setModal('add')} className="mt-4 bg-blue-950 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-900">
            + Create First User
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {displayed.map((u, i) => (
              <div key={u._id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                <Avatar name={u.name} role={u.role} size="md"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_LIGHT[u.role]||'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {u.role}
                    </span>
                    {!u.isActive && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                  {u.clientRef && <p className="text-[10px] text-emerald-600 font-semibold">Client: {u.clientRef?.businessName || '—'}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setSelected(u); setModal('edit'); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button onClick={() => handleResetPass(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Reset password">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                  </button>
                  <button onClick={() => handleToggle(u)}
                    className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-slate-400 hover:bg-red-50 hover:text-red-500' : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    title={u.isActive ? 'Deactivate' : 'Reactivate'}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {u.isActive
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      }
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal === 'add' && (
        <UserModal mode="add" clients={clients} onClose={()=>setModal(null)} onSaved={()=>{load();setModal(null);}}/>
      )}
      {modal === 'edit' && selected && (
        <UserModal mode="edit" initial={{...selected,assignedClients:selected.assignedClients?.map(c=>c._id||c)||[]}}
          clients={clients}
          onClose={()=>{setModal(null);setSelected(null);}}
          onSaved={()=>{load();setModal(null);setSelected(null);}}/>
      )}
    </div>
  );
}
