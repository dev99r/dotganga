'use client';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const TABS = ['Overview', 'Campaigns', 'Performance'];

const RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '14 Days', value: '14d' },
  { label: '30 Days', value: '30d' },
];

const OUTCOME_COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#10b981', '#f97316', '#06b6d4'];

function KpiTile({ label, value, sub, color = 'text-slate-100', accent }) {
  return (
    <div className="card p-4 relative overflow-hidden">
      {accent && <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accent }} />}
      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-100 border border-border rounded-xl px-3 py-2.5 text-xs space-y-1">
      <p className="text-muted font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name === 'spend' ? `₹${p.value.toLocaleString()}` : p.value} {p.name}
        </p>
      ))}
    </div>
  );
};

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-surface-50 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function AdSetRow({ as }) {
  const isActive = as.status === 'ACTIVE';
  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface-100 rounded-xl transition-colors">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-green-400' : 'bg-muted'}`} />
      <p className="text-xs text-slate-300 flex-1 truncate">{as.name}</p>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-surface-50 text-muted'}`}>
        {as.status}
      </span>
      <p className="text-xs text-orange-400 w-16 text-right font-mono">₹{(as.spend || 0).toLocaleString()}</p>
      <p className="text-xs text-primary-light w-12 text-right font-bold">{as.leads || 0} leads</p>
      <p className="text-xs text-muted w-16 text-right">₹{(as.cpl || 0).toFixed(0)} CPL</p>
    </div>
  );
}

function CampaignCard({ campaign, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [editBudget, setEditBudget] = useState(false);
  const [budget, setBudget]   = useState(campaign.dailyBudget || 0);
  const [loading, setLoading] = useState(false);

  const isActive = campaign.status === 'ACTIVE';
  const ctr = campaign.clicks && campaign.impressions
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00';
  const spentPct = campaign.dailyBudget > 0
    ? Math.min(Math.round((campaign.spend / (campaign.dailyBudget * 30)) * 100), 100) : 0;

  const doAction = async (type, extra = {}) => {
    setLoading(true);
    try { await onAction(campaign._id || campaign.metaCampaignId, type, extra); }
    finally { setLoading(false); }
  };

  return (
    <div className={`card overflow-hidden transition-all ${isActive ? '' : 'opacity-70'}`}>
      {/* Status stripe */}
      <div className={`h-1 w-full ${isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-muted/40'}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge text-[10px] border ${isActive ? 'bg-green-500/10 text-green-400 border-green-500/25' : 'bg-surface-50 text-muted border-border'}`}>
                {campaign.status}
              </span>
              {campaign.objective && (
                <span className="badge text-[10px] bg-primary/10 text-primary-light border border-primary/20">
                  {campaign.objective.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <p className="font-bold text-slate-100 text-base leading-tight">{campaign.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => doAction(isActive ? 'pause' : 'resume')} disabled={loading}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                isActive
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/25'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/25'
              }`}>
              {loading ? '…' : isActive ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg hover:bg-surface-50 flex items-center justify-center text-muted transition-colors">
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-5 gap-3 border-t border-border pt-4">
          <div className="text-center">
            <p className="text-lg font-black text-orange-400">₹{(campaign.spend || 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted mt-0.5">Spend</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-200">{(campaign.impressions || 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted mt-0.5">Impressions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-200">{(campaign.clicks || 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted mt-0.5">Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-primary-light">{campaign.leads || 0}</p>
            <p className="text-[10px] text-muted mt-0.5">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-green-400">₹{(campaign.cpl || 0).toFixed(0)}</p>
            <p className="text-[10px] text-muted mt-0.5">CPL</p>
          </div>
        </div>

        {/* Budget + CTR bar */}
        <div className="flex items-center gap-4 text-xs border-t border-border pt-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted">Budget utilization</span>
              <span className="text-slate-300 font-semibold">{spentPct}%</span>
            </div>
            <ProgressBar value={campaign.spend || 0} max={(campaign.dailyBudget || 1) * 30}
              color={spentPct > 90 ? 'bg-red-500' : spentPct > 70 ? 'bg-yellow-500' : 'bg-green-400'} />
          </div>
          <div className="text-right shrink-0">
            <p className="text-muted">CTR</p>
            <p className="text-slate-200 font-bold">{ctr}%</p>
          </div>
          <div className="text-right shrink-0">
            {editBudget ? (
              <div className="flex items-center gap-1.5">
                <input type="number" className="input py-0.5 px-2 text-xs w-20" value={budget} onChange={e => setBudget(Number(e.target.value))} />
                <button onClick={() => { doAction('budget', { budget }); setEditBudget(false); }}
                  className="text-[10px] px-2 py-1 bg-primary text-white rounded-lg">✓</button>
                <button onClick={() => setEditBudget(false)} className="text-[10px] text-muted hover:text-red-400">✕</button>
              </div>
            ) : (
              <>
                <p className="text-muted">Daily Budget</p>
                <button onClick={() => setEditBudget(true)} className="text-slate-200 font-bold hover:text-primary-light transition-colors">
                  ₹{budget}/day
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ad Sets */}
        {expanded && campaign.adsets?.length > 0 && (
          <div className="border-t border-border pt-3 space-y-1">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
              Ad Sets ({campaign.adsets.length})
            </p>
            {campaign.adsets.map(as => <AdSetRow key={as.id} as={as} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetaPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [trend, setTrend]         = useState([]);
  const [isMock, setIsMock]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [range, setRange]         = useState('30d');

  const load = async () => {
    setLoading(true);
    const res  = await fetch(`/api/meta/campaigns?range=${range}`);
    const data = await res.json();
    if (data.success) {
      setCampaigns(data.campaigns || []);
      setTrend(data.trend || []);
      setIsMock(!!data.isMock);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [range]);

  const handleAction = async (id, action, extra = {}) => {
    const res  = await fetch('/api/meta/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: id, action, ...extra }),
    });
    const data = await res.json();
    if (data.success) {
      setCampaigns(prev => prev.map(c => {
        if (c._id === id || c.metaCampaignId === id) {
          if (action === 'pause')  return { ...c, status: 'PAUSED' };
          if (action === 'resume') return { ...c, status: 'ACTIVE' };
          if (action === 'budget') return { ...c, dailyBudget: extra.budget };
        }
        return c;
      }));
    }
  };

  const totals = campaigns.reduce((acc, c) => ({
    spend:       acc.spend       + (c.spend || 0),
    impressions: acc.impressions + (c.impressions || 0),
    clicks:      acc.clicks      + (c.clicks || 0),
    leads:       acc.leads       + (c.leads || 0),
    budget:      acc.budget      + (c.dailyBudget || 0),
  }), { spend: 0, impressions: 0, clicks: 0, leads: 0, budget: 0 });

  const avgCpl  = totals.leads > 0 ? (totals.spend / totals.leads).toFixed(0) : '—';
  const avgCtr  = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00';
  const active  = campaigns.filter(c => c.status === 'ACTIVE').length;

  // Sorted campaigns for performance tab
  const byCpl    = [...campaigns].sort((a, b) => (a.cpl || 999) - (b.cpl || 999));
  const byLeads  = [...campaigns].sort((a, b) => (b.leads || 0) - (a.leads || 0));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100">Meta Ads</h1>
          <p className="text-muted text-sm">{active}/{campaigns.length} campaigns active · last synced just now</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div className="flex bg-surface-100 border border-border rounded-xl p-0.5 gap-0.5">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  range === r.value ? 'bg-primary text-white' : 'text-muted hover:text-slate-200'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={async () => { setSyncing(true); await load(); setSyncing(false); }} disabled={syncing}
            className="btn-ghost text-sm py-2 gap-2">
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {isMock && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Demo data — add <code className="mx-1 text-xs bg-black/30 px-1.5 py-0.5 rounded">META_ACCESS_TOKEN</code> and <code className="mx-1 text-xs bg-black/30 px-1.5 py-0.5 rounded">META_AD_ACCOUNT_ID</code> in .env.local for live data
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex border-b border-border">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary-light'
                : 'border-transparent text-muted hover:text-slate-300'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-surface-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {/* KPI tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiTile label="Total Spend"   value={`₹${totals.spend.toLocaleString()}`}       color="text-orange-400" accent="#f97316" />
                <KpiTile label="Impressions"   value={totals.impressions.toLocaleString()}         color="text-slate-100" />
                <KpiTile label="Clicks"        value={totals.clicks.toLocaleString()}              color="text-slate-100" />
                <KpiTile label="Total Leads"   value={totals.leads}                               color="text-primary-light" accent="#6366f1" />
                <KpiTile label="Avg CPL"       value={`₹${avgCpl}`}                               color="text-green-400" accent="#22c55e" />
                <KpiTile label="Avg CTR"       value={`${avgCtr}%`}                               sub={`${active} active campaigns`} />
              </div>

              {/* Chart + top campaigns */}
              <div className="grid lg:grid-cols-3 gap-5">
                {/* Trend chart */}
                <div className="card p-5 lg:col-span-2">
                  <p className="text-sm font-bold text-slate-200 mb-4">Spend & Leads — Last 7 Days</p>
                  {trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={trend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        <Area type="monotone" dataKey="spend" stroke="#f97316" fill="url(#gSpend)" strokeWidth={2} name="spend" />
                        <Area type="monotone" dataKey="leads" stroke="#6366f1" fill="url(#gLeads)" strokeWidth={2} name="leads" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted text-sm">No trend data</div>
                  )}
                </div>

                {/* Top campaigns */}
                <div className="card p-5">
                  <p className="text-sm font-bold text-slate-200 mb-3">Campaign Rankings</p>
                  <div className="space-y-3">
                    {[...campaigns].sort((a, b) => (b.leads || 0) - (a.leads || 0)).map((c, i) => (
                      <div key={c._id} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-surface-50 text-muted'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ProgressBar value={c.leads || 0} max={totals.leads || 1} color="bg-primary" />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-primary-light">{c.leads || 0}</p>
                          <p className="text-[10px] text-muted">leads</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CAMPAIGNS ── */}
          {activeTab === 'Campaigns' && (
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-slate-400 font-semibold">No campaigns found</p>
                  <p className="text-muted text-sm mt-1">Connect your Meta Ads account in .env.local</p>
                </div>
              ) : (
                campaigns.map((c, i) => (
                  <CampaignCard key={c._id || i} campaign={c} onAction={handleAction} />
                ))
              )}
            </div>
          )}

          {/* ── PERFORMANCE ── */}
          {activeTab === 'Performance' && (
            <div className="space-y-5">
              <div className="grid lg:grid-cols-2 gap-5">
                {/* CPL comparison */}
                <div className="card p-5">
                  <p className="text-sm font-bold text-slate-200 mb-4">Cost Per Lead by Campaign</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byCpl} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `₹${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false}
                        tickLine={false} width={120} tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                      <Tooltip formatter={(v) => [`₹${v}`, 'CPL']} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="cpl" radius={[0, 6, 6, 0]}>
                        {byCpl.map((_, i) => <Cell key={i} fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Leads comparison */}
                <div className="card p-5">
                  <p className="text-sm font-bold text-slate-200 mb-4">Leads by Campaign</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byLeads} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false}
                        tickLine={false} width={120} tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="leads" radius={[0, 6, 6, 0]}>
                        {byLeads.map((_, i) => <Cell key={i} fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Full table */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-sm font-bold text-slate-200">Performance Comparison</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {['Campaign', 'Status', 'Spend', 'Impressions', 'Clicks', 'CTR', 'Leads', 'CPL', 'Daily Budget'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-bold text-muted uppercase tracking-wider text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {campaigns.map(c => {
                        const ctr = c.clicks && c.impressions ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
                        return (
                          <tr key={c._id} className="hover:bg-surface-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-200 max-w-[180px] truncate">{c.name}</td>
                            <td className="px-4 py-3">
                              <span className={`badge text-[10px] border ${c.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/25' : 'bg-surface-50 text-muted border-border'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-orange-400 font-mono">₹{(c.spend || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-300">{(c.impressions || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-300">{(c.clicks || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-300">{ctr}%</td>
                            <td className="px-4 py-3 text-primary-light font-bold">{c.leads || 0}</td>
                            <td className="px-4 py-3 text-green-400 font-mono font-bold">₹{(c.cpl || 0).toFixed(0)}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono">₹{c.dailyBudget || 0}/day</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
