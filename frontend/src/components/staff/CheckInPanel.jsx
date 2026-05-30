import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, formatDistanceStrict } from 'date-fns';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const STATUS_STYLE = {
  'Full-Day': { ring: 'ring-emerald-400', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Full Day'  },
  'Half-Day': { ring: 'ring-amber-400',   bg: 'bg-amber-50',   dot: 'bg-amber-500',   text: 'text-amber-700',   label: 'Half Day'  },
  'Leave':    { ring: 'ring-blue-400',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    text: 'text-blue-700',    label: 'On Leave'  },
  'Absent':   { ring: 'ring-red-400',     bg: 'bg-red-50',     dot: 'bg-red-500',     text: 'text-red-700',     label: 'Absent'    },
};

export default function CheckInPanel({ company }) {
  const now                         = useClock();
  const [record,     setRecord]     = useState(null);
  const [recLoading, setRecLoading] = useState(true);
  const [busy,       setBusy]       = useState(false);

  const loadToday = useCallback(async () => {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get(`/attendance/my?month=${month}`);
      setRecord(data.attendance?.find(r => r.date === today) || null);
    } catch {}
    finally { setRecLoading(false); }
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/attendance/checkin', {});
      toast.success(data.message);
      setRecord(data.attendance);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
    } finally { setBusy(false); }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      const { data } = await api.put('/attendance/checkout');
      toast.success(data.message);
      setRecord(data.attendance);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed.');
    } finally { setBusy(false); }
  };

  const isIn  = !!record?.signInTime;
  const isOut = !!record?.signOutTime;
  const sc    = record ? STATUS_STYLE[record.status] : null;
  const liveDuration = isIn && !isOut
    ? formatDistanceStrict(new Date(record.signInTime), now)
    : null;

  const shiftStart = company?.officeStartTime || '09:30';
  const shiftEnd   = company?.officeEndTime   || '18:30';

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

      {/* Hero clock card */}
      <div className="relative overflow-hidden rounded-3xl bg-blue-950 text-white p-6 shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">
            {format(now, 'EEEE, dd MMMM yyyy')}
          </p>
          <p className="text-6xl font-black mt-1 tabular-nums tracking-tight leading-none">
            {format(now, 'HH:mm')}
            <span className="text-2xl text-blue-400 font-mono ml-1">{format(now, 'ss')}</span>
          </p>
          {company && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-200 font-mono">{shiftStart} – {shiftEnd}</span>
              </div>
              <span className="text-blue-600">·</span>
              <span className="text-blue-300 text-xs">{company.officeName}</span>
              <span className="ml-auto text-[10px] text-blue-400">Grace {company.gracePeriodMinutes}m</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's status */}
      {!recLoading && record && sc && (
        <div className={`rounded-2xl p-4 ${sc.bg} ring-1 ${sc.ring}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${sc.dot} ${!isOut ? 'animate-pulse' : ''}`} />
              <div>
                <p className={`font-bold text-sm ${sc.text}`}>{sc.label}</p>
                {record.remarks && <p className={`text-xs ${sc.text} opacity-70 mt-0.5`}>{record.remarks}</p>}
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              {record.signInTime  && <p className="text-slate-600">In&nbsp;&nbsp;<b className="font-mono">{format(new Date(record.signInTime), 'HH:mm')}</b></p>}
              {record.signOutTime && <p className="text-slate-600">Out <b className="font-mono">{format(new Date(record.signOutTime), 'HH:mm')}</b></p>}
              {liveDuration && <p className="text-emerald-600 font-semibold">{liveDuration}</p>}
              {record.workingHours > 0 && <p className="text-slate-500">{record.workingHours}h total</p>}
            </div>
          </div>
          {record.isLate && (
            <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
              <span>⚠</span> Late arrival recorded
            </div>
          )}
        </div>
      )}

      {/* Action button */}
      {recLoading ? (
        <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
      ) : !isIn ? (
        <button onClick={handleSignIn} disabled={busy}
          className="w-full relative overflow-hidden rounded-3xl bg-blue-950 text-white py-8 font-black text-2xl shadow-2xl active:scale-[0.97] transition-all duration-150 disabled:opacity-50">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          <span className="relative flex flex-col items-center gap-1">
            {busy ? (
              <><div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /><span className="text-lg">Signing In…</span></>
            ) : (
              <><span className="text-4xl">👆</span><span>Tap to Sign In</span></>
            )}
          </span>
          <p className="relative text-blue-300 text-xs font-normal mt-1 text-center tabular-nums">{format(now, 'HH:mm:ss')}</p>
        </button>
      ) : !isOut ? (
        <button onClick={handleSignOut} disabled={busy}
          className="w-full rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white py-8 font-black text-2xl shadow-2xl active:scale-[0.97] transition-all duration-150 disabled:opacity-60">
          <span className="flex flex-col items-center gap-1">
            {busy ? (
              <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="text-lg">Signing Out…</span></>
            ) : (
              <>
                <span className="relative flex h-4 w-4 mb-1">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative h-4 w-4 rounded-full bg-white" />
                </span>
                On Duty · Tap to Sign Out
              </>
            )}
          </span>
          {liveDuration && !busy && (
            <p className="text-emerald-100 text-xs font-normal mt-1 text-center">Working for {liveDuration}</p>
          )}
        </button>
      ) : (
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 text-center shadow-xl">
          <p className="text-5xl mb-3">🎉</p>
          <p className="font-black text-2xl">Shift Complete!</p>
          <p className="text-slate-300 text-sm mt-1">{record.workingHours}h worked today — great job!</p>
          <div className="mt-4 flex justify-center gap-8 text-xs text-slate-400">
            <span>In <b className="text-white font-mono">{format(new Date(record.signInTime), 'HH:mm')}</b></span>
            <span>Out <b className="text-white font-mono">{format(new Date(record.signOutTime), 'HH:mm')}</b></span>
          </div>
        </div>
      )}

      {/* Shift info strip */}
      {company && !isIn && !recLoading && (
        <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⏰</span>
          <p className="text-xs text-blue-800 leading-relaxed">
            Shift: <b>{shiftStart}</b> – <b>{shiftEnd}</b> · Grace period: <b>{company.gracePeriodMinutes} min</b>
          </p>
        </div>
      )}
    </div>
  );
}
