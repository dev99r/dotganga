import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { format, subDays, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';

const STATUS_STYLE = {
  'Full-Day': { dot: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700',  label: 'Full Day'  },
  'Half-Day': { dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700',    label: 'Half Day'  },
  'Leave':    { dot: 'bg-blue-400',    bg: 'bg-blue-50',     text: 'text-blue-700',     label: 'Leave'     },
  'Absent':   { dot: 'bg-red-400',     bg: 'bg-red-50',      text: 'text-red-700',      label: 'Absent'    },
};

const CELL = {
  'Full-Day': 'bg-emerald-500 text-white',
  'Half-Day': 'bg-amber-400 text-white',
  'Leave':    'bg-blue-400 text-white',
  'Absent':   'bg-red-100 text-red-400',
};

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days,    setDays]    = useState(30);
  const [selected, setSelected] = useState(null);

  const dates = useMemo(() => {
    const end   = new Date();
    const start = subDays(end, days - 1);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [days]);

  const startMonth = dates[0].slice(0, 7);
  const endMonth   = dates[dates.length - 1].slice(0, 7);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const months = startMonth === endMonth ? [startMonth] : [startMonth, endMonth];
        const results = await Promise.all(months.map(m => api.get(`/attendance/my?month=${m}`)));
        const all = results.flatMap(r => r.data.attendance || []);
        setRecords(all);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [days, startMonth, endMonth]);

  const byDate = useMemo(() => {
    const m = {};
    records.forEach(r => { m[r.date] = r; });
    return m;
  }, [records]);

  const workDays = dates.filter(d => !isWeekend(parseISO(d)));
  const present  = records.filter(r => r.status === 'Full-Day' && dates.includes(r.date)).length;
  const half     = records.filter(r => r.status === 'Half-Day' && dates.includes(r.date)).length;
  const onLeave  = records.filter(r => r.status === 'Leave'    && dates.includes(r.date)).length;
  const late     = records.filter(r => r.isLate                && dates.includes(r.date)).length;
  const absent   = Math.max(0, workDays.length - present - half - onLeave);
  const pct      = workDays.length > 0 ? Math.round((present + half * 0.5) / workDays.length * 100) : 0;

  const totalHours = records
    .filter(r => dates.includes(r.date))
    .reduce((acc, r) => acc + (r.workingHours || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-900">Attendance History</h2>
        <div className="flex gap-1.5">
          {[7, 14, 30].map(n => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                days === n ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {n}D
            </button>
          ))}
        </div>
      </div>

      {/* Attendance % hero */}
      <div className="relative overflow-hidden rounded-3xl bg-blue-950 text-white p-5">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-blue-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black">{pct}%</span>
            </div>
          </div>
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
              Last {days} days
            </p>
            <p className="text-2xl font-black mt-0.5">
              {present + half} <span className="text-blue-400 text-base font-semibold">/ {workDays.length} days</span>
            </p>
            <p className="text-blue-300 text-xs mt-1">{Math.round(totalHours * 10) / 10}h total · {late} late arrival{late !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Full Day', val: present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Half Day', val: half,    color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { label: 'Leave',    val: onLeave, color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Absent',   val: absent,  color: 'text-red-600',     bg: 'bg-red-50'     },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-bold mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>

        {/* Grid of dates — pad to start on correct weekday */}
        {(() => {
          const firstDay = parseISO(dates[0]);
          const startOffset = firstDay.getDay(); // 0=Sun
          const cells = [];
          for (let i = 0; i < startOffset; i++) cells.push(<div key={`pad-${i}`} />);
          dates.forEach(d => {
            const rec = byDate[d];
            const wkend = isWeekend(parseISO(d));
            const dayNum = format(parseISO(d), 'd');
            const isSelected = selected === d;

            cells.push(
              <button
                key={d}
                onClick={() => setSelected(isSelected ? null : d)}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  wkend
                    ? 'bg-slate-50 text-slate-300'
                    : rec
                    ? `${CELL[rec.status]} shadow-sm`
                    : 'bg-slate-100 text-slate-400'
                } ${isSelected ? 'ring-2 ring-blue-950 ring-offset-1' : ''}`}
              >
                {dayNum}
              </button>
            );
          });
          return <div className="grid grid-cols-7 gap-1">{cells}</div>;
        })()}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400">
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-sm ${v.dot}`} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && byDate[selected] && (() => {
        const r  = byDate[selected];
        const st = STATUS_STYLE[r.status] || STATUS_STYLE['Absent'];
        return (
          <div className={`rounded-2xl p-4 ${st.bg} border border-current/10`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${st.text} opacity-70`}>
                  {format(parseISO(selected), 'EEEE, dd MMM yyyy')}
                </p>
                <p className={`text-lg font-black ${st.text} mt-0.5`}>{st.label}</p>
                {r.remarks && <p className={`text-xs ${st.text} opacity-70 mt-1`}>{r.remarks}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex gap-5 text-sm">
              {r.signInTime  && <span className={st.text}>In <b className="font-mono">{format(new Date(r.signInTime), 'HH:mm')}</b></span>}
              {r.signOutTime && <span className={st.text}>Out <b className="font-mono">{format(new Date(r.signOutTime), 'HH:mm')}</b></span>}
              {r.workingHours > 0 && <span className={`${st.text} opacity-80`}>{r.workingHours}h worked</span>}
            </div>
            {r.isLate && <p className="mt-2 text-amber-600 text-xs font-semibold">⚠ Late arrival recorded</p>}
          </div>
        );
      })()}

      {/* Recent list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Recent Records</p>
        {dates
          .slice()
          .reverse()
          .filter(d => byDate[d])
          .slice(0, 10)
          .map(d => {
            const r  = byDate[d];
            const st = STATUS_STYLE[r.status] || STATUS_STYLE['Absent'];
            return (
              <div key={d} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${st.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                  <div>
                    <p className={`text-sm font-bold ${st.text}`}>{format(parseISO(d), 'EEE, dd MMM')}</p>
                    {r.isLate && <p className="text-[10px] text-amber-600 font-semibold">Late</p>}
                  </div>
                </div>
                <div className="text-right text-xs">
                  {r.signInTime  && <p className={`font-mono ${st.text}`}>{format(new Date(r.signInTime), 'HH:mm')}</p>}
                  {r.workingHours > 0 && <p className={`${st.text} opacity-70`}>{r.workingHours}h</p>}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
