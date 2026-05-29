import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────
const DEPT_COLOR = {
  Sales: 'bg-violet-500', Creative: 'bg-pink-500', Marketing: 'bg-cyan-500',
  Management: 'bg-amber-500', Operations: 'bg-emerald-500', Tech: 'bg-blue-500',
};
const deptBg = d => DEPT_COLOR[d] || 'bg-slate-400';

function Avatar({ name, department, size = 'sm', online = false }) {
  const sz = { xs:'w-7 h-7 text-[10px]', sm:'w-9 h-9 text-xs', md:'w-11 h-11 text-sm' }[size];
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';
  return (
    <div className="relative inline-flex shrink-0">
      <div className={`${sz} rounded-xl ${deptBg(department)} flex items-center justify-center font-black text-white`}>
        {initials}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
      )}
    </div>
  );
}

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">
        {format(now, 'HH:mm')}
        <span className="text-slate-400 text-base ml-0.5">{format(now, ':ss')}</span>
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{format(now, 'EEE, dd MMM yyyy')}</p>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, gradient, delay = 0 }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 text-white animate-fade-in`}
      style={{ background: gradient, animationDelay: `${delay}ms` }}
    >
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />
      <div className="relative">
        <span className="text-3xl block mb-2">{icon}</span>
        <p className="text-4xl font-black tabular-nums leading-none animate-count-up">{value}</p>
        <p className="text-white/70 text-xs font-semibold mt-1.5 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-white/50 text-[10px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Attendance row card ───────────────────────────────────────────────────────
function AttendanceRow({ rec, index }) {
  const isActive = rec.signInTime && !rec.signOutTime;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Avatar name={rec.userId?.name} department={rec.userId?.department} size="sm" online={isActive} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{rec.userId?.name}</p>
        <p className="text-[10px] text-slate-400 truncate">{rec.userId?.designation}</p>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="flex items-center gap-2 justify-end">
          {rec.signInTime && (
            <span className={`font-mono text-xs font-bold ${rec.isLate ? 'text-amber-500' : 'text-emerald-500'}`}>
              ↑ {format(new Date(rec.signInTime), 'HH:mm')}
            </span>
          )}
          {rec.signOutTime && (
            <span className="font-mono text-xs font-semibold text-slate-400">
              ↓ {format(new Date(rec.signOutTime), 'HH:mm')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          {rec.isLate && <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">LATE</span>}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            rec.status === 'Full-Day' ? 'bg-emerald-100 text-emerald-700' :
            rec.status === 'Half-Day' ? 'bg-amber-100 text-amber-700'    :
            'bg-slate-100 text-slate-500'
          }`}>{rec.status}</span>
          {isActive && (
            <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">LIVE</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Leave card ────────────────────────────────────────────────────────────────
function LeaveCard({ lv, onAction, index }) {
  const [loading, setLoading] = useState(false);
  const act = async (action) => {
    setLoading(true);
    await onAction(lv._id, action);
    setLoading(false);
  };
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Avatar name={lv.userId?.name} department={lv.userId?.department} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800">{lv.userId?.name}</p>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{lv.leaveType}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {lv.startDate === lv.endDate ? lv.startDate : `${lv.startDate} → ${lv.endDate}`}
        </p>
        {lv.reason && (
          <p className="text-xs text-slate-500 italic mt-0.5 truncate">"{lv.reason}"</p>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button disabled={loading} onClick={() => act('approve')}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50">
          ✓
        </button>
        <button disabled={loading} onClick={() => act('reject')}
          className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50">
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Presence mini-avatars ─────────────────────────────────────────────────────
function PresenceBoard({ allStaff, presentIds, title, empty, color }) {
  const people = allStaff.filter(s => presentIds.has(String(s._id)));
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <span className={`text-sm font-black ${color}`}>{people.length}</span>
      </div>
      {people.length === 0 ? (
        <p className="text-xs text-slate-300 text-center py-3">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {people.map((s, i) => (
            <div key={s._id} title={s.name}
              className="flex flex-col items-center gap-1 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Avatar name={s.name} department={s.department} size="xs" online={presentIds.has(String(s._id))} />
              <span className="text-[9px] text-slate-400 font-semibold max-w-[36px] text-center truncate leading-tight">
                {s.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OperationalDeck() {
  const [summary,       setSummary]       = useState(null);
  const [allStaff,      setAllStaff]      = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [lastRefresh,   setLastRefresh]   = useState(null);
  const [refreshing,    setRefreshing]    = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [sumRes, lvRes, staffRes, repRes] = await Promise.all([
        api.get('/staff/dashboard/summary'),
        api.get('/leaves?status=Pending'),
        api.get('/staff'),
        api.get(`/daily-report?date=${today}`).catch(() => ({ data: { summary: null } })),
      ]);
      setSummary(sumRes.data);
      setPendingLeaves(lvRes.data.leaves || []);
      setAllStaff((staffRes.data.staff || []).filter(s => s.isActive && s.role !== 'Admin'));
      setReportSummary(repRes.data.summary);
      setLastRefresh(new Date());
    } catch { if (!silent) toast.error('Failed to load dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(() => loadData(true), 60000);
    return () => clearInterval(t);
  }, [loadData]);

  const handleLeave = async (id, action) => {
    try {
      await api.patch(`/leaves/${id}/${action}`);
      toast.success(`Leave ${action}d!`);
      loadData(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 rounded-3xl bg-slate-200 animate-pulse shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1,2].map(i => <div key={i} className="h-36 rounded-3xl bg-slate-100 animate-pulse" />)}
      </div>
      <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
    </div>
  );

  const s = summary?.summary || {};
  const todayAtt = summary?.todayAttendance || [];
  const presentIds = new Set(todayAtt.map(r => String(r.userId?._id || r.userId)));
  const absentStaff = allStaff.filter(s => !presentIds.has(String(s._id)));
  const liveNow = todayAtt.filter(r => r.signInTime && !r.signOutTime);

  const attendancePct = allStaff.length > 0
    ? Math.round(todayAtt.length / allStaff.length * 100)
    : 0;

  return (
    <div className="space-y-5 max-w-5xl animate-fade-in">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {allStaff.length > 0 && `${todayAtt.length} of ${allStaff.length} staff checked in today`}
            {lastRefresh && (
              <span className="ml-2 text-slate-300">· updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}</span>
            )}
          </p>
        </div>
        <div className="flex items-start gap-4">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className={`p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <LiveClock />
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <KpiCard label="On Duty Now"    value={s.onDutyNow ?? 0}
          sub={`${liveNow.length} still active`}
          icon="👥" gradient="linear-gradient(135deg,#1e3a8a,#1d4ed8)" delay={0} />
        <KpiCard label="Checked In"     value={todayAtt.length}
          sub={`${attendancePct}% of team`}
          icon="✅" gradient="linear-gradient(135deg,#065f46,#059669)" delay={60} />
        <KpiCard label="Late Today"     value={s.lateToday ?? 0}
          sub="half-day auto-applied"
          icon="⏰" gradient="linear-gradient(135deg,#92400e,#d97706)" delay={120} />
        <KpiCard label="Pending Leaves" value={s.pendingLeaves ?? 0}
          sub="need your approval"
          icon="📋" gradient="linear-gradient(135deg,#4c1d95,#7c3aed)" delay={180} />
      </div>

      {/* ── Attendance ring + daily report ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Attendance ring */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={attendancePct >= 80 ? '#10b981' : attendancePct >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${attendancePct} ${100 - attendancePct}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-slate-800">{attendancePct}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
            <p className="text-2xl font-black text-slate-900">{todayAtt.length}<span className="text-slate-300 font-normal text-base"> /{allStaff.length}</span></p>
            <p className="text-[10px] text-slate-400 mt-0.5">team members today</p>
          </div>
        </div>

        {/* Daily reports */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daily Reports</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-black text-slate-800">{reportSummary?.total ?? 0}</p>
              <p className="text-[10px] text-slate-400">Submitted</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{reportSummary?.approved ?? 0}</p>
              <p className="text-[10px] text-slate-400">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-500">{reportSummary?.pending ?? 0}</p>
              <p className="text-[10px] text-slate-400">Pending</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: reportSummary?.total > 0 ? `${Math.round(reportSummary.approved / reportSummary.total * 100)}%` : '0%' }} />
          </div>
        </div>

        {/* Team mood */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Late & Absent</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-amber-50 rounded-2xl p-2.5">
              <p className="text-2xl font-black text-amber-600">{s.lateToday ?? 0}</p>
              <p className="text-[10px] text-amber-500">Late</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-2.5">
              <p className="text-2xl font-black text-red-500">{absentStaff.length}</p>
              <p className="text-[10px] text-red-400">Not In</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Presence grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PresenceBoard
          allStaff={allStaff}
          presentIds={presentIds}
          title="✅ Checked In Today"
          empty="No one in yet"
          color="text-emerald-600"
        />
        <PresenceBoard
          allStaff={absentStaff}
          presentIds={new Set(absentStaff.map(s => s._id))}
          title="⏳ Not Checked In"
          empty="Everyone is in!"
          color="text-slate-400"
        />
      </div>

      {/* ── Live attendance feed ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="font-black text-slate-900">Today's Attendance</p>
            {liveNow.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-600">{liveNow.length} live</span>
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-slate-400">{format(new Date(), 'EEE, dd MMM')}</span>
        </div>

        {todayAtt.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">☕</p>
            <p className="font-bold text-slate-500">No check-ins yet</p>
            <p className="text-xs text-slate-400 mt-1">Staff arrivals will appear here in real time</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Sort: active first, then by sign-in time */}
            {[...todayAtt]
              .sort((a, b) => {
                const aActive = a.signInTime && !a.signOutTime ? 1 : 0;
                const bActive = b.signInTime && !b.signOutTime ? 1 : 0;
                if (aActive !== bActive) return bActive - aActive;
                return new Date(b.signInTime) - new Date(a.signInTime);
              })
              .map((rec, i) => <AttendanceRow key={rec._id} rec={rec} index={i} />)
            }
          </div>
        )}
      </div>

      {/* ── Leave approvals ── */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="font-black text-slate-900">Leave Requests</p>
            <span className="text-xs font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
              {pendingLeaves.length} pending
            </span>
          </div>
          <div>
            {pendingLeaves.map((lv, i) => (
              <LeaveCard key={lv._id} lv={lv} onAction={handleLeave} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── All present / celebration ── */}
      {allStaff.length > 0 && todayAtt.length === allStaff.length && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl px-6 py-5 text-white text-center animate-scale-in shadow-xl shadow-emerald-500/20">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-black text-lg">Full house today!</p>
          <p className="text-emerald-100 text-sm mt-1">All {allStaff.length} team members have checked in</p>
        </div>
      )}
    </div>
  );
}
