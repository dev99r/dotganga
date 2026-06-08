'use client';
import { useEffect, useState } from 'react';

const TYPE_CFG = {
  call:      { label: 'Call',      icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: 'text-green-400',   bg: 'bg-green-500/10'   },
  whatsapp:  { label: 'WhatsApp',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  email:     { label: 'Email',     icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
  follow_up: { label: 'Follow-up', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  note:      { label: 'Note',      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

function isOverdue(dueAt) {
  return new Date(dueAt) < new Date();
}

function isToday(dueAt) {
  const d   = new Date(dueAt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function ReminderCard({ reminder, onDone }) {
  const [loading, setLoading] = useState(false);
  const cfg     = TYPE_CFG[reminder.type] || TYPE_CFG.follow_up;
  const overdue = isOverdue(reminder.dueAt);
  const lead    = reminder.leadId;

  const markDone = async () => {
    setLoading(true);
    await fetch('/api/reminders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reminder._id }) });
    onDone(reminder._id);
    setLoading(false);
  };

  return (
    <div className={`card p-4 flex items-start gap-3 ${overdue ? 'border-danger/30' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <svg className={`w-4 h-4 ${cfg.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-100 text-sm">{reminder.title}</p>
            {lead && (
              <a href={`/leads?id=${lead._id}`} className="text-xs text-primary-light hover:underline">
                {lead.name} {lead.company ? `— ${lead.company}` : ''}
              </a>
            )}
          </div>
          <div className={`text-xs font-semibold shrink-0 ${overdue ? 'text-danger' : 'text-muted'}`}>
            {overdue ? '⚠ Overdue' : ''}
          </div>
        </div>

        {reminder.note && <p className="text-xs text-slate-400 mt-1">{reminder.note}</p>}

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs ${overdue ? 'text-danger' : 'text-muted'}`}>
              {new Date(reminder.dueAt).toLocaleString()}
            </span>
            {lead?.phone && (
              <div className="flex gap-1.5">
                <a href={`tel:${lead.phone}`} className={`text-[10px] px-2 py-0.5 rounded-lg ${TYPE_CFG.call.bg} ${TYPE_CFG.call.color}`}>Call</a>
                <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className={`text-[10px] px-2 py-0.5 rounded-lg ${TYPE_CFG.whatsapp.bg} ${TYPE_CFG.whatsapp.color}`}>WA</a>
              </div>
            )}
          </div>
          <button onClick={markDone} disabled={loading}
            className="text-xs px-3 py-1 rounded-xl bg-success/10 text-success hover:bg-success/20 font-semibold transition-colors disabled:opacity-50">
            {loading ? '…' : '✓ Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then(d => { if (d.success) setReminders(d.reminders); })
      .finally(() => setLoading(false));
  }, []);

  const onDone = (id) => setReminders(prev => prev.filter(r => r._id !== id));

  const overdue  = reminders.filter(r => isOverdue(r.dueAt) && !isToday(r.dueAt));
  const today    = reminders.filter(r => isToday(r.dueAt));
  const upcoming = reminders.filter(r => !isOverdue(r.dueAt) && !isToday(r.dueAt));

  const Section = ({ title, items, color }) => items.length === 0 ? null : (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</p>
        <span className={`badge text-[10px] ${color === 'text-danger' ? 'bg-danger/10 text-danger' : color === 'text-orange-400' ? 'bg-orange-500/10 text-orange-400' : 'bg-surface-50 text-muted'}`}>{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(r => <ReminderCard key={r._id} reminder={r} onDone={onDone} />)}
      </div>
    </div>
  );

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100">Reminders</h1>
          <p className="text-muted text-sm mt-0.5">
            {reminders.length === 0 ? 'All clear!' : `${reminders.length} pending — ${overdue.length} overdue`}
          </p>
        </div>
        {overdue.length > 0 && (
          <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger text-sm font-semibold px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
            {overdue.length} overdue
          </div>
        )}
      </div>

      {reminders.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-10 h-10 text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400 font-semibold">No pending reminders</p>
          <p className="text-muted text-sm mt-1">Set reminders from the lead detail panel.</p>
        </div>
      ) : (
        <>
          <Section title="Overdue"          items={overdue}  color="text-danger" />
          <Section title="Today"            items={today}    color="text-orange-400" />
          <Section title="Upcoming (7 days)" items={upcoming} color="text-muted" />
        </>
      )}
    </div>
  );
}
