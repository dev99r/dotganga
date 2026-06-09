import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';

function fmt(n) { return new Intl.NumberFormat('en-IN').format(Math.round(n||0)); }
function fmtCur(n) { return `₹${new Intl.NumberFormat('en-IN').format(Math.round(n||0))}`; }

const STATUS_CFG = {
  ACTIVE:   { bg:'bg-emerald-100', text:'text-emerald-700', dot:'bg-emerald-500' },
  PAUSED:   { bg:'bg-amber-100',   text:'text-amber-700',   dot:'bg-amber-500'   },
  DELETED:  { bg:'bg-red-100',     text:'text-red-700',     dot:'bg-red-500'     },
  ARCHIVED: { bg:'bg-slate-100',   text:'text-slate-600',   dot:'bg-slate-400'   },
};

function MetricCard({ label, value, sub, icon, color = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ConnectModal({ client, onClose, onConnected }) {
  const [accountId, setAccountId] = useState(client.metaAdAccountId || '');
  const [loading,   setLoading]   = useState(false);
  const [oauthUrl,  setOauthUrl]  = useState('');

  useEffect(() => {
    api.get(`/meta-ads/auth-url/${client._id}`)
      .then(r => setOauthUrl(r.data.url))
      .catch(()=>{});
  }, [client._id]);

  const saveAccount = async () => {
    if (!accountId.trim()) { toast.error('Enter ad account ID.'); return; }
    setLoading(true);
    try {
      await api.put(`/clients/${client._id}`, { metaAdAccountId: accountId });
      toast.success('Ad account ID saved!');
    } catch { toast.error('Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-black text-slate-900">Connect Meta Ads</h2>
          <p className="text-xs text-slate-400 mt-0.5">{client.businessName}</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Step 1: OAuth */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Step 1 — Authorize via Meta</p>
            {oauthUrl ? (
              <a href={oauthUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Login with Facebook
              </a>
            ) : (
              <div className="bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-500">
                OAuth URL unavailable. Set META_APP_ID in .env to enable.
              </div>
            )}
          </div>

          {/* Step 2: Ad Account ID */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Step 2 — Enter Ad Account ID</p>
            <div className="flex gap-2">
              <input value={accountId} onChange={e=>setAccountId(e.target.value)} placeholder="act_123456789"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"/>
              <button onClick={saveAccount} disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded-xl text-sm disabled:opacity-50">
                {loading ? '…' : 'Save'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Find this in your Meta Business Manager → Ad Accounts</p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function MetaAdsView() {
  const [clients,   setClients]   = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [insights,  setInsights]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [selClient, setSelClient] = useState('');
  const [modal,     setModal]     = useState(null);
  const [connectClient, setConnectClient] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(),30),'yyyy-MM-dd'),
    to:   format(new Date(),'yyyy-MM-dd'),
  });

  const loadClients = useCallback(async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data.clients || []);
      const first = (data.clients||[]).find(c=>c.metaConnected);
      if (first && !selClient) setSelClient(first._id);
    } catch {}
    finally { setLoading(false); }
  }, [selClient]);

  const loadData = useCallback(async () => {
    if (!selClient) return;
    try {
      const [campRes, insRes] = await Promise.all([
        api.get(`/meta-ads/campaigns/${selClient}`),
        api.get(`/meta-ads/insights/${selClient}?from=${dateRange.from}&to=${dateRange.to}`),
      ]);
      setCampaigns(campRes.data.campaigns || []);
      setInsights(insRes.data);
    } catch (err) {
      if (err.response?.status !== 400) toast.error('Failed to load data.');
    }
  }, [selClient, dateRange]);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (selClient) loadData(); }, [loadData]);

  const handleSync = async () => {
    if (!selClient) return;
    setSyncing(true);
    try {
      const { data } = await api.post(`/meta-ads/sync/${selClient}`, dateRange);
      toast.success(data.message);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Sync failed.'); }
    finally { setSyncing(false); }
  };

  const handleDisconnect = async (clientId) => {
    if (!confirm('Disconnect Meta Ads for this client?')) return;
    try {
      await api.put(`/meta-ads/disconnect/${clientId}`);
      toast.success('Disconnected.');
      loadClients();
      if (selClient === clientId) { setSelClient(''); setCampaigns([]); setInsights(null); }
    } catch { toast.error('Failed.'); }
  };

  const selectedClient = clients.find(c=>c._id===selClient);
  const t = insights?.totals || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Meta Ads</h2>
          <p className="text-xs text-slate-400 mt-0.5">Campaign performance & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {selClient && selectedClient?.metaConnected && (
            <button onClick={handleSync} disabled={syncing}
              className={`flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-2xl text-sm transition-all ${syncing?'animate-pulse':''}`}>
              <svg className={`w-4 h-4 ${syncing?'animate-spin':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>

      {/* Client selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex p-2 gap-2 min-w-max">
          {clients.map(c => (
            <button key={c._id}
              onClick={() => { setSelClient(c._id); setCampaigns([]); setInsights(null); }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                selClient===c._id ? 'bg-blue-950 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {c.logoUrl
                ? <img src={c.logoUrl} alt="" className="w-5 h-5 rounded-md object-cover"/>
                : <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">{c.businessName?.charAt(0)}</div>
              }
              {c.businessName}
              {c.metaConnected
                ? <span className="text-[10px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full">LIVE</span>
                : <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">OFF</span>
              }
            </button>
          ))}
          {clients.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-2">No clients yet. Add clients first.</p>
          )}
        </div>
      </div>

      {!selClient ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-3">📊</p>
          <p className="font-bold text-slate-500">Select a client to view Meta Ads data</p>
        </div>
      ) : !selectedClient?.metaConnected ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <p className="font-black text-slate-700 text-lg mb-2">Meta Ads Not Connected</p>
          <p className="text-sm text-slate-400 mb-5">Connect {selectedClient?.businessName}'s Meta Ads account to view campaign data</p>
          <button onClick={()=>setConnectClient(selectedClient)}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors">
            Connect Meta Ads
          </button>
        </div>
      ) : (
        <>
          {/* Date range + disconnect */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <input type="date" value={dateRange.from} onChange={e=>setDateRange(d=>({...d,from:e.target.value}))} className="text-xs border-0 outline-none bg-transparent"/>
              <span className="text-slate-300">→</span>
              <input type="date" value={dateRange.to}   onChange={e=>setDateRange(d=>({...d,to:e.target.value}))}   className="text-xs border-0 outline-none bg-transparent"/>
            </div>
            <button onClick={()=>setConnectClient(selectedClient)} className="text-xs font-bold text-blue-600 hover:underline">Manage Connection</button>
            <button onClick={()=>handleDisconnect(selClient)} className="text-xs font-bold text-red-500 hover:underline ml-auto">Disconnect</button>
          </div>

          {/* KPI metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Impressions"  value={fmt(t.impressions)} icon="👁️"  color="text-slate-900"/>
            <MetricCard label="Clicks"       value={fmt(t.clicks)}      icon="🖱️"  color="text-blue-700"/>
            <MetricCard label="Total Spend"  value={fmtCur(t.spend)}    icon="💰"  color="text-red-600"/>
            <MetricCard label="Leads"        value={fmt(t.leadCount)}   icon="🎯"  color="text-emerald-600"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="CTR"          value={`${t.ctr||0}%`}     icon="📈"  color="text-violet-700"/>
            <MetricCard label="CPM"          value={fmtCur(t.cpm)}      icon="📊"  color="text-amber-700"/>
            <MetricCard label="CPC"          value={fmtCur(t.cpc)}      icon="💳"  color="text-cyan-700"/>
          </div>

          {/* Campaigns */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-black text-slate-900">Campaigns</p>
            </div>
            {campaigns.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">📢</p>
                <p className="text-sm text-slate-400">No campaigns found. Click Sync Now to fetch from Meta.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {campaigns.map(camp => {
                  const s = STATUS_CFG[camp.status] || {};
                  return (
                    <div key={camp._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{camp.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
                            {camp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{camp.objective || 'No objective set'}</p>
                      </div>
                      <div className="ml-auto text-right">
                        {camp.dailyBudget > 0 && <p className="text-sm font-bold text-slate-800">{fmtCur(camp.dailyBudget)}<span className="text-xs font-normal text-slate-400">/day</span></p>}
                        {camp.startDate  && <p className="text-[10px] text-slate-400">{format(new Date(camp.startDate),'dd MMM')} → {camp.endDate ? format(new Date(camp.endDate),'dd MMM') : '∞'}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily insights chart (simple bar) */}
          {insights?.insights?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <p className="font-black text-slate-900 mb-4">Daily Spend</p>
              <div className="flex items-end gap-1 h-28">
                {insights.insights.slice(-30).map((r,i) => {
                  const max = Math.max(...insights.insights.slice(-30).map(x=>x.spend||0), 1);
                  const pct = Math.round(((r.spend||0)/max)*100);
                  return (
                    <div key={i} title={`${format(new Date(r.date),'dd MMM')}: ${fmtCur(r.spend)}`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t cursor-pointer transition-all"
                      style={{height:`${pct||2}%`}}/>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[10px] text-slate-400">{insights.insights.length > 0 && format(new Date(insights.insights[insights.insights.length-30]?.date||insights.insights[0].date),'dd MMM')}</p>
                <p className="text-[10px] text-slate-400">{insights.insights.length > 0 && format(new Date(insights.insights[0].date),'dd MMM')}</p>
              </div>
            </div>
          )}
        </>
      )}

      {connectClient && (
        <ConnectModal client={connectClient} onClose={()=>{setConnectClient(null);loadClients();}} onConnected={()=>{setConnectClient(null);loadClients();loadData();}}/>
      )}
    </div>
  );
}
