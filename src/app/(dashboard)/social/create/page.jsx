'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = ['Instagram','Facebook','YouTube','LinkedIn','Twitter','WhatsApp'];
const MEDIA_TYPES = ['image','video','reel','story','carousel'];
const PLATFORM_ICONS = {
  Instagram: '📸', Facebook: '📘', YouTube: '▶️', LinkedIn: '💼', Twitter: '🐦', WhatsApp: '💬',
};
const PLATFORM_CFG = {
  Instagram: { bg:'bg-pink-500/15',    text:'text-pink-400',    border:'border-pink-500/40'    },
  Facebook:  { bg:'bg-blue-500/15',    text:'text-blue-400',    border:'border-blue-500/40'    },
  YouTube:   { bg:'bg-red-500/15',     text:'text-red-400',     border:'border-red-500/40'     },
  LinkedIn:  { bg:'bg-sky-500/15',     text:'text-sky-400',     border:'border-sky-500/40'     },
  Twitter:   { bg:'bg-cyan-500/15',    text:'text-cyan-400',    border:'border-cyan-500/40'    },
  WhatsApp:  { bg:'bg-emerald-500/15', text:'text-emerald-400', border:'border-emerald-500/40' },
};

export default function CreatePostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', caption: '', hashtags: '', platforms: [],
    mediaType: 'image', mediaUrls: [], scheduledAt: '',
    client: '', status: 'Draft',
  });
  const [saving, setSaving] = useState(false);
  const [previewPlat, setPreviewPlat] = useState('Instagram');
  const [mediaInput, setMediaInput] = useState('');

  const f = u => setForm(p => ({ ...p, ...u }));

  const togglePlatform = p => {
    const arr = form.platforms.includes(p)
      ? form.platforms.filter(x => x !== p)
      : [...form.platforms, p];
    f({ platforms: arr });
    if (!form.platforms.includes(p)) setPreviewPlat(p);
  };

  const addMedia = () => {
    if (!mediaInput.trim()) return;
    f({ mediaUrls: [...form.mediaUrls, mediaInput.trim()] });
    setMediaInput('');
  };

  const submit = async (status) => {
    if (!form.title.trim()) { alert('Post title is required'); return; }
    if (!form.platforms.length) { alert('Select at least one platform'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        hashtags: form.hashtags.split(/[\s,#]+/).filter(Boolean),
        status,
      };
      const res  = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) router.push('/social');
    } catch { alert('Failed to create post'); }
    setSaving(false);
  };

  const charCount  = form.caption.length;
  const platCfg    = PLATFORM_CFG[previewPlat] || PLATFORM_CFG.Instagram;
  const hashArr    = form.hashtags.split(/[\s,#]+/).filter(Boolean);

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-muted hover:text-slate-200 hover:bg-surface-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-100">Create Post</h1>
          <p className="text-sm text-muted">Design and schedule your content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Form ── */}
        <div className="space-y-4">

          {/* Title */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-black text-muted uppercase tracking-wider">Post Details</p>
            <div>
              <label className="label">Title *</label>
              <input value={form.title} onChange={e => f({ title: e.target.value })}
                className="input" placeholder="Campaign name or post title" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Caption</label>
                <span className={`text-[10px] font-bold ${charCount > 2000 ? 'text-red-400' : 'text-muted'}`}>{charCount}/2200</span>
              </div>
              <textarea value={form.caption} onChange={e => f({ caption: e.target.value })} rows={5}
                className="input resize-none leading-relaxed" placeholder="Write your caption here…" />
            </div>
            <div>
              <label className="label">Hashtags</label>
              <input value={form.hashtags} onChange={e => f({ hashtags: e.target.value })}
                className="input text-primary-light" placeholder="#marketing #brand #growth" />
              {hashArr.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {hashArr.map(h => (
                    <span key={h} className="text-[10px] font-bold bg-primary/10 text-primary-light px-2 py-0.5 rounded-full">#{h}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Client</label>
                <input value={form.client} onChange={e => f({ client: e.target.value })}
                  className="input" placeholder="Client name" />
              </div>
              <div>
                <label className="label">Media Type</label>
                <select value={form.mediaType} onChange={e => f({ mediaType: e.target.value })} className="input">
                  {MEDIA_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Schedule Date & Time</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => f({ scheduledAt: e.target.value })}
                className="input" />
            </div>
          </div>

          {/* Platforms */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-black text-muted uppercase tracking-wider">Platforms *</p>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => {
                const sel = form.platforms.includes(p);
                const cfg = PLATFORM_CFG[p];
                return (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      sel ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-border text-muted hover:border-border-light hover:text-slate-300'
                    }`}>
                    <span className="text-base">{PLATFORM_ICONS[p]}</span>
                    <span className="text-xs">{p}</span>
                    {sel && <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-black text-muted uppercase tracking-wider">Media URLs</p>
            <div className="flex gap-2">
              <input value={mediaInput} onChange={e => setMediaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMedia()}
                className="input flex-1 text-sm" placeholder="Paste image/video URL…" />
              <button onClick={addMedia} className="btn-primary px-3 text-sm">Add</button>
            </div>
            {form.mediaUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.mediaUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => f({ mediaUrls: form.mediaUrls.filter((_, j) => j !== i) })}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => submit('Draft')} disabled={saving} className="btn-ghost flex-1 text-sm py-3">
              💾 Save Draft
            </button>
            <button onClick={() => submit('Pending Approval')} disabled={saving} className="btn-primary flex-1 text-sm py-3">
              {saving ? '…' : '📤 Submit for Approval'}
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-muted uppercase tracking-wider">Live Preview</p>
            <div className="flex gap-1">
              {form.platforms.map(p => (
                <button key={p} onClick={() => setPreviewPlat(p)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                    previewPlat === p ? `${PLATFORM_CFG[p].bg} ${PLATFORM_CFG[p].text}` : 'text-muted hover:text-slate-300'
                  }`}>
                  {PLATFORM_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </div>

          {/* Phone frame */}
          <div className="mx-auto max-w-[280px] xl:max-w-full">
            <div className="bg-black rounded-[40px] p-3 border-4 border-surface-50 shadow-2xl">
              <div className="bg-white rounded-[30px] overflow-hidden">
                {/* Status bar */}
                <div className={`px-4 py-2 flex items-center justify-between ${previewPlat === 'Instagram' ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400' : 'bg-blue-600'}`}>
                  <span className="text-white text-[9px] font-black">{previewPlat}</span>
                  <span className="text-white text-[9px]">9:41</span>
                </div>
                {/* Post header */}
                <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-100">
                  <div className={`w-7 h-7 rounded-full ${platCfg.bg} ${platCfg.text} flex items-center justify-center text-[10px] font-black border ${platCfg.border}`}>
                    {form.client?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900">{form.client || 'DotGanga'}</p>
                    <p className="text-[8px] text-gray-400">Just now</p>
                  </div>
                  <svg className="w-3 h-3 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </div>
                {/* Media */}
                {form.mediaUrls[0] ? (
                  <img src={form.mediaUrls[0]} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-surface-200 to-surface-100 flex items-center justify-center">
                    <p className="text-[10px] text-gray-400">No media</p>
                  </div>
                )}
                {/* Caption */}
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-800 leading-relaxed line-clamp-3">
                    <span className="font-black">{form.client || 'dotganga'} </span>
                    {form.caption || 'Your caption will appear here…'}
                  </p>
                  {hashArr.length > 0 && (
                    <p className="text-[9px] mt-1 line-clamp-1" style={{ color: platCfg.text.replace('text-','#') }}>
                      {hashArr.slice(0,5).map(h => `#${h}`).join(' ')}
                    </p>
                  )}
                  <p className="text-[8px] text-gray-400 mt-1 uppercase tracking-wider">{form.mediaType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
