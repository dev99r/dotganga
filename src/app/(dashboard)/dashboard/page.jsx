'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const STAGE_COLORS = {
  'New': '#6366f1',
  'Contacted': '#a855f7',
  'Qualified': '#f59e0b',
  'Proposal': '#f97316',
  'Closed Won': '#10b981',
  'Closed Lost': '#ef4444',
};

const SOURCE_COLORS = ['#6366f1','#a855f7','#f59e0b','#10b981','#f97316','#06b6d4','#ec4899'];

function KPI({ label, value, sub, color = 'text-slate-100', accent, pulse }) {
  return (
    <div className="card p-5 flex flex-col gap-1 relative overflow-hidden">
      {accent && <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl`} style={{ background: accent }} />}
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black ${color} mt-0.5`}>
        {value}
        {pulse && value > 0 && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-danger animate-pulse-dot" />}
      </p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-100 border border-border rounded-xl px-3 py-2 text-xs">
      <p className="text-muted mb-1">{label}</p>
      <p className="text-primary-light font-bold">{payload[0].value} leads</p>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/leads?limit=8&sort=-createdAt').then(r => r.json()),
      fetch('/api/leads?limit=20&todayFollowUp=true').then(r => r.json()),
      fetch('/api/leads?limit=20&overdueFollowUp=true').then(r => r.json()),
    ]).then(([s, l, tf, of]) => {
      if (s.success) setStats(s.stats);
      if (l.success) setRecent(l.leads);
      if (tf.success) setTodayFollowUps(tf.leads);
      if (of.success) setOverdueFollowUps(of.leads);
    }).finally(() => setLoading(false));
  }, []);

  // Fill missing days in week trend
  const weekTrend = (() => {
    if (!stats?.weekTrend) return [];
    const map = Object.fromEntries(stats.weekTrend.map(d => [d._id, d.count]));
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key.slice(5), count: map[key] || 0 });
    }
    return days;
  })();

  const stageData = stats ? Object.entries(stats.stageCounts || {}).map(([name, value]) => ({ name, value })) : [];
  const sourceData = stats ? Object.entries(stats.sourceCounts || {}).map(([name, value]) => ({ name, value })) : [];

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="skeleton h-64 rounded-2xl lg:col-span-2" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">Real-time leads overview</p>
        </div>
        {stats?.unclaimed15min > 0 && (
          <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger text-sm font-semibold px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
            {stats.unclaimed15min} unclaimed {stats.unclaimed15min === 1 ? 'lead' : 'leads'} &gt;15 min
          </div>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPI label="Total Leads"  value={stats?.totalLeads ?? 0}  accent="#6366f1" />
        <KPI label="Today"        value={stats?.todayLeads ?? 0}  accent="#10b981" color="text-success" />
        <KPI label="This Month"   value={stats?.monthLeads ?? 0}  accent="#f59e0b" />
        <KPI label="Avg Score"    value={`${stats?.avgScore ?? 0}`} sub="out of 100" accent="#a855f7" />
        <KPI label="Unclaimed"    value={stats?.unclaimed15min ?? 0} sub=">15 min old" color={stats?.unclaimed15min > 0 ? 'text-danger' : 'text-slate-100'} accent="#ef4444" pulse />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly trend */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-bold text-slate-300 mb-4">Leads — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#leadGrad)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage distribution */}
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-300 mb-4">Pipeline Stages</p>
          {stageData.length === 0
            ? <p className="text-muted text-sm text-center py-8">No data yet</p>
            : (
              <div className="space-y-2.5">
                {stageData.sort((a,b) => b.value - a.value).map(({ name, value }) => {
                  const total = stageData.reduce((s,d)=>s+d.value,0);
                  const pct   = total > 0 ? Math.round(value/total*100) : 0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{name}</span>
                        <span className="text-slate-300 font-semibold">{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-50">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: STAGE_COLORS[name] || '#6366f1' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Follow-up alerts */}
      {(overdueFollowUps.length > 0 || todayFollowUps.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue */}
          {overdueFollowUps.length > 0 && (
            <div className="card border-danger/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  <p className="text-sm font-bold text-danger">Overdue Follow-ups</p>
                </div>
                <a href="/leads?quickFilter=overdue" className="text-xs text-danger/70 hover:text-danger">View all →</a>
              </div>
              <div className="divide-y divide-border/40">
                {overdueFollowUps.slice(0, 5).map(lead => (
                  <a key={lead._id} href={`/leads?id=${lead._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-danger/15 flex items-center justify-center text-danger text-xs font-black shrink-0">
                      {lead.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{lead.name}</p>
                      <p className="text-[11px] text-muted">{lead.phone || lead.email || '—'}</p>
                    </div>
                    {lead.phone && (
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    )}
                    <p className="text-[10px] text-danger font-semibold shrink-0">
                      {new Date(lead.nextFollowUp).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {todayFollowUps.length > 0 && (
            <div className="card border-orange-500/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <p className="text-sm font-bold text-orange-400">Today's Follow-ups</p>
                </div>
                <a href="/leads" className="text-xs text-orange-400/70 hover:text-orange-400">View all →</a>
              </div>
              <div className="divide-y divide-border/40">
                {todayFollowUps.slice(0, 5).map(lead => (
                  <a key={lead._id} href={`/leads?id=${lead._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 text-xs font-black shrink-0">
                      {lead.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{lead.name}</p>
                      <p className="text-[11px] text-muted">{lead.phone || lead.email || '—'}</p>
                    </div>
                    {lead.phone && (
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    )}
                    <StageBadge stage={lead.stage} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source breakdown + Recent leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Source */}
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-300 mb-4">Lead Sources</p>
          {sourceData.length === 0
            ? <p className="text-muted text-sm text-center py-8">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sourceData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #1e1e2e', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Recent leads */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-300">Recent Leads</p>
            <a href="/leads" className="text-xs text-primary-light hover:underline">View all →</a>
          </div>
          {recent.length === 0
            ? <p className="text-muted text-sm text-center py-8">No leads yet — import some!</p>
            : (
              <div className="space-y-2">
                {recent.map(lead => (
                  <a key={lead._id} href={`/leads?id=${lead._id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light text-xs font-black shrink-0">
                      {lead.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{lead.name}</p>
                      <p className="text-[11px] text-muted truncate">{lead.company || lead.phone || lead.email || '—'}</p>
                    </div>
                    <StageBadge stage={lead.stage} />
                    <ScoreDot score={lead.score} />
                  </a>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

export function StageBadge({ stage }) {
  const cfg = {
    'New':         'bg-blue-500/10 text-blue-400',
    'Contacted':   'bg-purple-500/10 text-purple-400',
    'Qualified':   'bg-yellow-500/10 text-yellow-400',
    'Proposal':    'bg-orange-500/10 text-orange-400',
    'Closed Won':  'bg-success/10 text-success',
    'Closed Lost': 'bg-danger/10 text-danger',
  };
  return <span className={`badge text-[10px] ${cfg[stage] || 'bg-surface-50 text-muted'}`}>{stage}</span>;
}

export function ScoreDot({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1 shrink-0">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-muted">{score}</span>
    </div>
  );
}
