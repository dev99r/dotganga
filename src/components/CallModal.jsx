'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const OUTCOMES = ['Answered', 'No Answer', 'Busy', 'Voicemail', 'Wrong Number'];
const OUTCOME_CFG = {
  'Answered':     { bg: 'bg-green-500/15 border-green-500/30 text-green-400',  icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  'No Answer':    { bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' },
  'Busy':         { bg: 'bg-orange-500/15 border-orange-500/30 text-orange-400', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  'Voicemail':    { bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  'Wrong Number': { bg: 'bg-red-500/15 border-red-500/30 text-red-400',       icon: 'M6 18L18 6M6 6l12 12' },
};

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function quickFollowUp(key) {
  const d = new Date();
  if (key === '1h')   { d.setHours(d.getHours() + 1); }
  if (key === 'tmr')  { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); }
  if (key === 'week') { d.setDate(d.getDate() + 7); d.setHours(10, 0, 0, 0); }
  return d.toISOString().slice(0, 16);
}

export default function CallModal({ lead, onClose, onCallLogged }) {
  const [phase, setPhase]         = useState('pre');   // pre | active | post | saved
  const [elapsed, setElapsed]     = useState(0);
  const [outcome, setOutcome]     = useState('');
  const [notes, setNotes]         = useState('');
  const [followUpAt, setFollowUpAt] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [history, setHistory]     = useState([]);
  const timerRef = useRef(null);

  // Load call history
  useEffect(() => {
    fetch(`/api/calls?leadId=${lead._id}&page=1`)
      .then(r => r.json())
      .then(d => { if (d.success) setHistory(d.logs.slice(0, 5)); });
  }, [lead._id]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleDial = () => {
    window.open(`tel:${lead.phone}`, '_self');
    setPhase('active');
    setElapsed(0);
    startTimer();
  };

  const handleEndCall = () => {
    stopTimer();
    setPhase('post');
  };

  const handleSave = async () => {
    if (!outcome) { setError('Select a call outcome.'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId:      lead._id,
        outcome,
        durationSec: phase === 'post' ? elapsed : 0,
        notes:       notes.trim(),
        followUpAt:  followUpAt || null,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setSaving(false);
      setPhase('saved');
      onCallLogged?.(data.log);
    } else {
      setError(data.message || 'Failed to save.');
      setSaving(false);
    }
  };

  const STAGE_COLOR = {
    'New': 'text-blue-400', 'Contacted': 'text-purple-400', 'Qualified': 'text-yellow-400',
    'Proposal': 'text-orange-400', 'Closed Won': 'text-green-400', 'Closed Lost': 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-100 border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-surface-50">
          <div className="w-11 h-11 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400 font-black text-base shrink-0">
            {lead.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-100 truncate">{lead.name}</p>
              <span className={`text-xs font-semibold ${STAGE_COLOR[lead.stage] || 'text-muted'}`}>{lead.stage}</span>
            </div>
            <p className="text-sm text-green-400 font-mono">{lead.phone}</p>
            {lead.company && <p className="text-xs text-muted truncate">{lead.company}</p>}
          </div>
          <div className="flex items-center gap-2">
            {phase === 'active' && (
              <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 font-mono text-sm font-bold">{fmt(elapsed)}</span>
              </div>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-muted hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Saved state */}
          {phase === 'saved' && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">Call Logged</p>
                <p className="text-muted text-sm mt-1">
                  {outcome} · {fmt(elapsed)}
                  {followUpAt && ` · Follow-up set`}
                </p>
              </div>
              <button onClick={onClose} className="btn-primary px-6">Done</button>
            </div>
          )}

          {/* Pre-call */}
          {phase === 'pre' && (
            <div className="p-5 space-y-4">
              {/* Call history */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Recent Calls</p>
                  <div className="space-y-1.5">
                    {history.map(log => (
                      <div key={log._id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-50">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${OUTCOME_CFG[log.outcome]?.bg || ''}`}>
                          {log.outcome}
                        </span>
                        <span className="text-xs text-muted flex-1">{log.notes || '—'}</span>
                        <span className="text-xs text-muted shrink-0">{new Date(log.calledAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center py-6">
                <p className="text-muted text-sm mb-4">Ready to call {lead.name}?</p>
                <button onClick={handleDial}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Dial {lead.phone}
                </button>
                <p className="text-xs text-muted mt-3">Opens your phone dialer</p>
              </div>

              {/* Log without dialing */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted text-center mb-3">Or log a call without dialing</p>
                <LogForm
                  outcome={outcome} setOutcome={setOutcome}
                  notes={notes} setNotes={setNotes}
                  followUpAt={followUpAt} setFollowUpAt={setFollowUpAt}
                  elapsed={0} saving={saving} error={error}
                  onSave={handleSave}
                />
              </div>
            </div>
          )}

          {/* Active call */}
          {phase === 'active' && (
            <div className="p-5 space-y-5">
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-9 h-9 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-muted text-sm">Calling {lead.name}…</p>
                <p className="text-3xl font-mono font-bold text-slate-100 mt-1">{fmt(elapsed)}</p>
              </div>
              <button onClick={handleEndCall}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                End Call
              </button>
            </div>
          )}

          {/* Post call — log outcome */}
          {phase === 'post' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50">
                <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-muted">Duration: <span className="text-slate-300 font-mono font-semibold">{fmt(elapsed)}</span></p>
              </div>
              <LogForm
                outcome={outcome} setOutcome={setOutcome}
                notes={notes} setNotes={setNotes}
                followUpAt={followUpAt} setFollowUpAt={setFollowUpAt}
                elapsed={elapsed} saving={saving} error={error}
                onSave={handleSave}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogForm({ outcome, setOutcome, notes, setNotes, followUpAt, setFollowUpAt, saving, error, onSave }) {
  return (
    <div className="space-y-4">
      {/* Outcome selector */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Call Outcome</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OUTCOMES.map(o => (
            <button key={o} onClick={() => setOutcome(o)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                outcome === o
                  ? OUTCOME_CFG[o]?.bg || 'bg-primary/15 border-primary/30 text-primary-light'
                  : 'border-border text-muted hover:border-slate-600 hover:text-slate-300'
              }`}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={OUTCOME_CFG[o]?.icon || ''} />
              </svg>
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Notes</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="What was discussed? Any key points…"
          className="input resize-none text-sm w-full" />
      </div>

      {/* Follow-up */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Schedule Follow-up</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[
            { label: '+1 Hour', key: '1h' },
            { label: 'Tomorrow 10am', key: 'tmr' },
            { label: 'Next Week', key: 'week' },
          ].map(({ label, key }) => (
            <button key={key} onClick={() => setFollowUpAt(quickFollowUp(key))}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                followUpAt === quickFollowUp(key)
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                  : 'border-border text-muted hover:text-slate-300 hover:border-slate-600'
              }`}>
              {label}
            </button>
          ))}
          <button onClick={() => setFollowUpAt('')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-border text-muted hover:text-red-400 hover:border-red-500/30 transition-colors">
            Clear
          </button>
        </div>
        <input type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)}
          className="input text-sm w-full" />
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

      <button onClick={onSave} disabled={saving || !outcome}
        className="w-full btn-primary py-3 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {saving ? 'Saving…' : 'Save Call Log'}
      </button>
    </div>
  );
}
