'use client';
import { useEffect, useState, useCallback } from 'react';

// ── Role Configuration ────────────────────────────────────────────────────────
const ROLE_CFG = {
  Sales: {
    label: 'Sales', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
    accent: '#3b82f6',
    metrics: [
      { key: 'callsAttempted', label: 'Calls Attempted', icon: '📞', type: 'number' },
      { key: 'callsConnected', label: 'Calls Connected', icon: '✅', type: 'number' },
      { key: 'leadsReached',   label: 'Leads Reached',   icon: '👥', type: 'number' },
      { key: 'followUpsSet',   label: 'Follow-ups Set',  icon: '🗓️', type: 'number' },
      { key: 'proposalsSent',  label: 'Proposals Sent',  icon: '📄', type: 'number' },
      { key: 'dealsClosed',    label: 'Deals Closed',    icon: '🏆', type: 'number' },
      { key: 'revenue',        label: 'Revenue (₹)',     icon: '💰', type: 'currency' },
    ],
  },
  Manager: {
    label: 'Manager', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
    accent: '#f59e0b',
    metrics: [
      { key: 'teamMeetings',      label: 'Team Meetings',      icon: '👥', type: 'number' },
      { key: 'leadsAssigned',     label: 'Leads Assigned',     icon: '📋', type: 'number' },
      { key: 'proposalsReviewed', label: 'Proposals Reviewed', icon: '📄', type: 'number' },
      { key: 'clientCalls',       label: 'Client Calls',       icon: '📞', type: 'number' },
      { key: 'dealsClosed',       label: 'Deals Closed',       icon: '🏆', type: 'number' },
      { key: 'revenue',           label: 'Revenue (₹)',        icon: '💰', type: 'currency' },
    ],
  },
  VideoEditor: {
    label: 'Video Editor', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
    accent: '#a855f7',
    metrics: [
      { key: 'videosDelivered', label: 'Videos Delivered', icon: '🎬', type: 'number' },
      { key: 'minutesEdited',   label: 'Minutes Edited',   icon: '⏱️', type: 'number' },
      { key: 'hooksCreated',    label: 'Hooks Created',    icon: '🎣', type: 'number' },
      { key: 'revisionRounds',  label: 'Revision Rounds',  icon: '🔄', type: 'number' },
      { key: 'renderExports',   label: 'Exports Done',     icon: '📤', type: 'number' },
      { key: 'deepShotUrl',     label: 'Loom / Screen Rec',icon: '🎥', type: 'url' },
    ],
  },
  GraphicDesigner: {
    label: 'Graphic Designer', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20',
    accent: '#ec4899',
    metrics: [
      { key: 'creativesCompleted', label: 'Creatives Made',     icon: '🎨', type: 'number' },
      { key: 'variationsMade',     label: 'Variations Made',    icon: '📋', type: 'number' },
      { key: 'clientRevisions',    label: 'Client Revisions',   icon: '🔄', type: 'number' },
      { key: 'conceptsPresented',  label: 'Concepts Presented', icon: '💡', type: 'number' },
      { key: 'designFolderUrl',    label: 'Design Folder Link', icon: '🔗', type: 'url' },
    ],
  },
  SMM: {
    label: 'Social Media / Media Buyer', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20',
    accent: '#06b6d4',
    metrics: [
      { key: 'leadsGenerated',   label: 'Leads Generated',   icon: '🎯', type: 'number' },
      { key: 'adSpend',          label: 'Ad Spend (₹)',      icon: '💸', type: 'currency' },
      { key: 'cpl',              label: 'CPL (₹)',           icon: '📊', type: 'currency' },
      { key: 'campaignsManaged', label: 'Campaigns Managed', icon: '📈', type: 'number' },
      { key: 'contentPosted',    label: 'Content Posted',    icon: '📱', type: 'number' },
      { key: 'campaignReportUrl',label: 'Campaign Report',   icon: '🔗', type: 'url' },
    ],
  },
  ContentWriter: {
    label: 'Content Writer', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
    accent: '#22c55e',
    metrics: [
      { key: 'articlesWritten', label: 'Articles Written',    icon: '📝', type: 'number' },
      { key: 'wordsWritten',    label: 'Words Written',       icon: '🔡', type: 'number' },
      { key: 'socialCaptions',  label: 'Social Captions',     icon: '📱', type: 'number' },
      { key: 'emailsWritten',   label: 'Emails / Scripts',    icon: '✉️',  type: 'number' },
      { key: 'seoPosts',        label: 'SEO Posts Published', icon: '🔍', type: 'number' },
    ],
  },
  Intern: {
    label: 'Intern', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20',
    accent: '#f97316',
    metrics: [
      { key: 'tasksCompleted',   label: 'Tasks Completed',   icon: '✅', type: 'number' },
      { key: 'hoursWorked',      label: 'Hours Worked',      icon: '⏰', type: 'number' },
      { key: 'meetingsAttended', label: 'Meetings Attended', icon: '👥', type: 'number' },
    ],
  },
};
ROLE_CFG.Admin = ROLE_CFG.Manager;

const SENTIMENT_CFG = {
  Happy:   { icon: '😊', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/25' },
  Neutral: { icon: '😐', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25' },
  Stressed:{ icon: '😓', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25' },
  Burnout: { icon: '🔥', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' },
};

const STATUS_CFG = {
  Pending:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
  Approved:      'bg-green-500/10 text-green-400 border-green-500/25',
  'Needs Review':'bg-red-500/10 text-red-400 border-red-500/25',
};

const DEPT_TABS = [
  { label: 'All',              value: 'all' },
  { label: 'Sales',            value: 'Sales' },
  { label: 'Video Editor',     value: 'VideoEditor' },
  { label: 'Graphic Designer', value: 'GraphicDesigner' },
  { label: 'Social Media',     value: 'SMM' },
  { label: 'Content',          value: 'ContentWriter' },
  { label: 'Management',       value: 'Manager' },
  { label: 'Intern',           value: 'Intern' },
];

// ── Helper to display a metric value ─────────────────────────────────────────
function metricDisplay(def, value) {
  if (def.type === 'url') return value ? '🔗 Link' : '—';
  if (def.type === 'currency') return value ? `₹${Number(value).toLocaleString()}` : '0';
  return value ?? 0;
}

// ── Single Report Card ────────────────────────────────────────────────────────
function ReportCard({ report, isAdmin, onUpdate }) {
  const [expanded,  setExpanded]  = useState(false);
  const [comment,   setComment]   = useState(report.managerComment || '');
  const [saving,    setSaving]    = useState(false);

  const cfg  = ROLE_CFG[report.role] || ROLE_CFG.Sales;
  const sent = SENTIMENT_CFG[report.sentiment] || SENTIMENT_CFG.Neutral;

  const patch = async (data) => {
    setSaving(true);
    const res  = await fetch(`/api/report/${report._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (d.success) onUpdate(d.report);
    setSaving(false);
  };

  const m = report.metrics || {};

  return (
    <div className={`card overflow-hidden border ${sent.bg}`}>
      {/* Colored top accent */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${cfg.accent}, transparent)` }} />

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
            style={{ background: cfg.accent + '20', color: cfg.accent }}>
            {report.userName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-100 text-sm">{report.userName}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-base">{sent.icon}</span>
              <span className={`text-xs font-semibold ${sent.color}`}>{report.sentiment}</span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {report.date} · {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge border text-[10px] ${STATUS_CFG[report.status] || ''}`}>{report.status}</span>
          <button onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg hover:bg-surface-50 flex items-center justify-center text-muted">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `repeat(${Math.min(cfg.metrics.filter(d => d.type !== 'url').length, 6)}, 1fr)` }}>
        {cfg.metrics.filter(d => d.type !== 'url').map(def => (
          <div key={def.key} className="bg-surface px-2 py-3 text-center">
            <p className={`text-base font-black ${cfg.color}`}>{metricDisplay(def, m[def.key])}</p>
            <p className="text-[9px] text-muted leading-tight mt-0.5 truncate px-1">{def.label}</p>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {report.aiSummary && (
        <div className="px-5 py-3 border-t border-border bg-surface-50/50">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">AI Summary</p>
          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{report.aiSummary}</p>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {/* URL metrics */}
          {cfg.metrics.filter(d => d.type === 'url' && m[d.key]).map(def => (
            <div key={def.key} className="px-5 py-3 flex items-center gap-2">
              <span className="text-sm">{def.icon}</span>
              <span className="text-xs text-muted">{def.label}:</span>
              <a href={m[def.key]} target="_blank" rel="noreferrer"
                className="text-xs text-primary-light hover:underline truncate flex-1">{m[def.key]}</a>
            </div>
          ))}

          {report.highlights && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">Highlights</p>
              <p className="text-xs text-slate-300">{report.highlights}</p>
            </div>
          )}
          {report.blockers && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Blockers</p>
              <p className="text-xs text-slate-300">{report.blockers}</p>
            </div>
          )}
          {report.tomorrowPlan?.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Tomorrow's Plan</p>
              <ul className="space-y-1">
                {report.tomorrowPlan.map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                    <span className="text-primary-light shrink-0 mt-0.5">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manager actions */}
          {isAdmin && (
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => patch({ status: 'Approved' })} disabled={saving || report.status === 'Approved'}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/20 disabled:opacity-40">
                  ✓ Approve
                </button>
                <button onClick={() => patch({ status: 'Needs Review' })} disabled={saving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 disabled:opacity-40">
                  ✗ Needs Review
                </button>
              </div>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Leave a comment for this employee…"
                  className="input text-xs flex-1 py-2" />
                <button onClick={() => patch({ managerComment: comment })} disabled={saving}
                  className="btn-primary text-xs py-2 px-3 shrink-0">{saving ? '…' : 'Send'}</button>
              </div>
              {report.managerComment && (
                <p className="text-xs text-muted italic bg-surface-50 rounded-xl px-3 py-2">
                  "{report.managerComment}" — {report.reviewedBy}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Role-Specific Submit Form ─────────────────────────────────────────────────
function SubmitForm({ role, onSubmit }) {
  const cfg  = ROLE_CFG[role] || ROLE_CFG.Sales;
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  const [metrics,    setMetrics]    = useState({});
  const [highlights, setHighlights] = useState('');
  const [blockers,   setBlockers]   = useState('');
  const [plan,       setPlan]       = useState(['']);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const setMetric = (key, val) => setMetrics(m => ({ ...m, [key]: val }));
  const addPlan    = ()      => setPlan(p => [...p, '']);
  const removePlan = (i)     => setPlan(p => p.filter((_, idx) => idx !== i));
  const editPlan   = (i, v)  => setPlan(p => p.map((x, idx) => idx === i ? v : x));

  const submit = async () => {
    setSaving(true); setError('');
    const res  = await fetch('/api/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, highlights, blockers, tomorrowPlan: plan.filter(Boolean) }),
    });
    const data = await res.json();
    if (data.success) onSubmit(data.report);
    else setError(data.message || 'Failed to submit.');
    setSaving(false);
  };

  const numberMetrics = cfg.metrics.filter(d => d.type !== 'url' && d.type !== 'text');
  const urlMetrics    = cfg.metrics.filter(d => d.type === 'url');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-5 border" style={{ background: cfg.accent + '10', borderColor: cfg.accent + '30' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: cfg.accent + '20' }}>
            {role === 'VideoEditor' ? '🎬' : role === 'GraphicDesigner' ? '🎨' : role === 'SMM' ? '📱' : role === 'ContentWriter' ? '📝' : role === 'Intern' ? '🎓' : '📊'}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.accent }}>{cfg.label} Daily Report</p>
            <p className="text-lg font-black text-slate-100">{today}</p>
          </div>
        </div>
      </div>

      {/* Numeric metrics */}
      {numberMetrics.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Today's Activity</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {numberMetrics.map(def => (
              <div key={def.key} className="card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{def.icon}</span>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider leading-tight">{def.label}</p>
                </div>
                <input type="number" min="0"
                  value={metrics[def.key] || ''}
                  onChange={e => setMetric(def.key, e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className={`input text-2xl font-black py-2 text-center ${cfg.color}`}
                />
              </div>
            ))}
          </div>

          {/* Connect rate indicator for Sales */}
          {role === 'Sales' && metrics.callsAttempted > 0 && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-surface-100 border border-border flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">Connect Rate</span>
                  <span className={`font-bold ${((metrics.callsConnected || 0) / metrics.callsAttempted) > 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {Math.round((metrics.callsConnected || 0) / metrics.callsAttempted * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-50 rounded-full">
                  <div className="h-1.5 bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(Math.round((metrics.callsConnected || 0) / metrics.callsAttempted * 100), 100)}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL / link metrics */}
      {urlMetrics.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Proof / Links</p>
          <div className="space-y-2">
            {urlMetrics.map(def => (
              <div key={def.key} className="flex items-center gap-3">
                <span className="text-lg shrink-0">{def.icon}</span>
                <input
                  value={metrics[def.key] || ''}
                  onChange={e => setMetric(def.key, e.target.value)}
                  placeholder={`Paste ${def.label} URL…`}
                  className="input text-sm flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Highlights — What went well?</p>
        <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={3}
          placeholder="What were your wins today? Any client feedback, breakthroughs, or milestones…"
          className="input resize-none text-sm w-full" />
      </div>

      {/* Blockers */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Blockers & Challenges</p>
        <textarea value={blockers} onChange={e => setBlockers(e.target.value)} rows={2}
          placeholder="Any blockers, delays, or problems today…"
          className="input resize-none text-sm w-full" />
      </div>

      {/* Tomorrow's plan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-muted uppercase tracking-wider">Tomorrow's Attack Plan</p>
          <button onClick={addPlan} className="text-xs text-primary-light hover:text-primary font-semibold">+ Add Item</button>
        </div>
        <div className="space-y-2">
          {plan.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted text-sm shrink-0">{i + 1}.</span>
              <input value={item} onChange={e => editPlan(i, e.target.value)}
                placeholder={`Plan item ${i + 1}…`}
                className="input text-sm flex-1 py-2" />
              {plan.length > 1 && (
                <button onClick={() => removePlan(i)}
                  className="w-6 h-6 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-muted hover:text-red-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

      <button onClick={submit} disabled={saving}
        className="w-full btn-primary py-4 font-bold text-sm disabled:opacity-50">
        {saving ? 'Submitting…' : '🚀 Submit Today\'s Report'}
      </button>
    </div>
  );
}

// ── Admin God-View ────────────────────────────────────────────────────────────
function AdminView({ date, setDate }) {
  const [reports,   setReports]   = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [deptTab,   setDeptTab]   = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [users,     setUsers]     = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [rRes, uRes] = await Promise.all([
      fetch(`/api/report?date=${date}${deptTab !== 'all' ? `&role=${deptTab}` : ''}`).then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]);
    if (rRes.success) { setReports(rRes.reports); setSummary(rRes.summary); }
    if (uRes.success) setUsers(uRes.users);
    setLoading(false);
  }, [date, deptTab]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (updated) => {
    setReports(prev => prev.map(r => r._id === updated._id ? updated : r));
  };

  // Find users who haven't submitted yet
  const submittedIds = new Set(reports.map(r => String(r.userId)));
  const missing = users.filter(u => !submittedIds.has(String(u._id)) && u.isActive && u.role !== 'Admin' &&
    (deptTab === 'all' || u.role === deptTab));

  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Submitted',    value: summary.total,       color: 'text-slate-100' },
            { label: 'Approved',     value: summary.approved,    color: 'text-green-400' },
            { label: 'Pending',      value: summary.pending,     color: 'text-yellow-400' },
            { label: 'Needs Review', value: summary.needsReview, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Department tabs */}
      <div className="flex flex-wrap gap-1">
        {DEPT_TABS.map(t => (
          <button key={t.value} onClick={() => setDeptTab(t.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              deptTab === t.value ? 'bg-primary text-white' : 'bg-surface-100 text-muted hover:text-slate-200'
            }`}>
            {t.label}
            {t.value !== 'all' && summary?.byRole?.[t.value] ? (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {summary.byRole[t.value]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Missing reports warning */}
      {missing.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-yellow-400 mb-1.5">⚠ Missing Reports ({missing.length})</p>
          <div className="flex flex-wrap gap-2">
            {missing.map(u => (
              <span key={u._id} className="text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-lg px-2 py-1">
                {u.name} · {ROLE_CFG[u.role]?.label || u.role}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-36 bg-surface-100 rounded-2xl animate-pulse" />)}</div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400 font-semibold">No reports submitted yet</p>
          <p className="text-muted text-sm mt-1">Reports appear here once employees submit for {date}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => <ReportCard key={r._id} report={r} isAdmin onUpdate={handleUpdate} />)}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [user,     setUser]     = useState(null);
  const [myReport, setMyReport] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [tab,      setTab]      = useState('mine');

  const isAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (d.success) setUser(d.user);
    });
  }, []);

  const loadMine = useCallback(async () => {
    const res  = await fetch(`/api/report?mine=true&date=${date}`);
    const data = await res.json();
    if (data.success) setMyReport(data.reports[0] || null);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadMine();
  }, [user, date, loadMine]);

  if (!user && loading) {
    return <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-surface-100 rounded-2xl animate-pulse" />)}</div>;
  }

  const cfg = ROLE_CFG[user?.role] || ROLE_CFG.Sales;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100">Daily Report</h1>
          <p className="text-muted text-sm">
            {isAdmin ? 'Team overview — all departments' : `${cfg.label} · ${new Date(date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}`}
          </p>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input py-2 text-sm" />
      </div>

      {/* Admin gets tabs: My Report | Team Reports */}
      {isAdmin && (
        <div className="flex border-b border-border">
          {[{ key: 'mine', label: 'My Report' }, { key: 'team', label: 'Team Reports — All Departments' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                tab === t.key ? 'border-primary text-primary-light' : 'border-transparent text-muted hover:text-slate-300'
              }`}>{t.label}</button>
          ))}
        </div>
      )}

      {/* My Report */}
      {(!isAdmin || tab === 'mine') && (
        loading ? (
          <div className="h-48 bg-surface-100 rounded-2xl animate-pulse" />
        ) : myReport ? (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-400 font-semibold">Report submitted for {date}</p>
              <span className={`ml-auto badge border text-[10px] ${STATUS_CFG[myReport.status] || ''}`}>{myReport.status}</span>
            </div>
            <ReportCard report={myReport} isAdmin={false} onUpdate={r => setMyReport(r)} />
          </div>
        ) : (
          <SubmitForm role={user?.role || 'Sales'} onSubmit={r => { setMyReport(r); }} />
        )
      )}

      {/* Admin team view */}
      {isAdmin && tab === 'team' && <AdminView date={date} setDate={setDate} />}
    </div>
  );
}
