'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STAGES  = ['New','Contacted','Qualified','Proposal','Closed Won','Closed Lost'];
const SOURCES_MANUAL = ['Manual','Website','WhatsApp','Referral'];

function StageBadge({ stage }) {
  const cfg = {
    'New': 'bg-blue-500/10 text-blue-400',
    'Contacted': 'bg-purple-500/10 text-purple-400',
    'Qualified': 'bg-yellow-500/10 text-yellow-400',
    'Proposal': 'bg-orange-500/10 text-orange-400',
    'Closed Won': 'bg-green-500/10 text-green-400',
    'Closed Lost': 'bg-red-500/10 text-red-400',
  };
  return <span className={`badge ${cfg[stage] || 'bg-surface-50 text-muted'}`}>{stage}</span>;
}

/* ── WhatsApp Tab ─────────────────────────────────────────────────── */
function WhatsAppTab({ onImported }) {
  const [mode, setMode]       = useState('quick');
  const [text, setText]       = useState('');
  const [preview, setPreview] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [quick, setQuick]     = useState({ name: '', phone: '', message: '' });
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickDone, setQuickDone]     = useState(false);

  const parseNumbers = () => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const leads = [];
    for (const line of lines) {
      const named = line.match(/^(.+?)\s*[-:–]\s*(\+?[\d\s]{8,})$/);
      if (named) {
        const phone = named[2].replace(/\s/g, '');
        if (phone.length >= 8) {
          leads.push({ name: named[1].trim(), phone, email: '', company: '', message: '', source: 'WhatsApp' });
          continue;
        }
      }
      const raw = line.replace(/[\s\-()]/g, '');
      if (/^\+?\d{8,15}$/.test(raw)) {
        leads.push({ name: 'WA Lead', phone: line.trim(), email: '', company: '', message: '', source: 'WhatsApp' });
      }
    }
    return leads;
  };

  const handleParse = async () => {
    setError(''); setPreview(null);
    if (!text.trim()) return;
    if (mode === 'numbers') {
      const leads = parseNumbers();
      if (!leads.length) { setError('No valid numbers found. Use one per line, optionally "Name - Number".'); return; }
      setPreview(leads);
    } else {
      setParsing(true);
      try {
        const res  = await fetch('/api/import/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Parse failed');
        setPreview(data.leads.map(l => ({ ...l, source: 'WhatsApp' })));
      } catch (e) {
        setError(e.message);
      } finally {
        setParsing(false);
      }
    }
  };

  const confirm = async () => {
    if (!preview?.length) return;
    setSaving(true);
    const res  = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preview) });
    const data = await res.json();
    if (data.success) { onImported(data.count); setPreview(null); setText(''); }
    setSaving(false);
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    if (!quick.name.trim() || !quick.phone.trim()) return;
    setQuickSaving(true);
    const res  = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...quick, source: 'WhatsApp', stage: 'New', email: '', company: '' }) });
    const data = await res.json();
    if (data.success) {
      setQuickDone(true);
      onImported(1);
      setQuick({ name: '', phone: '', message: '' });
      setTimeout(() => setQuickDone(false), 2500);
    }
    setQuickSaving(false);
  };

  const MODES = [
    { key: 'quick',   label: '⚡ Quick Add' },
    { key: 'numbers', label: '# Bulk Numbers' },
    { key: 'chat',    label: '✦ AI Chat Parse' },
  ];

  return (
    <div className="space-y-4">
      {/* WhatsApp header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-300">WhatsApp Lead Import</p>
          <p className="text-xs text-emerald-500/80">Quick add, bulk numbers, or AI chat extraction</p>
        </div>
      </div>

      {/* Mode picker */}
      <div className="flex gap-1.5 bg-surface-50 rounded-xl p-1">
        {MODES.map(m => (
          <button key={m.key} onClick={() => { setMode(m.key); setPreview(null); setError(''); setText(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.key ? 'bg-emerald-600 text-white shadow' : 'text-muted hover:text-slate-200'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Quick Add */}
      {mode === 'quick' && (
        <form onSubmit={quickAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input className="input" placeholder="Customer name" required value={quick.name} onChange={e => setQuick({ ...quick, name: e.target.value })} />
            </div>
            <div>
              <label className="label">WhatsApp Number *</label>
              <input className="input" placeholder="+91 98765 43210" required value={quick.phone} onChange={e => setQuick({ ...quick, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Message / Note</label>
            <textarea className="input resize-none text-sm" rows={2} placeholder="What are they interested in?" value={quick.message} onChange={e => setQuick({ ...quick, message: e.target.value })} />
          </div>
          <button type="submit" disabled={quickSaving}
            className={`w-full py-3 text-sm font-bold rounded-xl transition-all ${quickDone ? 'bg-success text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} disabled:opacity-60`}>
            {quickDone ? '✓ Lead Added to CRM!' : quickSaving ? 'Adding…' : '+ Add WhatsApp Lead'}
          </button>
        </form>
      )}

      {/* Bulk Numbers */}
      {mode === 'numbers' && (
        <div className="space-y-3">
          <div>
            <label className="label">Paste Phone Numbers</label>
            <textarea className="input resize-none font-mono text-sm leading-relaxed" rows={9}
              placeholder={"One number per line. Formats accepted:\n\n9876543210\n+91 9876543210\nRahul Sharma - 9876543210\nPriya: +91 9123456789\nAnil Kumar – 8765432109"}
              value={text} onChange={e => setText(e.target.value)} />
          </div>
          <p className="text-[11px] text-muted">Tip: copy your WhatsApp contacts list and paste here</p>
        </div>
      )}

      {/* AI Chat Paste */}
      {mode === 'chat' && (
        <div className="space-y-3">
          <div>
            <label className="label">Paste WhatsApp Message or Conversation</label>
            <textarea className="input resize-none text-sm leading-relaxed" rows={9}
              placeholder={"Paste any WhatsApp message, conversation, or chat export — AI will extract all lead information automatically.\n\nExamples:\n• Forwarded message with contact info\n• Group chat with multiple interested buyers\n• Any text mentioning names, numbers, interests"}
              value={text} onChange={e => setText(e.target.value)} />
          </div>
        </div>
      )}

      {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Preview table */}
      {preview && preview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-bold text-slate-200">{preview.length} lead{preview.length !== 1 ? 's' : ''} ready to import</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="btn-ghost text-xs py-1.5">Discard</button>
              <button onClick={confirm} disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-4 rounded-xl font-bold transition-colors disabled:opacity-60">
                {saving ? 'Importing…' : `Import ${preview.length}`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-100 border-b border-border">
                <tr>
                  {['Name','Phone','Company'].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-bold text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {preview.map((l, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="px-4 py-2 font-semibold text-slate-200">{l.name}</td>
                    <td className="px-4 py-2 text-emerald-400 font-mono">{l.phone || '—'}</td>
                    <td className="px-4 py-2 text-muted">{l.company || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parse button for bulk/chat */}
      {mode !== 'quick' && (
        <button onClick={handleParse} disabled={parsing || !text.trim()}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
          {parsing
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Extracting with AI…</>
            : mode === 'numbers' ? '↑ Preview Numbers' : '✦ Extract Leads with AI'
          }
        </button>
      )}
    </div>
  );
}

/* ── AI Paste Tab ─────────────────────────────────────────────────── */
function AiTab({ onImported }) {
  const [text, setText]         = useState('');
  const [result, setResult]     = useState(null);
  const [parsing, setParsing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const parse = async () => {
    if (!text.trim()) return;
    setParsing(true); setError(''); setResult(null);
    try {
      const res  = await fetch('/api/import/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Parse failed');
      setResult(data.leads);
    } catch (e) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  };

  const confirm = async () => {
    if (!result?.length) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
      const data = await res.json();
      if (data.success) { onImported(data.count); setText(''); setResult(null); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Paste Raw Lead Data</label>
        <textarea
          className="input resize-none text-sm leading-relaxed font-mono"
          rows={8}
          placeholder={`Paste any messy text — emails, forms, notes:\n\nName: Rahul Sharma\nPhone: 9876543210\nEmail: rahul@example.com\nInterested in: 2BHK Apartment\n\nOr just paste multiple contacts in any format…`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>

      {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>}

      {result && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-slate-200">{result.length} lead{result.length !== 1 ? 's' : ''} extracted</p>
            <div className="flex gap-2">
              <button onClick={() => setResult(null)} className="btn-ghost text-xs py-1.5">Discard</button>
              <button onClick={confirm} disabled={saving} className="btn-primary text-xs py-1.5">
                {saving ? 'Saving…' : `Import ${result.length} Lead${result.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name','Phone','Email','Company','Stage'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.map((l, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-4 py-2 font-semibold text-slate-200">{l.name || '—'}</td>
                    <td className="px-4 py-2 text-muted">{l.phone || '—'}</td>
                    <td className="px-4 py-2 text-muted truncate max-w-[160px]">{l.email || '—'}</td>
                    <td className="px-4 py-2 text-muted">{l.company || '—'}</td>
                    <td className="px-4 py-2"><StageBadge stage={l.stage || 'New'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button onClick={parse} disabled={parsing || !text.trim()} className="btn-primary py-2.5 w-full text-sm">
        {parsing
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Parsing with AI…</>
          : '✦ Parse with AI'
        }
      </button>
    </div>
  );
}

/* ── CSV Tab ──────────────────────────────────────────────────────── */
function CsvTab({ onImported }) {
  const [preview, setPreview]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return; }
    setError('');
    const text = await file.text();
    const res  = await fetch('/api/import/csv', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: text });
    const data = await res.json();
    if (!data.success) { setError(data.message || 'Parse failed'); return; }
    setPreview(data.leads);
  };

  const confirm = async () => {
    if (!preview?.length) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preview) });
      const data = await res.json();
      if (data.success) { onImported(data.count); setPreview(null); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface-50'}`}
      >
        <svg className="w-10 h-10 text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-slate-300 font-semibold text-sm">Drop CSV file here</p>
        <p className="text-muted text-xs mt-1">or click to browse</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      </div>

      <div className="bg-surface-50 rounded-xl p-4 text-xs text-muted space-y-1">
        <p className="font-semibold text-slate-400 mb-2">Expected columns (any order):</p>
        <p>name, phone, email, company, message, stage, source</p>
        <p className="mt-2">The AI will attempt to auto-map column headers even if they differ.</p>
      </div>

      {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>}

      {preview && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-slate-200">{preview.length} rows parsed</p>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="btn-ghost text-xs py-1.5">Discard</button>
              <button onClick={confirm} disabled={saving} className="btn-primary text-xs py-1.5">
                {saving ? 'Saving…' : `Import ${preview.length} Leads`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-100">
                <tr className="border-b border-border">
                  {['Name','Phone','Email','Company'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((l, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-4 py-1.5 text-slate-200">{l.name || '—'}</td>
                    <td className="px-4 py-1.5 text-muted">{l.phone || '—'}</td>
                    <td className="px-4 py-1.5 text-muted">{l.email || '—'}</td>
                    <td className="px-4 py-1.5 text-muted">{l.company || '—'}</td>
                  </tr>
                ))}
                {preview.length > 20 && <tr><td colSpan={4} className="px-4 py-2 text-muted text-center">+{preview.length - 20} more rows</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Manual Tab ───────────────────────────────────────────────────── */
function ManualTab({ onImported }) {
  const [form, setForm]   = useState({ name: '', phone: '', email: '', company: '', message: '', stage: 'New', source: 'Manual' });
  const [saving, setSaving] = useState(false);
  const [done, setDone]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res  = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setDone(true); onImported(1); setForm({ name: '', phone: '', email: '', company: '', message: '', stage: 'New', source: 'Manual' }); setTimeout(() => setDone(false), 2000); }
    setSaving(false);
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Name *</label><input className="input" placeholder="Full name" required {...f('name')} /></div>
        <div><label className="label">Phone</label><input className="input" placeholder="+91 98765 43210" {...f('phone')} /></div>
        <div><label className="label">Email</label><input type="email" className="input" placeholder="email@example.com" {...f('email')} /></div>
        <div><label className="label">Company</label><input className="input" placeholder="Company name" {...f('company')} /></div>
        <div>
          <label className="label">Stage</label>
          <select className="input" {...f('stage')}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" {...f('source')}>
            {SOURCES_MANUAL.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Message / Note</label>
        <textarea className="input resize-none" rows={3} placeholder="What are they interested in?" {...f('message')} />
      </div>
      <button type="submit" disabled={saving} className={`w-full py-3 text-sm font-semibold rounded-xl transition-all ${done ? 'bg-success text-white' : 'btn-primary'}`}>
        {done ? '✓ Lead Added!' : saving ? 'Adding…' : 'Add Lead'}
      </button>
    </form>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function ImportPage() {
  const [tab, setTab]     = useState('whatsapp');
  const [toast, setToast] = useState('');
  const router            = useRouter();

  const onImported = (count) => {
    setToast(`${count} lead${count !== 1 ? 's' : ''} imported successfully!`);
    setTimeout(() => { setToast(''); router.push('/leads'); }, 2000);
  };

  const tabs = [
    { key: 'whatsapp', label: 'WhatsApp',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-emerald-400', active: 'bg-emerald-600' },
    { key: 'ai',       label: 'AI Paste',  icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color: 'text-primary-light', active: 'bg-primary' },
    { key: 'csv',      label: 'CSV Upload',icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'text-blue-400', active: 'bg-blue-600' },
    { key: 'manual',   label: 'Manual',    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-muted', active: 'bg-surface-50' },
  ];

  const activeTab = tabs.find(t => t.key === tab);

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-100">Import Leads</h1>
        <p className="text-muted text-sm mt-0.5">WhatsApp, AI extraction, CSV bulk upload, or manual entry</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1.5 mb-6 bg-surface-100 p-1.5 rounded-2xl border border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.key ? `${t.active} text-white shadow-lg` : 'text-muted hover:text-slate-200'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="card p-6">
        {tab === 'whatsapp' && <WhatsAppTab onImported={onImported} />}
        {tab === 'ai'       && <AiTab onImported={onImported} />}
        {tab === 'csv'      && <CsvTab onImported={onImported} />}
        {tab === 'manual'   && <ManualTab onImported={onImported} />}
      </div>

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-success text-white px-5 py-3 rounded-2xl font-semibold text-sm shadow-xl animate-slide-up flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}
