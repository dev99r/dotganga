import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, differenceInCalendarDays } from 'date-fns';

const STATUS_CONFIG = {
  Approved: { badge: 'badge-success',  bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
  Pending:  { badge: 'badge-warning',  bar: 'bg-amber-400',   dot: 'bg-amber-400'   },
  Rejected: { badge: 'badge-danger',   bar: 'bg-red-400',     dot: 'bg-red-400'     },
};

const LEAVE_CONFIG = {
  Casual:          { icon: '🌿', color: 'bg-emerald-50 border-emerald-100' },
  Sick:            { icon: '🏥', color: 'bg-red-50 border-red-100' },
  'Half-Day Leave':{ icon: '⏰', color: 'bg-amber-50 border-amber-100' },
};

function LeaveCard({ leave, onWithdraw }) {
  const days = differenceInCalendarDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
  const cfg  = STATUS_CONFIG[leave.status] || { badge: 'badge-slate', bar: 'bg-slate-300', dot: 'bg-slate-300' };
  const lCfg = LEAVE_CONFIG[leave.leaveType] || { icon: '📋', color: 'bg-slate-50 border-slate-100' };

  return (
    <div className={`rounded-2xl border p-4 animate-fade-in ${lCfg.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center text-xl shrink-0 shadow-sm">
            {lCfg.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900">{leave.leaveType}</span>
              <span className={`badge ${cfg.badge}`}>{leave.status}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {leave.startDate === leave.endDate
                ? format(new Date(leave.startDate), 'dd MMM yyyy')
                : `${format(new Date(leave.startDate), 'dd MMM')} – ${format(new Date(leave.endDate), 'dd MMM yyyy')}`}
              <span className="ml-1.5 text-slate-400 font-normal">({days} {days === 1 ? 'day' : 'days'})</span>
            </p>
            {leave.reason && (
              <p className="text-xs text-slate-500 mt-1 italic">"{leave.reason}"</p>
            )}
            {leave.adminRemarks && (
              <p className="text-xs text-blue-700 font-semibold mt-1">Admin: {leave.adminRemarks}</p>
            )}
          </div>
        </div>

        {leave.status === 'Pending' && (
          <button onClick={() => onWithdraw(leave._id)}
            className="shrink-0 text-xs text-red-500 hover:text-red-700 font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-red-100 transition-colors">
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}

export default function LeaveManager() {
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ leaveType: 'Casual', startDate: today, endDate: today, reason: '' });

  const loadLeaves = useCallback(async () => {
    try {
      const { data } = await api.get('/leaves/my');
      setLeaves(data.leaves);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim() || form.reason.length < 5) {
      toast.error('Please provide a reason (min 5 characters).');
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('Start date cannot be after end date.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave application submitted!');
      setShowForm(false);
      setForm({ leaveType: 'Casual', startDate: today, endDate: today, reason: '' });
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave.');
    } finally { setSubmitting(false); }
  };

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this leave application?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      toast.success('Leave withdrawn.');
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw.');
    }
  };

  const pending  = leaves.filter(l => l.status === 'Pending').length;
  const approved = leaves.filter(l => l.status === 'Approved').length;
  const rejected = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 stagger">
        <div className="card p-3.5 text-center">
          <p className="text-2xl font-black text-slate-900 tabular-nums">{leaves.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total</p>
        </div>
        <div className="card p-3.5 text-center">
          <p className="text-2xl font-black text-amber-600 tabular-nums">{pending}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Pending</p>
        </div>
        <div className="card p-3.5 text-center">
          <p className="text-2xl font-black text-emerald-600 tabular-nums">{approved}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Approved</p>
        </div>
      </div>

      {/* Apply / Form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full btn-primary py-3.5 text-base">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Apply for Leave
        </button>
      ) : (
        <div className="card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-black text-slate-900">New Leave Application</p>
              <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
            </div>
            <button onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave type pills */}
            <div>
              <label className="label">Leave Type</label>
              <div className="flex gap-2">
                {['Casual', 'Sick', 'Half-Day Leave'].map(type => (
                  <button key={type} type="button"
                    onClick={() => setForm({ ...form, leaveType: type })}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      form.leaveType === type
                        ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className="block text-base mb-0.5">{LEAVE_CONFIG[type]?.icon}</span>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From</label>
                <input type="date" className="input-field" value={form.startDate} min={today}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input-field" value={form.endDate} min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            {/* Duration preview */}
            {form.startDate && form.endDate && new Date(form.startDate) <= new Date(form.endDate) && (
              <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700 font-semibold">
                {(() => {
                  const d = differenceInCalendarDays(new Date(form.endDate), new Date(form.startDate)) + 1;
                  return `${d} ${d === 1 ? 'day' : 'days'} of ${form.leaveType}`;
                })()}
              </div>
            )}

            <div>
              <label className="label">Reason</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Brief description of the reason (min 5 chars)..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <p className="text-[10px] text-slate-400 mt-1 text-right">{form.reason.length} chars</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3">
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                ) : 'Submit Application'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-3">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Leave history */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 px-1">
          Your Leave History
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : leaves.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">🌴</div>
            <p className="font-bold text-slate-700">No Leaves Yet</p>
            <p className="text-slate-400 text-sm mt-1">Apply for your first leave above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <LeaveCard key={leave._id} leave={leave} onWithdraw={handleWithdraw} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
