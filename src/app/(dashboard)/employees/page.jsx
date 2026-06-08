'use client';
import { useEffect, useState, useCallback } from 'react';

const ROLES = ['Admin', 'Manager', 'Sales', 'VideoEditor', 'GraphicDesigner', 'SMM', 'ContentWriter', 'Intern'];

const ROLE_CFG = {
  Admin:          { label: 'Admin',            color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  Manager:        { label: 'Manager',          color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  Sales:          { label: 'Sales',            color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  VideoEditor:    { label: 'Video Editor',     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  GraphicDesigner:{ label: 'Graphic Designer', color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
  SMM:            { label: 'Social Media',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20' },
  ContentWriter:  { label: 'Content Writer',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  Intern:         { label: 'Intern',           color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] || { label: role, color: 'text-muted', bg: 'bg-surface-50 border-border' };
  return <span className={`badge border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
}

function generatePassword(name) {
  const base = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g,'');
  const num  = Math.floor(100 + Math.random() * 900);
  return `${base}${num}`;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-100 border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="font-bold text-slate-100">{title}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-surface-50 flex items-center justify-center text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function AddEmployeeModal({ onClose, onCreated }) {
  const [form,    setForm]    = useState({ name: '', email: '', role: 'Sales', department: '', password: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [created, setCreated] = useState(null);

  const genPwd = () => setForm(f => ({ ...f, password: generatePassword(f.name || 'user') }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password || !form.role) { setError('All fields required.'); return; }
    setSaving(true); setError('');
    const res  = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) { setCreated({ ...data.user, rawPassword: form.password }); onCreated(data.user); }
    else setError(data.message || 'Failed to create.');
    setSaving(false);
  };

  if (created) {
    return (
      <Modal title="Employee Created" onClose={onClose}>
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-100">{created.name} added!</p>
            <p className="text-muted text-sm mt-1">Share these login credentials:</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-4 text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-muted text-xs">Email:</span>
              <span className="text-slate-200 text-xs">{created.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted text-xs">Password:</span>
              <span className="text-green-400 font-bold text-sm">{created.rawPassword}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted text-xs">Role:</span>
              <span className="text-slate-200 text-xs">{ROLE_CFG[created.role]?.label || created.role}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-primary w-full py-2.5">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Add New Employee" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Full Name</label>
          <input className="input" placeholder="Priya Kapoor" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="priya@dotganga.com" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role / Department</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label || r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department (optional)</label>
            <input className="input" placeholder="e.g. Marketing" value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="flex gap-2">
            <input className="input flex-1 font-mono" placeholder="Set password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <button onClick={genPwd} className="btn-ghost text-xs px-3 py-2 shrink-0">Auto-gen</button>
          </div>
        </div>
        {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}
        <button onClick={submit} disabled={saving} className="btn-primary w-full py-3 font-bold">
          {saving ? 'Creating…' : 'Create Employee'}
        </button>
      </div>
    </Modal>
  );
}

function EditEmployeeModal({ employee, onClose, onUpdated }) {
  const [form,   setForm]   = useState({ name: employee.name, role: employee.role, department: employee.department || '', isActive: employee.isActive, password: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const submit = async () => {
    setSaving(true); setError('');
    const patch = { name: form.name, role: form.role, department: form.department, isActive: form.isActive };
    if (form.password) patch.password = form.password;
    const res  = await fetch(`/api/users/${employee._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.success) { onUpdated(data.user); onClose(); }
    else setError(data.message || 'Failed to update.');
    setSaving(false);
  };

  return (
    <Modal title={`Edit — ${employee.name}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label || r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" placeholder="e.g. Marketing" value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">New Password (leave blank to keep current)</label>
          <input className="input font-mono" placeholder="New password…" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3 px-1">
          <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-surface-50'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-slate-300">{form.isActive ? 'Active' : 'Deactivated'}</span>
        </div>
        {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1 py-2.5 font-bold">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function EmployeesPage() {
  const [users,      setUsers]      = useState([]);
  const [reports,    setReports]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);
  const [editing,    setEditing]    = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    const [uRes, rRes] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch(`/api/report?date=${today}`).then(r => r.json()),
    ]);
    if (uRes.success) setUsers(uRes.users);
    if (rRes.success) {
      const map = {};
      rRes.reports.forEach(r => { map[String(r.userId)] = r; });
      setReports(map);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const deptCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const submitted  = users.filter(u => reports[String(u._id)]).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100">Team Members</h1>
          <p className="text-muted text-sm">{users.filter(u => u.isActive).length} active · {submitted}/{users.filter(u => u.role !== 'Admin').length} reported today</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Department summary tiles */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(deptCounts).map(([role, count]) => (
          <button key={role} onClick={() => setRoleFilter(r => r === role ? 'all' : role)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              roleFilter === role ? `${ROLE_CFG[role]?.bg || ''} ${ROLE_CFG[role]?.color || ''}` : 'bg-surface-100 border-border text-muted hover:text-slate-200'
            }`}>
            <span>{ROLE_CFG[role]?.label || role}</span>
            <span className="font-black text-sm">{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input className="input pl-10 pr-4 py-2.5 text-sm w-full sm:w-64" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Employee cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-surface-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(u => {
            const rpt = reports[String(u._id)];
            const cfg = ROLE_CFG[u.role] || { label: u.role, color: 'text-muted', bg: 'bg-surface-50 border-border' };
            const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div key={u._id} className={`card p-5 relative overflow-hidden ${!u.isActive ? 'opacity-50' : ''}`}>
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: cfg.color.replace('text-', '') === 'muted' ? '#71717a' : `var(--tw-${cfg.color.replace('text-', '')})` }} />

                <div className="flex items-start gap-3 pl-1">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${cfg.bg} ${cfg.color}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-100 text-sm truncate">{u.name}</p>
                      {!u.isActive && <span className="text-[10px] text-red-400 font-semibold">Inactive</span>}
                    </div>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <RoleBadge role={u.role} />
                      {u.department && <span className="text-[10px] text-muted">{u.department}</span>}
                    </div>
                  </div>
                  <button onClick={() => setEditing(u)}
                    className="w-7 h-7 rounded-lg hover:bg-surface-50 flex items-center justify-center text-muted hover:text-slate-300 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>

                {/* Today's report status */}
                <div className="mt-4 pl-1 flex items-center justify-between">
                  <span className="text-[10px] text-muted uppercase tracking-wider">Today's Report</span>
                  {rpt ? (
                    <span className={`badge border text-[10px] ${rpt.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/25' : rpt.status === 'Needs Review' ? 'bg-red-500/10 text-red-400 border-red-500/25' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'}`}>
                      {rpt.status === 'Approved' ? '✓ Approved' : rpt.status === 'Needs Review' ? '⚠ Review' : '● Submitted'}
                    </span>
                  ) : u.role !== 'Admin' ? (
                    <span className="badge bg-surface-50 text-muted border border-border text-[10px]">Not submitted</span>
                  ) : <span />}
                </div>

                {rpt?.sentiment && (
                  <div className="mt-2 pl-1 flex items-center gap-1.5">
                    <span className="text-sm">{rpt.sentiment === 'Happy' ? '😊' : rpt.sentiment === 'Stressed' ? '😓' : rpt.sentiment === 'Burnout' ? '🔥' : '😐'}</span>
                    <span className="text-[10px] text-muted">{rpt.sentiment}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd   && <AddEmployeeModal onClose={() => setShowAdd(false)} onCreated={u => { setUsers(prev => [...prev, u]); }} />}
      {editing   && <EditEmployeeModal employee={editing} onClose={() => setEditing(null)} onUpdated={u => { setUsers(prev => prev.map(x => x._id === u._id ? u : x)); }} />}
    </div>
  );
}
