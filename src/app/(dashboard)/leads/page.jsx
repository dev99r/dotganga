'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CallModal from '@/components/CallModal';

const STAGES  = ['New','Contacted','Qualified','Proposal','Closed Won','Closed Lost'];
const SOURCES = ['Meta Ads','Manual','CSV Upload','AI Paste','PDF','Website','WhatsApp','Referral'];

const STAGE_CFG = {
  'New':         'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Contacted':   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Qualified':   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Proposal':    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Closed Won':  'bg-green-500/10 text-green-400 border-green-500/20',
  'Closed Lost': 'bg-red-500/10 text-red-400 border-red-500/20',
};

function StageBadge({ stage }) {
  return <span className={`badge border ${STAGE_CFG[stage] || 'bg-surface-50 text-muted border-border'}`}>{stage}</span>;
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const bg    = score >= 70 ? 'bg-green-500/10' : score >= 40 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  return <span className={`badge ${bg} ${color} font-mono`}>{score}</span>;
}

function FollowUpBadge({ date }) {
  if (!date) return <span className="text-muted text-xs">—</span>;
  const d   = new Date(date);
  const now = new Date();
  const isToday  = d.toDateString() === now.toDateString();
  const isOverdue = d < now && !isToday;
  if (isOverdue) return (
    <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      {d.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
    </span>
  );
  if (isToday) return (
    <span className="text-xs font-semibold text-orange-400 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
      Today
    </span>
  );
  return <span className="text-xs text-muted">{d.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>;
}

function ActivityIcon({ type }) {
  const icons = {
    created:      { d: 'M12 4v16m8-8H4', color: 'text-primary-light' },
    note:         { d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-yellow-400' },
    call:         { d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: 'text-green-400' },
    whatsapp:     { d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-emerald-400' },
    email:        { d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-blue-400' },
    status_change:{ d: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4', color: 'text-purple-400' },
    reminder:     { d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'text-orange-400' },
    meta:         { d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-blue-400' },
  };
  const { d, color } = icons[type] || icons.note;
  return (
    <div className={`w-6 h-6 rounded-full bg-surface-100 border border-border flex items-center justify-center shrink-0 ${color}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </div>
  );
}

function LeadDrawer({ lead: initialLead, onClose, onUpdate }) {
  const [lead, setLead]         = useState(initialLead);
  const [note, setNote]         = useState('');
  const [actType, setActType]   = useState('note');
  const [saving, setSaving]     = useState(false);
  const [stage, setStage]       = useState(initialLead.stage);
  const [followUpDate, setFollowUpDate] = useState(initialLead.nextFollowUp ? new Date(initialLead.nextFollowUp).toISOString().slice(0,16) : '');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDue, setReminderDue]     = useState('');
  const [showReminder, setShowReminder]   = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpDone, setFollowUpDone] = useState(false);

  const save = async (patch) => {
    setSaving(true);
    const res  = await fetch(`/api/leads/${lead._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const data = await res.json();
    if (data.success) { setLead(data.lead); onUpdate(data.lead); }
    setSaving(false);
  };

  const addActivity = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const res  = await fetch(`/api/leads/${lead._id}/activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: actType, message: note }) });
    const data = await res.json();
    if (data.success) { setLead(data.lead); onUpdate(data.lead); setNote(''); }
    setSaving(false);
  };

  const saveFollowUp = async () => {
    if (!followUpDate) return;
    setSavingFollowUp(true);
    await save({ nextFollowUp: new Date(followUpDate).toISOString() });
    setFollowUpDone(true);
    setSavingFollowUp(false);
    setTimeout(() => setFollowUpDone(false), 2000);
  };

  const setReminder = async () => {
    if (!reminderTitle || !reminderDue) return;
    await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead._id, title: reminderTitle, dueAt: reminderDue, type: 'call' }) });
    setShowReminder(false); setReminderTitle(''); setReminderDue('');
  };

  const waLink = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g,'')}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-100 border-l border-border flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary-light font-black text-sm shrink-0">
            {lead.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-100 truncate">{lead.name}</p>
            <p className="text-xs text-muted truncate">{lead.company || lead.email || '—'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-surface-50 flex items-center justify-center text-muted hover:text-slate-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quick actions */}
          <div className="px-5 py-3 flex gap-2 border-b border-border">
            {lead.phone && (
              <button onClick={() => setShowCallModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-semibold transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                Call
              </button>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Email
              </a>
            )}
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-3 border-b border-border">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="label">Phone</p>
                {lead.phone
                  ? <p className="text-slate-200 font-mono">{lead.phone}</p>
                  : <p className="text-muted">—</p>}
              </div>
              <div><p className="label">Email</p><p className="text-slate-200 truncate text-xs">{lead.email || '—'}</p></div>
              <div><p className="label">Company</p><p className="text-slate-200">{lead.company || '—'}</p></div>
              <div><p className="label">Source</p><p className="text-slate-200">{lead.source}</p></div>
              <div><p className="label">Score</p><ScoreBadge score={lead.score} /></div>
              <div>
                <p className="label">Stage</p>
                <select value={stage} onChange={e => { setStage(e.target.value); save({ stage: e.target.value }); }}
                  className="input py-1 text-xs">
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {lead.message && (
              <div><p className="label">Message</p><p className="text-slate-300 text-sm">{lead.message}</p></div>
            )}
          </div>

          {/* Follow-up setter */}
          <div className="px-5 py-4 border-b border-border">
            <p className="label mb-2">Next Follow-up</p>
            <div className="flex gap-2 items-center">
              <input type="datetime-local" className="input text-xs flex-1"
                value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              <button onClick={saveFollowUp} disabled={!followUpDate || savingFollowUp}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${followUpDone ? 'bg-success text-white' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'} disabled:opacity-40`}>
                {followUpDone ? '✓' : savingFollowUp ? '…' : 'Set'}
              </button>
            </div>
            {lead.nextFollowUp && (
              <p className="text-xs mt-1.5">
                <FollowUpBadge date={lead.nextFollowUp} />
              </p>
            )}
          </div>

          {/* Add note / activity */}
          <div className="px-5 py-4 border-b border-border space-y-2">
            <div className="flex gap-2">
              {['note','call','whatsapp','email'].map(t => (
                <button key={t} onClick={() => setActType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${actType === t ? 'bg-primary text-white' : 'bg-surface-50 text-muted hover:text-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Add a note, log a call…"
              className="input resize-none text-sm" />
            <div className="flex gap-2">
              <button onClick={addActivity} disabled={saving || !note.trim()} className="btn-primary text-xs py-1.5 px-3">
                {saving ? 'Saving…' : 'Add'}
              </button>
              <button onClick={() => setShowReminder(!showReminder)} className="btn-ghost text-xs py-1.5 px-3 text-orange-400 hover:bg-orange-500/10">
                Set Reminder
              </button>
            </div>
            {showReminder && (
              <div className="space-y-2 bg-surface-50 rounded-xl p-3">
                <input className="input text-xs" placeholder="Reminder title" value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} />
                <input type="datetime-local" className="input text-xs" value={reminderDue} onChange={e => setReminderDue(e.target.value)} />
                <button onClick={setReminder} className="btn-primary text-xs py-1.5 w-full">Save Reminder</button>
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Activity Timeline</p>
            <div className="space-y-3">
              {[...(lead.activities || [])].reverse().map((act, i) => (
                <div key={i} className="flex gap-2.5">
                  <ActivityIcon type={act.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300">{act.message}</p>
                    <p className="text-[10px] text-muted mt-0.5">{act.by} · {new Date(act.at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!lead.activities || lead.activities.length === 0) && (
                <p className="text-muted text-xs">No activity yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {showCallModal && (
        <CallModal
          lead={lead}
          onClose={() => setShowCallModal(false)}
          onCallLogged={() => {
            setShowCallModal(false);
            fetch(`/api/leads/${lead._id}`)
              .then(r => r.json())
              .then(d => { if (d.success) { setLead(d.lead); onUpdate(d.lead); } });
          }}
        />
      )}
    </div>
  );
}

/* ── Quick Filter Chips ───────────────────────────────────────────── */
const QUICK_FILTERS = [
  { key: 'all',     label: 'All Leads',       qs: {} },
  { key: 'today',   label: 'Follow-up Today', qs: { todayFollowUp: 'true' },   color: 'border-orange-500/40 text-orange-400 hover:bg-orange-500/10 data-[active=true]:bg-orange-500/15 data-[active=true]:border-orange-500/60' },
  { key: 'overdue', label: 'Overdue',          qs: { overdueFollowUp: 'true' }, color: 'border-red-500/40 text-red-400 hover:bg-red-500/10 data-[active=true]:bg-red-500/15 data-[active=true]:border-red-500/60' },
  { key: 'wa',      label: 'WhatsApp',         qs: { source: 'WhatsApp' },     color: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 data-[active=true]:bg-emerald-500/15 data-[active=true]:border-emerald-500/60' },
  { key: 'meta',    label: 'Meta Ads',         qs: { source: 'Meta Ads' },     color: 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10 data-[active=true]:bg-blue-500/15 data-[active=true]:border-blue-500/60' },
];

function LeadsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [leads, setLeads]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [q, setQ]               = useState('');
  const [stage, setStage]       = useState('all');
  const [source, setSource]     = useState('all');
  const [page, setPage]         = useState(1);
  const [quickFilter, setQuickFilter] = useState('all');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: '40', page: String(page) });
    if (q) qs.set('q', q);
    if (stage !== 'all') qs.set('stage', stage);

    // Quick filters override manual source filter
    const qf = QUICK_FILTERS.find(f => f.key === quickFilter);
    if (qf && quickFilter !== 'all') {
      Object.entries(qf.qs).forEach(([k, v]) => qs.set(k, v));
    } else {
      if (source !== 'all') qs.set('source', source);
    }

    const res  = await fetch(`/api/leads?${qs}`);
    const data = await res.json();
    if (data.success) { setLeads(data.leads); setTotal(data.total); }
    setLoading(false);
  }, [q, stage, source, page, quickFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && leads.length > 0) {
      const lead = leads.find(l => l._id === id);
      if (lead) setSelected(lead);
    }
  }, [searchParams, leads]);

  const handleUpdate = (updated) => {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
    setSelected(updated);
  };

  const closeDrawer = () => {
    setSelected(null);
    router.replace('/leads');
  };

  const setQF = (key) => {
    setQuickFilter(key);
    setPage(1);
    if (key !== 'all') setSource('all');
  };

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-black text-slate-100">All Leads</h1>
          <p className="text-muted text-sm">{total} total leads</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input className="input pl-9 pr-3 py-2 text-sm w-48" placeholder="Search name, phone…"
              value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
          <select className="input py-2 text-sm w-36" value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}>
            <option value="all">All Stages</option>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          {quickFilter === 'all' && (
            <select className="input py-2 text-sm w-36" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}>
              <option value="all">All Sources</option>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          )}
          <a href="/import" className="btn-primary text-sm py-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Lead
          </a>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_FILTERS.map(f => (
          <button key={f.key}
            data-active={quickFilter === f.key}
            onClick={() => setQF(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              quickFilter === f.key
                ? f.key === 'all'
                  ? 'bg-primary/20 border-primary/50 text-primary-light'
                  : (f.color || 'bg-primary/20 border-primary/50 text-primary-light')
                : `border-border text-muted hover:text-slate-200 hover:bg-surface-50 ${f.color || ''}`
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-10 h-10 text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-slate-400 font-semibold">No leads found</p>
            <p className="text-muted text-sm mt-1">Try adjusting your filters or import some leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Follow-up</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const waNum = lead.phone?.replace(/\D/g, '');
                  return (
                    <tr key={lead._id}
                      onClick={() => setSelected(lead)}
                      className="border-b border-border/50 hover:bg-surface-50 cursor-pointer transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light text-xs font-black shrink-0">
                            {lead.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{lead.name}</p>
                            {lead.company && <p className="text-[11px] text-muted">{lead.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lead.phone
                          ? <span className="text-slate-300 font-mono text-xs">{lead.phone}</span>
                          : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3"><StageBadge stage={lead.stage} /></td>
                      <td className="px-4 py-3 text-muted text-xs hidden lg:table-cell">{lead.source}</td>
                      <td className="px-4 py-3 hidden lg:table-cell"><ScoreBadge score={lead.score} /></td>
                      <td className="px-4 py-3"><FollowUpBadge date={lead.nextFollowUp} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          {waNum && waNum.length >= 8 && (
                            <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer"
                              title="WhatsApp"
                              className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition-colors">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`}
                              title="Call"
                              className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/25 flex items-center justify-center transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 40 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted text-xs">Showing {(page-1)*40+1}–{Math.min(page*40, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost py-1.5 px-3 text-xs">← Prev</button>
            <button onClick={() => setPage(p => p+1)} disabled={page * 40 >= total} className="btn-ghost py-1.5 px-3 text-xs">Next →</button>
          </div>
        </div>
      )}

      {/* Lead drawer */}
      {selected && <LeadDrawer lead={selected} onClose={closeDrawer} onUpdate={handleUpdate} />}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="skeleton h-96 rounded-2xl" /></div>}>
      <LeadsContent />
    </Suspense>
  );
}
