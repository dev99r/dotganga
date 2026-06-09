import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

const STATUS_BADGE = {
  Draft: 'badge-slate',
  Processed: 'badge-indigo',
  Paid: 'badge-success',
};

export default function PayrollMatrix() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [totals, setTotals] = useState({ gross: 0, deductions: 0, net: 0 });

  const loadPayrolls = useCallback(async (month) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll?month=${month}`);
      setPayrolls(data.payrolls);

      const gross = data.payrolls.reduce((s, p) => s + p.baseSalary, 0);
      const deductions = data.payrolls.reduce((s, p) => s + p.calculatedDeductions, 0);
      const net = data.payrolls.reduce((s, p) => s + p.finalNetPayout, 0);
      setTotals({ gross, deductions, net });
    } catch { /* no payroll generated yet */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPayrolls(selectedMonth); }, [selectedMonth, loadPayrolls]);

  const handleGenerate = async () => {
    if (!confirm(`Generate payroll for all staff for ${selectedMonth}? This will overwrite any existing Draft records.`)) return;
    setGenerating(true);
    try {
      const { data } = await api.post('/payroll/generate', { monthYear: selectedMonth });
      toast.success(`Generated for ${data.generated} staff. ${data.failed} failed.`);
      if (data.errors?.length > 0) {
        data.errors.forEach((e) => toast.error(`${e.name}: ${e.error}`, { duration: 5000 }));
      }
      loadPayrolls(selectedMonth);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payroll generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/payroll/export?month=${selectedMonth}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${selectedMonth}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded.');
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = async (payrollId, status) => {
    try {
      await api.patch(`/payroll/${payrollId}/status`, { paymentStatus: status });
      toast.success(`Marked as ${status}.`);
      loadPayrolls(selectedMonth);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleClearPayroll = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/payroll?month=${selectedMonth}`);
      toast.success(data.message || 'Payroll cleared.');
      setPayrolls([]);
      setTotals({ gross: 0, deductions: 0, net: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear payroll.');
    } finally {
      setDeleting(false);
      setShowClearModal(false);
    }
  };

  const monthLabel = format(new Date(selectedMonth + '-01'), 'MMMM yyyy');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-header">Payroll Matrix</h2>
          <p className="text-sm text-slate-500">Unified accounting ledger — generate, review, and mark payments.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            className="input-field w-auto text-sm"
            value={selectedMonth}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 3H9a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2V7l-3-4z" /></svg> Generate</>
            )}
          </button>
          <button onClick={handleExport} disabled={exporting || payrolls.length === 0} className="btn-secondary">
            {exporting ? 'Exporting...' : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export Excel</>
            )}
          </button>
          {payrolls.length > 0 && (
            <button onClick={() => setShowClearModal(true)} disabled={deleting} className="btn-danger">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Payroll
            </button>
          )}
        </div>
      </div>

      {/* Summary totals */}
      {payrolls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Gross</p>
            <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totals.gross)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Deductions</p>
            <p className="text-xl font-black text-red-600 mt-1">- {formatCurrency(totals.deductions)}</p>
          </div>
          <div className="card p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Net Payout</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(totals.net)}</p>
          </div>
        </div>
      )}

      {/* Payroll table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">
            {monthLabel} — {payrolls.length} records
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading payroll data...</div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-14 h-14 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 font-medium">No payroll generated yet for this month.</p>
            <p className="text-slate-400 text-sm mt-1">Click "Generate" to calculate payroll for all active staff.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Employee</th>
                  <th className="table-th text-right">Base</th>
                  <th className="table-th text-center">Present</th>
                  <th className="table-th text-center">Half</th>
                  <th className="table-th text-center">Leaves</th>
                  <th className="table-th text-center">Absent</th>
                  <th className="table-th text-right">Deduction</th>
                  <th className="table-th text-right">Net Pay</th>
                  <th className="table-th text-center">Status</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{p.userId?.name}</p>
                        <p className="text-xs text-slate-400">{p.userId?.designation}</p>
                      </div>
                    </td>
                    <td className="table-td text-right font-mono text-sm">{formatCurrency(p.baseSalary)}</td>
                    <td className="table-td text-center">
                      <span className="font-semibold text-emerald-600">{p.totalPresentDays}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-semibold text-amber-600">{p.totalHalfDays}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-semibold text-blue-600">{p.totalPaidLeaves}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-semibold text-red-600">{p.totalUnpaidAbsents}</span>
                    </td>
                    <td className="table-td text-right">
                      {p.calculatedDeductions > 0 ? (
                        <span className="font-mono text-sm text-red-600">- {formatCurrency(p.calculatedDeductions)}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-td text-right">
                      <span className="font-bold font-mono text-slate-900">{formatCurrency(p.finalNetPayout)}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className={`badge ${STATUS_BADGE[p.paymentStatus]}`}>{p.paymentStatus}</span>
                    </td>
                    <td className="table-td">
                      <select
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                        value={p.paymentStatus}
                        onChange={(e) => handleStatusUpdate(p._id, e.target.value)}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Processed">Processed</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Payroll Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Clear Payroll</h3>
                <p className="text-xs text-slate-500">{monthLabel}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              This will permanently delete <span className="font-bold text-slate-900">{payrolls.length} payroll record{payrolls.length !== 1 ? 's' : ''}</span> for <span className="font-bold text-slate-900">{monthLabel}</span>.
            </p>
            <p className="text-xs text-red-500 font-semibold mb-5">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleClearPayroll}
                disabled={deleting}
                className="btn-danger flex-1"
              >
                {deleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
