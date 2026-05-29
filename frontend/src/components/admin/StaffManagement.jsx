import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Sales',      color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700 border-violet-200'  },
  { name: 'Creative',   color: 'bg-pink-500',   light: 'bg-pink-50   text-pink-700   border-pink-200'    },
  { name: 'Marketing',  color: 'bg-cyan-500',   light: 'bg-cyan-50   text-cyan-700   border-cyan-200'    },
  { name: 'Management', color: 'bg-amber-500',  light: 'bg-amber-50  text-amber-700  border-amber-200'   },
  { name: 'Operations', color: 'bg-emerald-500',light: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
  { name: 'Tech',       color: 'bg-blue-500',   light: 'bg-blue-50   text-blue-700   border-blue-200'    },
];
const getDept = (name) => DEPARTMENTS.find(d => d.name === name) || { name, color: 'bg-slate-400', light: 'bg-slate-100 text-slate-600 border-slate-200' };

const DESIGNATIONS = [
  'Sales Executive', 'Sales Manager', 'Video Editor', 'Graphic Designer',
  'Social Media Manager', 'Content Writer', 'Operations Manager',
  'Developer', 'Intern', 'Accountant', 'HR Manager',
];

function genPassword() {
  const chars = 'abcdefghijklmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, department, size = 'md' }) {
  const d  = getDept(department);
  const sz = { sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-lg' }[size];
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`${sz} rounded-2xl ${d.color} flex items-center justify-center font-black text-white shrink-0 select-none`}>
      {initials}
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────
function StaffCard({ member, isAdmin, onEdit, onSalary, onToggle }) {
  const d = getDept(member.department);
  return (
    <div className={`bg-white rounded-3xl ring-1 overflow-hidden transition-all hover:shadow-md ${
      member.isActive ? 'ring-slate-100' : 'ring-red-100 opacity-75'
    }`}>
      {/* Department colour bar */}
      <div className={`h-1.5 w-full ${d.color}`} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <Avatar name={member.name} department={member.department} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-sm truncate">{member.name}</p>
            <p className="text-xs text-slate-400 truncate">{member.designation || '—'}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {member.department && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.light}`}>
                  {member.department}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                member.role === 'Manager'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {member.role}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ml-auto ${member.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-3 pt-3 border-t border-slate-50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{member.email}</span>
          </div>
          {member.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{member.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Joined {member.joinedDate ? format(new Date(member.joinedDate), 'dd MMM yyyy') : '—'}</span>
          </div>
        </div>

        {/* Salary */}
        {member.salaryProfile ? (
          <div className="mt-3 bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-800">{formatINR(member.salaryProfile.baseMonthlySalary)}</p>
              <p className="text-[10px] text-slate-400">per month</p>
            </div>
            {member.salaryProfile.allowances > 0 && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                +{formatINR(member.salaryProfile.allowances)} allowance
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={() => onSalary(member)}
            className="mt-3 w-full text-xs font-semibold text-amber-600 bg-amber-50 rounded-xl px-3 py-2 hover:bg-amber-100 transition-colors text-center border border-amber-100"
          >
            ⚠ Salary not set — tap to configure
          </button>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-1.5">
          <button
            onClick={() => onEdit(member)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onSalary(member)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Salary
          </button>
          {isAdmin && (
            <button
              onClick={() => onToggle(member)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-colors ${
                member.isActive
                  ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {member.isActive ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Disable
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activate
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', email: '', password: '', designation: '', department: '', phone: '', role: 'Staff', joinedDate: new Date().toISOString().slice(0, 10) };

function StaffModal({ mode, initial, onClose, onSaved }) {
  const [form,       setForm]       = useState(initial || EMPTY_FORM);
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required.'); return; }
    if (mode === 'add' && form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setSubmitting(true);
    try {
      if (mode === 'add') {
        const { data } = await api.post('/staff', form);
        toast.success(`${form.name} added successfully!`);
        onSaved(data.user, 'add');
      } else {
        const { data } = await api.put(`/staff/${initial._id}`, {
          name: form.name, email: form.email, designation: form.designation,
          department: form.department, phone: form.phone, joinedDate: form.joinedDate,
        });
        toast.success('Profile updated.');
        onSaved(data.user, 'edit');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-slate-100 rounded-t-3xl flex items-center gap-4">
          {mode === 'add' ? (
            <div className="w-10 h-10 rounded-2xl bg-blue-950 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          ) : (
            <Avatar name={form.name} department={form.department} size="sm" />
          )}
          <div className="flex-1">
            <h2 className="font-black text-slate-900">{mode === 'add' ? 'Add New Staff Member' : 'Edit Profile'}</h2>
            <p className="text-xs text-slate-400">{mode === 'add' ? 'Fill in details to create login' : form.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Name + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address *</label>
            <input
              type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="name@dotganga.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
            />
          </div>

          {/* Password (add mode only) */}
          {mode === 'add' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPass
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
                <button type="button"
                  onClick={() => { const p = genPassword(); set('password', p); setShowPass(true); toast.success(`Password: ${p}`, { duration: 5000 }); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 rounded-xl transition-colors whitespace-nowrap">
                  Generate
                </button>
              </div>
              {form.password && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Strength: <span className={`font-bold ${form.password.length >= 10 ? 'text-emerald-500' : form.password.length >= 6 ? 'text-amber-500' : 'text-red-500'}`}>
                    {form.password.length >= 10 ? 'Strong' : form.password.length >= 6 ? 'OK' : 'Too short'}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Designation */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation</label>
            <input
              list="designations-list"
              value={form.designation} onChange={e => set('designation', e.target.value)}
              placeholder="e.g. Sales Executive"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
            />
            <datalist id="designations-list">
              {DESIGNATIONS.map(d => <option key={d} value={d} />)}
            </datalist>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(d => (
                <button
                  key={d.name} type="button"
                  onClick={() => set('department', d.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    form.department === d.name
                      ? `${d.color} text-white border-transparent shadow-sm`
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${form.department === d.name ? 'bg-white/50' : d.color}`} />
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone + Joined */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Joined Date</label>
              <input
                type="date" value={form.joinedDate} onChange={e => set('joinedDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Preview card (add mode) */}
          {mode === 'add' && form.name && (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Login Preview</p>
              <div className="flex items-center gap-3">
                <Avatar name={form.name} department={form.department} size="sm" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{form.name}</p>
                  <p className="text-xs text-slate-400">{form.email || 'no email yet'}</p>
                </div>
                {form.department && (
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDept(form.department).light}`}>
                    {form.department}
                  </span>
                )}
              </div>
              {form.password && (
                <div className="mt-2 bg-white rounded-xl px-3 py-2 text-xs flex items-center justify-between border border-slate-100">
                  <span className="text-slate-400">Password</span>
                  <span className="font-mono font-bold text-slate-700">{form.password}</span>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-blue-950 text-white text-sm font-black hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{mode === 'add' ? 'Adding…' : 'Saving…'}</>
                : mode === 'add' ? '+ Add Staff Member' : 'Save Changes'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Salary Modal ───────────────────────────────────────────────────────────────
function SalaryModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    baseMonthlySalary:   member.salaryProfile?.baseMonthlySalary || '',
    allowances:          member.salaryProfile?.allowances || '0',
    deductionPerHalfDay: member.salaryProfile?.deductionPerHalfDay ?? 0.5,
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const dailyRate  = form.baseMonthlySalary ? (parseFloat(form.baseMonthlySalary) / 26).toFixed(0) : 0;
  const halfDeduct = dailyRate ? (dailyRate * parseFloat(form.deductionPerHalfDay || 0)).toFixed(0) : 0;
  const totalCtc   = form.baseMonthlySalary ? (parseFloat(form.baseMonthlySalary) + parseFloat(form.allowances || 0)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.baseMonthlySalary) { toast.error('Base salary is required.'); return; }
    setSubmitting(true);
    try {
      await api.put(`/staff/${member._id}/salary`, {
        baseMonthlySalary:   parseFloat(form.baseMonthlySalary),
        allowances:          parseFloat(form.allowances || 0),
        deductionPerHalfDay: parseFloat(form.deductionPerHalfDay),
      });
      toast.success('Salary profile saved.');
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
          <Avatar name={member.name} department={member.department} size="sm" />
          <div className="flex-1">
            <h2 className="font-black text-slate-900">Salary Profile</h2>
            <p className="text-xs text-slate-400">{member.name} · {member.designation}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Base Monthly Salary (₹)</label>
            <input
              type="number" min={0} step={500}
              value={form.baseMonthlySalary} onChange={e => set('baseMonthlySalary', e.target.value)}
              placeholder="e.g. 30000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-lg font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Allowances (₹)</label>
            <input
              type="number" min={0} step={100}
              value={form.allowances} onChange={e => set('allowances', e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Half-Day Deduction</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 0.5, label: '50%', sub: 'Half pay' }, { v: 1, label: '100%', sub: 'Full deduct' }, { v: 0, label: '0%', sub: 'No deduct' }].map(o => (
                <button key={o.v} type="button"
                  onClick={() => set('deductionPerHalfDay', o.v)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    parseFloat(form.deductionPerHalfDay) === o.v
                      ? 'bg-blue-950 text-white border-blue-950'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  <p>{o.label}</p>
                  <p className="font-normal opacity-70 text-[10px]">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Calculation preview */}
          {form.baseMonthlySalary > 0 && (
            <div className="bg-blue-950 text-white rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Calculation Preview</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-black">{formatINR(totalCtc)}</p>
                  <p className="text-[10px] text-blue-400">Total CTC</p>
                </div>
                <div>
                  <p className="text-lg font-black">₹{parseInt(dailyRate).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-blue-400">Per Day</p>
                </div>
                <div>
                  <p className="text-lg font-black text-red-300">−₹{parseInt(halfDeduct).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-blue-400">Half-Day</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-blue-950 text-white text-sm font-black hover:bg-blue-900 transition-colors disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StaffManagement() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'Admin';

  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showInactive, setShowInactive] = useState(false);
  const [modal,    setModal]    = useState(null); // 'add' | 'edit' | 'salary'
  const [selected, setSelected] = useState(null);

  const loadStaff = useCallback(async () => {
    try {
      const { data } = await api.get(`/staff?search=${search}`);
      setStaff(data.staff || []);
    } catch { toast.error('Failed to load staff.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadStaff, 300);
    return () => clearTimeout(t);
  }, [loadStaff]);

  const handleToggle = async (member) => {
    if (member.isActive) {
      if (!confirm(`Disable ${member.name}? They won't be able to login.`)) return;
      try {
        await api.delete(`/staff/${member._id}`);
        toast.success(`${member.name} disabled.`);
        loadStaff();
      } catch { toast.error('Failed.'); }
    } else {
      try {
        await api.put(`/staff/${member._id}`, { isActive: true });
        toast.success(`${member.name} reactivated.`);
        loadStaff();
      } catch { toast.error('Failed.'); }
    }
  };

  const openEdit   = (m) => { setSelected(m); setModal('edit'); };
  const openSalary = (m) => { setSelected(m); setModal('salary'); };

  // Filter
  const displayed = staff.filter(s => {
    if (!showInactive && !s.isActive) return false;
    if (deptFilter !== 'All' && s.department !== deptFilter) return false;
    return true;
  });

  // Stats
  const active   = staff.filter(s => s.isActive).length;
  const withSal  = staff.filter(s => s.salaryProfile).length;
  const depts    = [...new Set(staff.map(s => s.department).filter(Boolean))];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-slate-900">Staff Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">{active} active · {staff.length} total</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-blue-950 hover:bg-blue-900 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-950/20 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Staff', value: staff.length,   color: 'text-slate-800', bg: 'bg-white' },
          { label: 'Active',      value: active,          color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'With Salary', value: withSal,         color: 'text-blue-600',    bg: 'bg-blue-50'    },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-4 py-3 text-center shadow-sm`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search + filters ── */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role…"
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['All', ...depts].map(d => (
            <button key={d} onClick={() => setDeptFilter(d)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ${
                deptFilter === d
                  ? `${getDept(d).color} text-white border-transparent`
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              {d}
            </button>
          ))}
          <button
            onClick={() => setShowInactive(s => !s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ml-auto ${
              showInactive ? 'bg-slate-800 text-white border-transparent' : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {showInactive ? 'Hide' : 'Show'} Inactive
          </button>
        </div>
      </div>

      {/* ── Card grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-3xl ring-1 ring-slate-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-4">👥</p>
          <p className="font-bold text-slate-600">No staff members found</p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? `No results for "${search}"` : 'Add your first team member to get started'}
          </p>
          <button onClick={() => setModal('add')}
            className="mt-5 bg-blue-950 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-900 transition-colors">
            + Add Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(m => (
            <StaffCard key={m._id} member={m} isAdmin={isAdmin}
              onEdit={openEdit} onSalary={openSalary} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal === 'add' && (
        <StaffModal
          mode="add"
          onClose={() => setModal(null)}
          onSaved={() => loadStaff()}
        />
      )}
      {modal === 'edit' && selected && (
        <StaffModal
          mode="edit"
          initial={{ ...selected, joinedDate: selected.joinedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10) }}
          onClose={() => { setModal(null); setSelected(null); }}
          onSaved={() => { loadStaff(); setModal(null); setSelected(null); }}
        />
      )}
      {modal === 'salary' && selected && (
        <SalaryModal
          member={selected}
          onClose={() => { setModal(null); setSelected(null); }}
          onSaved={() => { loadStaff(); }}
        />
      )}
    </div>
  );
}
