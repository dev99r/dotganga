import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { format, subDays, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';

const STATUS_META = {
  'Full-Day': { bg: 'bg-emerald-500', text: 'Full',  light: 'bg-emerald-50 text-emerald-700' },
  'Half-Day': { bg: 'bg-amber-400',   text: 'Half',  light: 'bg-amber-50 text-amber-700'     },
  'Leave':    { bg: 'bg-blue-400',    text: 'Leave', light: 'bg-blue-50 text-blue-700'       },
  'Absent':   { bg: 'bg-red-400',     text: 'Abs',   light: 'bg-red-50 text-red-700'         },
};

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {Object.entries(STATUS_META).map(([k, v]) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-sm ${v.bg}`} />
          <span className="text-slate-500">{k}</span>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-slate-200" />
        <span className="text-slate-500">No record</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-slate-100 border border-dashed border-slate-300" />
        <span className="text-slate-500">Weekend</span>
      </span>
    </div>
  );
}

function Cell({ record, date }) {
  const [tip, setTip] = useState(false);
  const wkend = isWeekend(parseISO(date));

  if (wkend) {
    return (
      <td className="px-0.5 py-0.5 text-center">
        <div className="w-8 h-6 rounded bg-slate-100 border border-dashed border-slate-200 mx-auto" />
      </td>
    );
  }

  if (!record) {
    return (
      <td className="px-0.5 py-0.5 text-center">
        <div className="w-8 h-6 rounded bg-slate-200 mx-auto opacity-50" />
      </td>
    );
  }

  const meta = STATUS_META[record.status] || STATUS_META['Absent'];
  return (
    <td className="px-0.5 py-0.5 text-center relative">
      <div
        className={`w-8 h-6 rounded ${meta.bg} mx-auto cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
      >
        <span className="text-white text-[9px] font-bold leading-none">{meta.text}</span>
      </div>
      {tip && (
        <div className="absolute z-50 bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap shadow-xl pointer-events-none min-w-max">
          <p className="font-bold">{record.status}</p>
          {record.signInTime && <p>In: {format(new Date(record.signInTime), 'HH:mm')}</p>}
          {record.signOutTime && <p>Out: {format(new Date(record.signOutTime), 'HH:mm')}</p>}
          {record.workingHours > 0 && <p>{record.workingHours}h worked</p>}
          {record.isLate && <p className="text-amber-300">⚠ Late</p>}
          {record.remarks && <p className="text-slate-300 italic">{record.remarks}</p>}
        </div>
      )}
    </td>
  );
}

export default function MonthlyAttendanceGrid() {
  const [days,    setDays]    = useState(30);
  const [staff,   setStaff]   = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const [sRes, aRes] = await Promise.all([
          api.get('/staff'),
          startMonth === endMonth
            ? api.get(`/attendance/report?month=${startMonth}`)
            : Promise.all([
                api.get(`/attendance/report?month=${startMonth}`),
                api.get(`/attendance/report?month=${endMonth}`),
              ]).then(([r1, r2]) => ({
                data: { attendance: [...r1.data.attendance, ...r2.data.attendance] },
              })),
        ]);
        setStaff(sRes.data.staff || []);
        setRecords(aRes.data.attendance || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [days, startMonth, endMonth]);

  // Build lookup: userId → date → record
  const lookup = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const uid = r.userId?._id || r.userId;
      if (!map[uid]) map[uid] = {};
      map[uid][r.date] = r;
    });
    return map;
  }, [records]);

  // Per-person stats
  const stats = useMemo(() => {
    const result = {};
    staff.forEach(s => {
      const recs = Object.values(lookup[s._id] || {});
      const workDays = dates.filter(d => !isWeekend(parseISO(d))).length;
      result[s._id] = {
        present:  recs.filter(r => r.status === 'Full-Day').length,
        half:     recs.filter(r => r.status === 'Half-Day').length,
        leave:    recs.filter(r => r.status === 'Leave').length,
        late:     recs.filter(r => r.isLate).length,
        workDays,
        absent:   Math.max(0, workDays - recs.filter(r => r.status !== 'Absent').length),
      };
    });
    return result;
  }, [staff, lookup, dates]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Attendance Grid</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {format(parseISO(dates[0]), 'dd MMM')} – {format(parseISO(dates[dates.length - 1]), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(n => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === n
                  ? 'bg-blue-950 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n}D
            </button>
          ))}
        </div>
      </div>

      <Legend />

      {/* Summary cards */}
      {staff.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Avg Attendance', value: `${Math.round(staff.reduce((acc, s) => acc + (stats[s._id]?.present || 0), 0) / staff.length * 10) / 10}d`, color: 'text-emerald-600' },
            { label: 'Total Half-Days', value: staff.reduce((acc, s) => acc + (stats[s._id]?.half || 0), 0), color: 'text-amber-600' },
            { label: 'Total Late', value: staff.reduce((acc, s) => acc + (stats[s._id]?.late || 0), 0), color: 'text-orange-600' },
            { label: 'On Leave (total)', value: staff.reduce((acc, s) => acc + (stats[s._id]?.leave || 0), 0), color: 'text-blue-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable grid */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: `${180 + dates.length * 38}px` }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {/* Name column */}
                <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[170px] border-r border-slate-100">
                  Staff Member
                </th>
                {/* Stats column */}
                <th className="sticky left-[170px] z-20 bg-slate-50 px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[90px] border-r border-slate-200">
                  Summary
                </th>
                {/* Date columns */}
                {dates.map(d => {
                  const wkend = isWeekend(parseISO(d));
                  const dayNum = format(parseISO(d), 'd');
                  const dayName = format(parseISO(d), 'EEE');
                  return (
                    <th
                      key={d}
                      className={`px-0.5 py-2 text-center min-w-[38px] ${
                        wkend ? 'bg-slate-50/50' : 'bg-slate-50'
                      }`}
                    >
                      <div className={`text-[10px] font-bold ${wkend ? 'text-slate-300' : 'text-slate-500'}`}>{dayNum}</div>
                      <div className={`text-[9px] ${wkend ? 'text-slate-300' : 'text-slate-400'}`}>{dayName}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, idx) => {
                const st = stats[s._id] || {};
                const pct = st.workDays > 0 ? Math.round((st.present + st.half * 0.5) / st.workDays * 100) : 0;
                return (
                  <tr key={s._id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    {/* Name */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-slate-100" style={{ background: idx % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.3)' }}>
                      <p className="font-bold text-sm text-slate-800 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{s.designation}</p>
                    </td>
                    {/* Stats */}
                    <td className="sticky left-[170px] z-10 px-2 py-2 border-r border-slate-200 text-center" style={{ background: idx % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.3)' }}>
                      <div className={`text-sm font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {pct}%
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight">
                        <span className="text-emerald-500">{st.present}P</span>
                        {' · '}
                        <span className="text-amber-500">{st.half}H</span>
                        {st.late > 0 && <><br /><span className="text-orange-400">{st.late} late</span></>}
                      </div>
                    </td>
                    {/* Day cells */}
                    {dates.map(d => (
                      <Cell key={d} record={lookup[s._id]?.[d]} date={d} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {staff.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold">No staff found</p>
          </div>
        )}
      </div>
    </div>
  );
}
