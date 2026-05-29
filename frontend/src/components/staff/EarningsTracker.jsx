import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function Ring({ pct }) {
  const r = 36, c = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * c;
  return (
    <svg width="88" height="88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="white" strokeWidth="7"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-3.5 ${color}`}>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-semibold mt-0.5 opacity-70">{label}</p>
    </div>
  );
}

export default function EarningsTracker() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [history, setHistory] = useState([]);

  const loadPreview = async (month) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll/my/preview?month=${month}`);
      setPreview(data.preview);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('Salary profile')) toast.error('No salary profile. Contact admin.', { id: 'no-salary' });
      setPreview(null);
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/payroll/my');
      setHistory(data.payrolls);
    } catch {}
  };

  useEffect(() => { loadPreview(selectedMonth); loadHistory(); }, []);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonth === currentMonthStr;
  const pct = preview ? Math.round((preview.payableDays / preview.totalCalendarDays) * 100) : 0;

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Month picker */}
      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Viewing</p>
          <p className="font-black text-slate-900">{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
        </div>
        <input type="month" value={selectedMonth} max={currentMonthStr}
          onChange={(e) => { setSelectedMonth(e.target.value); loadPreview(e.target.value); }}
          className="input-field w-auto text-sm px-3 py-1.5" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : !preview ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-bold text-slate-700">No Salary Profile</p>
          <p className="text-slate-400 text-sm mt-1">Contact your administrator to set up payroll.</p>
        </div>
      ) : (
        <>
          {/* Hero earnings card */}
          <div className="relative overflow-hidden rounded-3xl bg-blue-950 text-white p-6 shadow-xl">
            <div className="absolute -top-8 -right-8 w-44 h-44 bg-blue-700/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-6 w-36 h-36 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">
                  {isCurrentMonth ? 'Projected Take-Home' : 'Net Payout'}
                </p>
                <p className="text-4xl font-black mt-1 tabular-nums">{fmt(preview.finalNetPayout)}</p>

                <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Base Salary</span>
                    <span className="font-semibold">{fmt(preview.baseSalary)}</span>
                  </div>
                  {preview.allowances > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300">Allowances</span>
                      <span className="font-semibold text-emerald-300">+{fmt(preview.allowances)}</span>
                    </div>
                  )}
                  {preview.calculatedDeductions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300">Deductions</span>
                      <span className="font-semibold text-red-300">-{fmt(preview.calculatedDeductions)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex-shrink-0">
                <Ring pct={pct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black tabular-nums">{pct}%</span>
                  <span className="text-[9px] text-blue-300 font-bold">PAYABLE</span>
                </div>
              </div>
            </div>

            <div className="relative mt-3 text-xs text-blue-400 text-center">
              {preview.payableDays} payable days of {preview.totalCalendarDays} calendar days
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 stagger">
            <StatPill label="Full Days Present" value={preview.totalPresentDays} color="bg-emerald-50 text-emerald-800" />
            <StatPill label="Half Days" value={preview.totalHalfDays} color="bg-amber-50 text-amber-800" />
            <StatPill label="Paid Leaves" value={preview.totalPaidLeaves} color="bg-blue-50 text-blue-800" />
            <StatPill label="Unpaid Absents" value={preview.totalUnpaidAbsents} color="bg-red-50 text-red-800" />
          </div>

          {/* Deductions breakdown */}
          {preview.calculatedDeductions > 0 && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Deductions</p>
                <p className="text-2xl font-black text-red-700 mt-0.5">-{fmt(preview.calculatedDeductions)}</p>
                <p className="text-xs text-red-500 mt-1">Daily rate: {fmt(preview.dailyWageRate)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payroll history */}
      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Payroll History</p>
          </div>
          <div className="divide-y divide-slate-50">
            {history.slice(0, 6).map((p) => (
              <div key={p._id} className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {format(new Date(p.monthYear + '-01'), 'MMMM yyyy')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.totalPresentDays}d present · {p.totalHalfDays}d half</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{fmt(p.finalNetPayout)}</p>
                  <span className={`badge text-[10px] mt-1 ${
                    p.paymentStatus === 'Paid' ? 'badge-success' :
                    p.paymentStatus === 'Processed' ? 'badge-indigo' : 'badge-slate'
                  }`}>{p.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
