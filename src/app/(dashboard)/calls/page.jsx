'use client';
import { useEffect, useState, useCallback } from 'react';
import CallModal from '@/components/CallModal';

const OUTCOME_CFG = {
  'Answered':     'bg-green-500/15 text-green-400 border-green-500/30',
  'No Answer':    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Busy':         'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Voicemail':    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Wrong Number': 'bg-red-500/15 text-red-400 border-red-500/30',
};

function fmt(s) {
  if (!s || s === 0) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${color || 'text-slate-100'}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function CallsPage() {
  const [logs, setLogs]       = useState([]);
  const [stats, setStats]     = useState(null);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue]     = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [modal, setModal]     = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/calls?page=${page}`);
    const data = await res.json();
    if (data.success) { setLogs(data.logs); setStats(data.stats); setTotal(data.total); }
    setLoading(false);
  }, [page]);

  const fetchQueue = async () => {
    setQueueLoading(true);
    const res  = await fetch('/api/leads?hasFollowUp=true&limit=20');
    const data = await res.json();
    if (data.success) {
      const now = new Date();
      const filtered = (data.leads || [])
        .filter(l => l.nextFollowUp && new Date(l.nextFollowUp) <= new Date(now.getTime() + 24*60*60*1000))
        .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));
      setQueue(filtered);
    }
    setQueueLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchQueue(); }, []);

  const handleCallLogged = () => {
    setModal(null);
    fetchLogs();
    fetchQueue();
  };

  const isOverdue = (d) => d && new Date(d) < new Date();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100">Call Center</h1>
          <p className="text-muted text-sm">Today's call log and queue</p>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Calls Today" value={stats.todayCalls} color="text-slate-100" />
          <StatCard label="Answered" value={stats.todayAnswered} color="text-green-400" />
          <StatCard label="Answer Rate" value={`${stats.answerRate}%`} color={stats.answerRate >= 50 ? 'text-green-400' : stats.answerRate >= 30 ? 'text-yellow-400' : 'text-red-400'} />
          <StatCard label="Avg Duration" value={fmt(stats.avgDurationSec)} sub="per answered call" />
        </div>
      )}

      {/* Outcome breakdown */}
      {stats?.outcomes && Object.keys(stats.outcomes).length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Outcome Breakdown — Today</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.outcomes).map(([outcome, count]) => (
              <div key={outcome} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${OUTCOME_CFG[outcome] || 'bg-surface-50 border-border text-muted'}`}>
                {outcome}
                <span className="font-black text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Call Queue */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-bold text-slate-200">Follow-up Queue</p>
              {queue.length > 0 && (
                <span className="badge bg-orange-500/15 text-orange-400 border border-orange-500/30">{queue.length}</span>
              )}
            </div>
            {queueLoading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-50 rounded-xl animate-pulse" />)}
              </div>
            ) : queue.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-8 h-8 text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-muted text-xs">No follow-ups due</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {queue.map(lead => (
                  <div key={lead._id} className="px-4 py-3 hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary-light text-xs font-black shrink-0">
                        {lead.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{lead.name}</p>
                        <p className="text-[10px] text-muted font-mono">{lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold ${isOverdue(lead.nextFollowUp) ? 'text-red-400' : 'text-orange-400'}`}>
                        {isOverdue(lead.nextFollowUp) ? 'Overdue · ' : ''}
                        {new Date(lead.nextFollowUp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button onClick={() => setModal(lead)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[10px] font-bold transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Call Log Table */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-bold text-slate-200">All Call Logs</p>
              <p className="text-xs text-muted">{total} total</p>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface-50 rounded-xl animate-pulse" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-10 h-10 text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-muted text-sm">No calls logged yet</p>
                <p className="text-xs text-muted mt-1">Open a lead and click the call button to get started</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border">
                  {logs.map(log => (
                    <div key={log._id} className="px-4 py-3 hover:bg-surface-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-100 border border-border flex items-center justify-center text-slate-400 text-xs font-black shrink-0 mt-0.5">
                          {log.leadName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-200">{log.leadName}</p>
                            <span className="text-xs text-muted font-mono">{log.leadPhone}</span>
                            <span className={`badge border text-[10px] ${OUTCOME_CFG[log.outcome] || 'bg-surface-50 border-border text-muted'}`}>
                              {log.outcome}
                            </span>
                            {log.durationSec > 0 && (
                              <span className="text-xs text-muted">{fmt(log.durationSec)}</span>
                            )}
                          </div>
                          {log.notes && <p className="text-xs text-muted mt-0.5 truncate">{log.notes}</p>}
                          {log.followUpSet && log.followUpAt && (
                            <p className="text-[10px] text-orange-400 mt-0.5">
                              Follow-up: {new Date(log.followUpAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-muted">{log.by}</p>
                          <p className="text-[10px] text-muted">{new Date(log.calledAt).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {total > 50 && (
                  <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
                    <p className="text-xs text-muted">Page {page} of {Math.ceil(total/50)}</p>
                    <button disabled={page >= Math.ceil(total/50)} onClick={() => setPage(p => p + 1)}
                      className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <CallModal lead={modal} onClose={() => setModal(null)} onCallLogged={handleCallLogged} />
      )}
    </div>
  );
}
