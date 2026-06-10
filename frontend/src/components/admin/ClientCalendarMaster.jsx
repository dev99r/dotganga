import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ClientCredentialsVault from './ClientCredentialsVault';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay,
  isBefore, startOfDay, isThisMonth, isSameMonth,
} from 'date-fns';

// ─── constants ────────────────────────────────────────────────────────────────

const PLATFORMS  = ['Instagram','Facebook','LinkedIn','Twitter','YouTube','WhatsApp'];
const CATEGORIES = ['Reel','Carousel','Story','Organic','Ad Creative'];
const PLATFORM_ICONS = { Instagram:'📸', Facebook:'👍', LinkedIn:'💼', Twitter:'🐦', YouTube:'▶️', WhatsApp:'💬' };

const CAT = {
  Reel:          { icon:'🎬', bg:'bg-violet-100',  text:'text-violet-700',  border:'border-violet-300', dot:'bg-violet-500',  grad:'from-violet-500 to-purple-600'  },
  Carousel:      { icon:'🖼️', bg:'bg-blue-100',    text:'text-blue-700',    border:'border-blue-300',   dot:'bg-blue-500',    grad:'from-blue-500 to-cyan-600'      },
  Story:         { icon:'📱', bg:'bg-pink-100',    text:'text-pink-700',    border:'border-pink-300',   dot:'bg-pink-500',    grad:'from-pink-500 to-rose-600'      },
  Organic:       { icon:'🌿', bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-300',dot:'bg-emerald-500', grad:'from-emerald-500 to-teal-600'   },
  'Ad Creative': { icon:'🎯', bg:'bg-amber-100',   text:'text-amber-700',   border:'border-amber-300',  dot:'bg-amber-500',   grad:'from-orange-500 to-amber-600'   },
};
const getCat = k => CAT[k] || { icon:'📋', bg:'bg-slate-100', text:'text-slate-700', border:'border-slate-300', dot:'bg-slate-400', grad:'from-slate-400 to-slate-600' };

const CLIENT_PALETTE = [
  { bg:'bg-violet-500',  light:'bg-violet-50',   text:'text-violet-700',  border:'border-violet-300', ring:'ring-violet-400', hex:'#8b5cf6' },
  { bg:'bg-pink-500',    light:'bg-pink-50',     text:'text-pink-700',    border:'border-pink-300',   ring:'ring-pink-400',   hex:'#ec4899' },
  { bg:'bg-blue-500',    light:'bg-blue-50',     text:'text-blue-700',    border:'border-blue-300',   ring:'ring-blue-400',   hex:'#3b82f6' },
  { bg:'bg-emerald-500', light:'bg-emerald-50',  text:'text-emerald-700', border:'border-emerald-300',ring:'ring-emerald-400',hex:'#10b981' },
  { bg:'bg-orange-500',  light:'bg-orange-50',   text:'text-orange-700',  border:'border-orange-300', ring:'ring-orange-400', hex:'#f97316' },
  { bg:'bg-cyan-500',    light:'bg-cyan-50',     text:'text-cyan-700',    border:'border-cyan-300',   ring:'ring-cyan-400',   hex:'#06b6d4' },
  { bg:'bg-rose-500',    light:'bg-rose-50',     text:'text-rose-700',    border:'border-rose-300',   ring:'ring-rose-400',   hex:'#f43f5e' },
  { bg:'bg-teal-500',    light:'bg-teal-50',     text:'text-teal-700',    border:'border-teal-300',   ring:'ring-teal-400',   hex:'#14b8a6' },
  { bg:'bg-indigo-500',  light:'bg-indigo-50',   text:'text-indigo-700',  border:'border-indigo-300', ring:'ring-indigo-400', hex:'#6366f1' },
  { bg:'bg-fuchsia-500', light:'bg-fuchsia-50',  text:'text-fuchsia-700', border:'border-fuchsia-300',ring:'ring-fuchsia-400',hex:'#d946ef' },
  { bg:'bg-lime-500',    light:'bg-lime-50',     text:'text-lime-700',    border:'border-lime-300',   ring:'ring-lime-400',   hex:'#84cc16' },
  { bg:'bg-sky-500',     light:'bg-sky-50',      text:'text-sky-700',     border:'border-sky-300',    ring:'ring-sky-400',    hex:'#0ea5e9' },
  { bg:'bg-amber-500',   light:'bg-amber-50',    text:'text-amber-700',   border:'border-amber-300',  ring:'ring-amber-400',  hex:'#f59e0b' },
  { bg:'bg-green-500',   light:'bg-green-50',    text:'text-green-700',   border:'border-green-300',  ring:'ring-green-400',  hex:'#22c55e' },
  { bg:'bg-purple-500',  light:'bg-purple-50',   text:'text-purple-700',  border:'border-purple-300', ring:'ring-purple-400', hex:'#a855f7' },
  { bg:'bg-red-500',     light:'bg-red-50',      text:'text-red-700',     border:'border-red-300',    ring:'ring-red-400',    hex:'#ef4444' },
  { bg:'bg-slate-500',   light:'bg-slate-50',    text:'text-slate-700',   border:'border-slate-300',  ring:'ring-slate-400',  hex:'#64748b' },
];

const fd  = iso => { try { return format(parseISO(iso), 'dd MMM'); }          catch { return '—'; } };
const fdt = iso => { try { return format(parseISO(iso), 'dd MMM · hh:mm a'); } catch { return '—'; } };

// ─── PostModal ─────────────────────────────────────────────────────────────────

function PostModal({ post, clients, preDate, preClient, onClose, onSave }) {
  const isEdit = !!post?._id;
  const [form, setForm] = useState({
    clientId:      post?.clientId?._id || post?.clientId || preClient || '',
    category:      post?.category || 'Reel',
    platforms:     post?.platforms || ['Instagram'],
    caption:       post?.caption || '',
    hashtags:      post?.hashtags || '',
    notes:         post?.notes || '',
    scheduledDate: post?.scheduledDate
      ? format(parseISO(post.scheduledDate), "yyyy-MM-dd'T'HH:mm")
      : preDate
        ? format(preDate, "yyyy-MM-dd'T'10:00")
        : format(new Date(), "yyyy-MM-dd'T'10:00"),
    status: post?.status || 'Scheduled',
  });
  const [saving,    setSaving]    = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedClient = clients.find(c => c._id === (form.clientId?._id || form.clientId));

  const generateAI = async () => {
    if (!form.clientId) { toast.error('Select a client first.'); return; }
    setAiLoading(true);
    try {
      const r = await api.post('/ai/caption', {
        category:     form.category,
        industry:     selectedClient?.industry || '',
        businessName: selectedClient?.businessName || '',
        platform:     form.platforms[0] || 'Instagram',
      });
      setForm(f => ({ ...f, caption: r.data.caption || f.caption, hashtags: r.data.hashtags || f.hashtags }));
      toast.success(r.data.source === 'ai' ? '✨ AI caption generated!' : '✨ Caption generated!');
    } catch { toast.error('AI unavailable — try again.'); }
    finally { setAiLoading(false); }
  };

  const togglePlatform = p =>
    setForm(f => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p] }));

  const handleSave = async () => {
    if (!form.clientId)       { toast.error('Select a client.'); return; }
    if (!form.caption.trim()) { toast.error('Add a caption.'); return; }
    if (!form.platforms.length){ toast.error('Select at least one platform.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, scheduledDate: new Date(form.scheduledDate).toISOString() };
      if (isEdit) { await api.put(`/posts/${post._id}`, payload); toast.success('Post updated!'); }
      else        { await api.post('/posts', payload);            toast.success('Post created!'); }
      onSave(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const cat = getCat(form.category);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-xl max-h-[95vh] overflow-y-auto">
        <div className={`bg-gradient-to-r ${cat.grad} px-6 py-5 rounded-t-3xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-black text-xl">{isEdit ? '✏️ Edit Post' : '➕ New Post'}</p>
              <p className="text-white/70 text-sm mt-0.5">{isEdit ? `Editing · ${fd(post.scheduledDate)}` : 'Add to content calendar'}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 font-black text-lg">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* client */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Client *</label>
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">— Select a client —</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
            </select>
          </div>

          {/* category */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Content Type *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const cfg = getCat(c); const sel = form.category === c;
                return (
                  <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${sel ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {cfg.icon} {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* platforms */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Platforms *</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const sel = form.platforms.includes(p);
                return (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${sel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {PLATFORM_ICONS[p]} {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* date */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Scheduled Date & Time *</label>
            <input type="datetime-local" value={form.scheduledDate}
              onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Caption *</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${form.caption.length > 2000 ? 'text-red-500' : 'text-slate-400'}`}>{form.caption.length}/2200</span>
                <button type="button" onClick={generateAI} disabled={aiLoading}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white font-black text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-60 shadow-md shadow-purple-500/30">
                  {aiLoading
                    ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating…</>
                    : <>✨ AI Write</>}
                </button>
              </div>
            </div>
            <textarea value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Write the caption… or click ✨ AI Write to generate one!" rows={5}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300" />
          </div>

          {/* hashtags */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Hashtags</label>
            <input type="text" value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
              placeholder="#brand #instagram #reels"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300" />
          </div>

          {/* notes */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Internal Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes for the team…" rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300" />
          </div>

          {/* status */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Status</label>
            <div className="flex gap-2">
              {['Draft','Scheduled','Posted'].map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all ${form.status === s ? (s==='Posted'?'bg-emerald-600 border-emerald-600 text-white':s==='Scheduled'?'bg-blue-600 border-blue-600 text-white':'bg-slate-600 border-slate-600 text-white') : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {s==='Posted'?'✅ ':s==='Scheduled'?'📅 ':'📝 '}{s}
                </button>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className={`flex-1 py-3 bg-gradient-to-r ${cat.grad} text-white font-black rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2`}>
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : isEdit ? '💾 Update Post' : '🚀 Create Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PostDetailPanel ────────────────────────────────────────────────────────────

function PostDetailPanel({ post, clients, onClose, onEdit, onRefresh }) {
  const [marking,  setMarking]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cat    = getCat(post.category);
  const cid    = post.clientId?._id || post.clientId;
  const client = clients.find(c => c._id === cid);
  const cidx   = clients.findIndex(c => c._id === cid);
  const pal    = CLIENT_PALETTE[cidx % CLIENT_PALETTE.length] || CLIENT_PALETTE[0];

  const doMarkPosted = async () => {
    setMarking(true);
    try {
      await api.put(`/posts/${post._id}`, { status: 'Posted', approvalStatus: 'Approved' });
      toast.success('✅ Marked as Posted!');
      onRefresh(); onClose();
    } catch { toast.error('Failed to update.'); }
    finally { setMarking(false); }
  };

  const doDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted.');
      onRefresh(); onClose();
    } catch { toast.error('Failed to delete.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`bg-gradient-to-r ${cat.grad} px-5 py-4 rounded-t-3xl`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-white font-black text-lg">{post.category}</span>
              </div>
              <p className="text-white/80 text-sm">{fdt(post.scheduledDate)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 font-black shrink-0">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {client && (
            <div className={`inline-flex items-center gap-2 ${pal.light} ${pal.text} ${pal.border} border rounded-xl px-3 py-1.5 text-sm font-black`}>
              <span className={`w-2 h-2 rounded-full ${pal.bg}`} />
              {client.businessName}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {post.platforms?.map(p => (
              <span key={p} className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{PLATFORM_ICONS[p]} {p}</span>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${post.status==='Posted'?'bg-emerald-100 text-emerald-700':post.status==='Scheduled'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600'}`}>
              {post.status==='Posted'?'✅':post.status==='Scheduled'?'📅':'📝'} {post.status}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${post.approvalStatus==='Approved'?'bg-emerald-100 text-emerald-700':post.approvalStatus==='Pending'?'bg-amber-100 text-amber-700':post.approvalStatus==='Rejected'?'bg-red-100 text-red-700':'bg-violet-100 text-violet-700'}`}>
              {post.approvalStatus==='Approved'?'✅':post.approvalStatus==='Pending'?'⏳':post.approvalStatus==='Rejected'?'❌':'✏️'} {post.approvalStatus}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-black text-slate-400 mb-1.5">Caption</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
          </div>

          {post.hashtags && <p className="text-xs text-blue-600 leading-relaxed">{post.hashtags}</p>}

          {post.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-black text-amber-600 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{post.notes}</p>
            </div>
          )}

          {post.createdBy?.name && (
            <p className="text-xs text-slate-400 font-bold">Created by {post.createdBy.name}</p>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {post.status !== 'Posted' && (
              <button onClick={doMarkPosted} disabled={marking}
                className="col-span-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {marking ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅'}
                Mark as Posted
              </button>
            )}
            <button onClick={() => { onClose(); onEdit(post); }}
              className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all active:scale-95">
              ✏️ Edit
            </button>
            <button onClick={doDelete} disabled={deleting}
              className="py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl transition-all active:scale-95 disabled:opacity-60">
              {deleting ? '…' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QuotaBar ──────────────────────────────────────────────────────────────────

function QuotaBar({ client, posts, month }) {
  const targets = client?.contentTargets || {};
  const monthPosts = useMemo(() =>
    posts.filter(p => {
      const cid = p.clientId?._id || p.clientId;
      if (cid !== client._id) return false;
      try { return isSameMonth(parseISO(p.scheduledDate), month); } catch { return false; }
    }),
    [posts, client._id, month]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(cat => {
        const cfg   = getCat(cat);
        const target = targets[cat] || 0;
        const actual = monthPosts.filter(p => p.category === cat).length;
        const pct    = target ? Math.min(100, Math.round((actual / target) * 100)) : 0;
        const over   = actual > target && target > 0;
        return (
          <div key={cat} className={`flex items-center gap-2 ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2 flex-1 min-w-[120px]`}>
            <span className="text-base shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black ${cfg.text} uppercase`}>{cat}</span>
                <span className={`text-[10px] font-black ${over ? 'text-emerald-600' : cfg.text}`}>{actual}/{target || '∞'}</span>
              </div>
              {target > 0 && (
                <div className="h-1 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full ${over ? 'bg-emerald-500' : cfg.dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

function DayPanel({ day, posts, clients, clientId, onClose, onPostClick, onAddPost }) {
  const clientColorMap = useMemo(() => {
    const map = {};
    clients.forEach((c, i) => { map[c._id] = CLIENT_PALETTE[i % CLIENT_PALETTE.length]; });
    return map;
  }, [clients]);

  const dayPosts = useMemo(() => posts.filter(p => {
    try {
      const match = isSameDay(parseISO(p.scheduledDate), day);
      if (clientId) return match && (p.clientId?._id || p.clientId) === clientId;
      return match;
    } catch { return false; }
  }), [posts, day, clientId]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <p className="font-black text-slate-900 text-lg">{format(day, 'EEEE')}</p>
            <p className="text-sm text-slate-400 font-bold">{format(day, 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAddPost}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-black px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              ➕ Add Post
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-500">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {dayPosts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-black text-slate-400 mb-4">No posts on this day.</p>
              <button onClick={onAddPost}
                className="bg-blue-600 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:bg-blue-700">
                ➕ Add Post for this Day
              </button>
            </div>
          ) : (
            dayPosts.map(p => {
              const cid    = p.clientId?._id || p.clientId;
              const client = clients.find(c => c._id === cid);
              const pal    = clientColorMap[cid] || CLIENT_PALETTE[0];
              const cat    = getCat(p.category);
              return (
                <button key={p._id} onClick={() => onPostClick(p)}
                  className={`w-full text-left bg-white border-2 ${pal.border} rounded-2xl p-3.5 hover:shadow-md transition-all`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 ${pal.bg} rounded-xl flex items-center justify-center text-white font-black shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-black ${pal.text}`}>{client?.businessName || 'Client'}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status==='Posted'?'bg-emerald-100 text-emerald-700':p.status==='Scheduled'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600'}`}>
                            {p.status==='Posted'?'✅':p.status==='Scheduled'?'📅':'📝'} {p.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{p.caption}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {p.platforms?.slice(0,3).map(pl => (
                          <span key={pl} className="text-xs text-slate-400">{PLATFORM_ICONS[pl]}</span>
                        ))}
                        <span className="ml-auto text-[10px] text-slate-400 font-bold">{format(parseISO(p.scheduledDate), 'hh:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ClientCalendar ───────────────────────────────────────────────────────────

function ClientCalendar({ client, clientIdx, posts, month, onDayClick, onPostClick }) {
  const pal   = CLIENT_PALETTE[clientIdx % CLIENT_PALETTE.length];
  const start = startOfMonth(month);
  const end   = endOfMonth(month);
  const days  = eachDayOfInterval({ start, end });
  const blanks = getDay(start);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      if ((p.clientId?._id || p.clientId) !== client._id) return;
      try {
        const key = format(parseISO(p.scheduledDate), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(p);
      } catch {}
    });
    return map;
  }, [posts, client._id]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`b${i}`} className="bg-slate-50/30 min-h-[52px] sm:min-h-[80px]" />
        ))}
        {days.map(day => {
          const key   = format(day, 'yyyy-MM-dd');
          const dPost = postsByDay[key] || [];
          const isT   = isToday(day);
          const past  = isBefore(day, startOfDay(new Date()));

          return (
            <div key={key} onClick={() => onDayClick(day)}
              className={`min-h-[52px] sm:min-h-[80px] p-1 cursor-pointer transition-colors group relative ${isT?`${pal.light} ring-1 ring-inset ${pal.ring}`:past?'bg-slate-50/30':'bg-white hover:bg-slate-50'}`}>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black mb-0.5 ${isT?`${pal.bg} text-white`:'text-slate-600 group-hover:bg-slate-100'}`}>
                {format(day, 'd')}
              </div>
              {/* mobile: dots */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {dPost.slice(0,4).map(p => {
                  const c = getCat(p.category);
                  return (
                    <button key={p._id} onClick={e => { e.stopPropagation(); onPostClick(p); }}
                      className={`w-2 h-2 rounded-full ${c.dot}`} />
                  );
                })}
                {dPost.length > 4 && <span className="text-[8px] font-black text-slate-400">+{dPost.length-4}</span>}
              </div>
              {/* desktop: chips */}
              <div className="hidden sm:block space-y-0.5">
                {dPost.slice(0,3).map(p => {
                  const c = getCat(p.category);
                  return (
                    <button key={p._id} onClick={e => { e.stopPropagation(); onPostClick(p); }}
                      className={`w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded-md ${pal.light} border ${pal.border} hover:opacity-80 transition-opacity`}>
                      <span className="text-[9px] shrink-0">{c.icon}</span>
                      <span className={`text-[9px] lg:text-[10px] font-black truncate ${pal.text}`}>
                        {p.category}
                        {p.status === 'Posted' && ' ✅'}
                        {p.approvalStatus === 'Pending' && p.status !== 'Posted' && ' ⏳'}
                      </span>
                    </button>
                  );
                })}
                {dPost.length > 3 && <div className="text-[9px] font-black text-slate-400 px-1">+{dPost.length-3} more</div>}
              </div>
              {!past && (
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`w-4 h-4 ${pal.bg} rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-md`}>+</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AllClientsOverview ────────────────────────────────────────────────────────

function AllClientsOverview({ clients, posts, month, onClientSelect }) {
  const now = new Date();

  return (
    <div className="space-y-6">
      {/* header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(() => {
          const total   = posts.length;
          const posted  = posts.filter(p => p.status === 'Posted').length;
          const pending = posts.filter(p => p.approvalStatus === 'Pending').length;
          const overdue = posts.filter(p => { try { return isBefore(parseISO(p.scheduledDate), startOfDay(now)) && p.status !== 'Posted'; } catch { return false; } }).length;
          return [
            { label:'Total Posts',  val:total,   icon:'📋', bg:'bg-blue-600'    },
            { label:'Posted',       val:posted,  icon:'✅', bg:'bg-emerald-600' },
            { label:'Needs Review', val:pending, icon:'⏳', bg:'bg-amber-500'   },
            { label:'Overdue',      val:overdue, icon:'🚨', bg:'bg-red-500'     },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center text-white text-lg mb-2`}>{s.icon}</div>
              <p className="text-2xl font-black text-slate-800">{s.val}</p>
              <p className="text-xs text-slate-400 font-bold">{s.label}</p>
            </div>
          ));
        })()}
      </div>

      {/* client grid */}
      <div>
        <h2 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
          <span>👥</span> All Clients — {format(month, 'MMMM yyyy')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, i) => {
            const pal      = CLIENT_PALETTE[i % CLIENT_PALETTE.length];
            const cPosts   = posts.filter(p => (p.clientId?._id || p.clientId) === client._id);
            const mPosts   = cPosts.filter(p => { try { return isSameMonth(parseISO(p.scheduledDate), month); } catch { return false; } });
            const posted   = mPosts.filter(p => p.status === 'Posted').length;
            const pending  = mPosts.filter(p => p.approvalStatus === 'Pending').length;
            const overdue  = cPosts.filter(p => { try { return isBefore(parseISO(p.scheduledDate), startOfDay(now)) && p.status !== 'Posted'; } catch { return false; } }).length;
            const pct      = mPosts.length ? Math.round((posted / mPosts.length) * 100) : 0;
            const targets  = client.contentTargets || {};
            const totalTarget = Object.values(targets).reduce((a, b) => a + b, 0);

            return (
              <button key={client._id} onClick={() => onClientSelect(client._id)}
                className={`text-left bg-white rounded-2xl border-2 ${pal.border} shadow-sm hover:shadow-lg transition-all hover:scale-[1.01] p-5 group`}>
                {/* header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 ${pal.bg} rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 group-hover:scale-110 transition-transform`}>
                    {client.businessName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-base ${pal.text} leading-tight truncate`}>{client.businessName}</p>
                    <p className="text-xs text-slate-400 font-bold truncate">{client.industry || 'Client'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${pal.text}`}>{mPosts.length}</p>
                    <p className="text-[10px] text-slate-400 font-bold">this month</p>
                  </div>
                </div>

                {/* progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-600">{posted} posted / {mPosts.length} total</span>
                    <span className={`font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${pal.bg} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* content type mini bars */}
                <div className="grid grid-cols-5 gap-1 mb-3">
                  {CATEGORIES.map(cat => {
                    const cfg    = getCat(cat);
                    const target = targets[cat] || 0;
                    const actual = mPosts.filter(p => p.category === cat).length;
                    const p2     = target ? Math.min(100, Math.round((actual / target) * 100)) : 0;
                    return (
                      <div key={cat} title={`${cat}: ${actual}/${target}`} className="space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cfg.dot} rounded-full`} style={{ width: `${target ? p2 : 0}%` }} />
                        </div>
                        <p className="text-[9px] text-center text-slate-400 font-bold">{cfg.icon}</p>
                      </div>
                    );
                  })}
                </div>

                {/* bottom badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pending > 0 && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏳ {pending} pending</span>
                  )}
                  {overdue > 0 && (
                    <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚨 {overdue} overdue</span>
                  )}
                  {posted === mPosts.length && mPosts.length > 0 && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ All done!</span>
                  )}
                  <span className="ml-auto text-[10px] font-black text-slate-400 group-hover:text-blue-600 transition-colors">Open calendar →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AddClientModal ───────────────────────────────────────────────────────────

const ADD_INDUSTRIES = [
  'Food & Beverage','Real Estate','Fashion & Apparel','Health & Fitness',
  'Travel & Tourism','Technology & IT','Healthcare','Events & Wedding',
  'Handicrafts & Art','Education','E-commerce','Retail','Other',
];
const ADD_SERVICES   = ['Social Media','Meta Ads','Video Editing','Graphic Design','Website','SEO','Shoot','Branding','Content Writing','Other'];
const ADD_PLATFORMS  = ['Instagram','Facebook','LinkedIn','Twitter','YouTube','WhatsApp'];

function AddClientModal({ onClose, onSaved }) {
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({
    businessName:'', contactName:'', email:'', phone:'', industry:'', notes:'',
    services:[], primaryPlatforms:['Instagram'],
    contentTargets:{ Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 },
    monthlyBudget:'',
  });

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT = (k, delta) => setForm(f => ({ ...f, contentTargets:{ ...f.contentTargets, [k]: Math.max(0, (f.contentTargets[k]||0)+delta) } }));
  const toggleService  = s => set('services',        form.services.includes(s)        ? form.services.filter(x=>x!==s)        : [...form.services, s]);
  const togglePlatform = p => set('primaryPlatforms', form.primaryPlatforms.includes(p)? form.primaryPlatforms.filter(x=>x!==p): [...form.primaryPlatforms, p]);
  const canNext = () => step===1 ? (form.businessName.trim() && form.contactName.trim() && form.email.trim()) : true;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/clients', { ...form, monthlyBudget: Number(form.monthlyBudget)||0 });
      toast.success(`🎉 ${form.businessName} added! Opening calendar…`);
      onSaved(res.data.client);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add client.');
    } finally { setSaving(false); }
  };

  const IC = 'w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all';
  const LB = 'text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-5 relative overflow-hidden shrink-0">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full"/>
          <div className="absolute -bottom-4 right-16 w-20 h-20 bg-white/10 rounded-full"/>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-white font-black text-xl">✨ Add New Client</h2>
              <p className="text-blue-200 text-sm mt-0.5">
                {step === 1 ? 'Step 1 of 2 — Brand & Contact Info' : 'Step 2 of 2 — Services & Content Plan'}
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black transition-all active:scale-95">✕</button>
          </div>
          <div className="relative flex gap-1.5 mt-4">
            {[1,2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-white' : 'bg-white/30'}`}/>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className={LB}>Business Name <span className="text-red-400">*</span></label>
                <input value={form.businessName} onChange={e=>set('businessName',e.target.value)}
                  placeholder="e.g. Sharma Bakery" autoFocus className={IC}/>
              </div>
              <div>
                <label className={LB}>Contact Person <span className="text-red-400">*</span></label>
                <input value={form.contactName} onChange={e=>set('contactName',e.target.value)}
                  placeholder="Owner / point of contact name" className={IC}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LB}>Email <span className="text-red-400">*</span></label>
                  <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                    placeholder="client@email.com" className={IC}/>
                </div>
                <div>
                  <label className={LB}>Phone</label>
                  <input value={form.phone} onChange={e=>set('phone',e.target.value)}
                    placeholder="9876543210" className={IC}/>
                </div>
              </div>
              <div>
                <label className={LB}>Industry</label>
                <div className="flex flex-wrap gap-1.5">
                  {ADD_INDUSTRIES.map(ind => (
                    <button key={ind} type="button" onClick={()=>set('industry',ind)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${form.industry===ind ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LB}>Notes (optional)</label>
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder="Key info about this client, special requests..." rows={2}
                  className={`${IC} resize-none`}/>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={LB}>Services</label>
                <div className="flex flex-wrap gap-1.5">
                  {ADD_SERVICES.map(s => (
                    <button key={s} type="button" onClick={()=>toggleService(s)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${form.services.includes(s) ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={LB}>Active Platforms</label>
                <div className="flex flex-wrap gap-1.5">
                  {ADD_PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={()=>togglePlatform(p)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${form.primaryPlatforms.includes(p) ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={LB}>Monthly Content Targets</label>
                <div className="space-y-2">
                  {[
                    { key:'Reel',         icon:'🎬', col:'bg-violet-500' },
                    { key:'Carousel',     icon:'🖼️', col:'bg-blue-500'   },
                    { key:'Story',        icon:'📱', col:'bg-pink-500'   },
                    { key:'Organic',      icon:'🌿', col:'bg-emerald-500'},
                    { key:'Ad Creative',  icon:'🎯', col:'bg-amber-500'  },
                  ].map(({ key, icon, col }) => (
                    <div key={key} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2.5">
                      <div className={`w-7 h-7 ${col} rounded-lg flex items-center justify-center text-white text-sm shrink-0`}>{icon}</div>
                      <span className="text-xs font-black text-slate-700 flex-1">{key}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={()=>setT(key,-1)}
                          className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-black text-slate-600 text-sm transition-all active:scale-90">−</button>
                        <span className="w-7 text-center font-black text-slate-800 text-sm">{form.contentTargets[key]||0}</span>
                        <button type="button" onClick={()=>setT(key,+1)}
                          className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-black text-slate-600 text-sm transition-all active:scale-90">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={LB}>Monthly Budget (₹)</label>
                <input type="number" value={form.monthlyBudget} onChange={e=>set('monthlyBudget',e.target.value)}
                  placeholder="e.g. 25000" className={IC}/>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-white shrink-0">
          {step > 1 && (
            <button onClick={()=>setStep(s=>s-1)}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm hover:bg-slate-200 transition-all active:scale-95">
              ← Back
            </button>
          )}
          <div className="flex-1"/>
          {step < 2 ? (
            <button onClick={()=>setStep(s=>s+1)} disabled={!canNext()}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-40 active:scale-95 shadow-lg shadow-blue-500/30">
              Next →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:opacity-90 transition-all disabled:opacity-40 active:scale-95 shadow-lg shadow-blue-500/30">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
                : '🎉 Create & Open Calendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ClientSidebar ────────────────────────────────────────────────────────────

function ClientSidebar({ clients, posts, month, selectedId, onSelect, onClose, onAddClient }) {
  const [search, setSearch] = useState('');
  const now = new Date();

  const filtered = useMemo(() =>
    clients.filter(c => c.businessName.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* sidebar header */}
      <div className="p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-slate-800 text-sm">Clients <span className="text-slate-400 font-normal">({clients.length})</span></p>
          <div className="flex items-center gap-1.5">
            <button onClick={onAddClient}
              title="Add New Client"
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-black text-base transition-all active:scale-90 shadow-sm shadow-blue-500/30">+</button>
            {onClose && (
              <button onClick={onClose} className="lg:hidden w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs">✕</button>
            )}
          </div>
        </div>
        <div className="relative">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400" />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* all clients btn */}
      <button onClick={() => onSelect(null)}
        className={`mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${!selectedId ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
        <span className="text-base">🌐</span>
        <span>All Clients</span>
        <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${!selectedId ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {clients.length}
        </span>
      </button>

      {/* client list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 mt-1">
        {filtered.map((client, i) => {
          const pal    = CLIENT_PALETTE[clients.indexOf(client) % CLIENT_PALETTE.length];
          const cPosts = posts.filter(p => (p.clientId?._id || p.clientId) === client._id);
          const mPosts = cPosts.filter(p => { try { return isSameMonth(parseISO(p.scheduledDate), month); } catch { return false; } });
          const posted = mPosts.filter(p => p.status === 'Posted').length;
          const overdue = cPosts.filter(p => { try { return isBefore(parseISO(p.scheduledDate), startOfDay(now)) && p.status !== 'Posted'; } catch { return false; } }).length;
          const active = selectedId === client._id;

          return (
            <button key={client._id} onClick={() => onSelect(client._id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${active ? `${pal.light} ${pal.border} border-2` : 'hover:bg-slate-50 border-2 border-transparent'}`}>
              <div className={`w-7 h-7 ${pal.bg} rounded-lg flex items-center justify-center text-white font-black text-[11px] shrink-0`}>
                {client.businessName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black truncate ${active ? pal.text : 'text-slate-700'}`}>{client.businessName}</p>
                <p className="text-[10px] text-slate-400 font-bold">{mPosts.length} posts · {posted} done</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                {overdue > 0 && (
                  <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 rounded-full">🚨{overdue}</span>
                )}
                {mPosts.length > 0 && (
                  <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${pal.bg} rounded-full`} style={{ width: `${Math.round((posted/mPosts.length)*100)}%` }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <p className="text-slate-400 text-xs font-bold">No clients found.</p>
            <button onClick={onAddClient}
              className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all active:scale-95">
              + Add First Client
            </button>
          </div>
        )}

        {/* sticky add button at bottom of list */}
        <div className="sticky bottom-0 pt-2 pb-1">
          <button onClick={onAddClient}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
            <span className="text-base leading-none">+</span>
            <span>Add New Client</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function ClientCalendarMaster() {
  const [clients,     setClients]     = useState([]);
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [month,       setMonth]       = useState(new Date());
  const [selectedId,  setSelectedId]  = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [createModal,   setCreateModal]   = useState(false);
  const [editPost,      setEditPost]      = useState(null);
  const [detailPost,    setDetailPost]    = useState(null);
  const [dayPanel,      setDayPanel]      = useState(null);
  const [preDate,       setPreDate]       = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/clients'),
        api.get('/posts?limit=1000'),
      ]);
      setClients(cRes.data.clients || cRes.data || []);
      setPosts(pRes.data.posts     || pRes.data || []);
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const selectedClient = useMemo(() => clients.find(c => c._id === selectedId), [clients, selectedId]);
  const selectedIdx    = useMemo(() => clients.findIndex(c => c._id === selectedId), [clients, selectedId]);
  const pal            = selectedIdx >= 0 ? CLIENT_PALETTE[selectedIdx % CLIENT_PALETTE.length] : null;

  const monthPosts = useMemo(() =>
    posts.filter(p => { try { return isSameMonth(parseISO(p.scheduledDate), month); } catch { return false; } }),
    [posts, month]
  );

  const clientMonthPosts = useMemo(() =>
    selectedId ? monthPosts.filter(p => (p.clientId?._id || p.clientId) === selectedId) : monthPosts,
    [monthPosts, selectedId]
  );

  const handleClientAdded = useCallback(async (newClient) => {
    setShowAddClient(false);
    // Optimistic: add to top of list and immediately open their calendar
    setClients(prev => [newClient, ...prev]);
    setSelectedId(newClient._id);
    setSidebarOpen(false);
    // Background refetch to sync with server
    try {
      const cRes = await api.get('/clients');
      setClients(cRes.data.clients || cRes.data || []);
    } catch {}
  }, []);

  const handleDayClick = day => {
    setPreDate(day);
    setDayPanel(day);
  };

  const handlePostClick = post => {
    setDayPanel(null);
    setDetailPost(post);
  };

  const handleAddPost = () => {
    setDayPanel(null);
    setCreateModal(true);
  };

  const closeAll = () => {
    setCreateModal(false);
    setEditPost(null);
    setDetailPost(null);
    setPreDate(null);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 font-bold">Loading client calendars…</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">

      {/* ── TOP HEADER ── */}
      <div className={`shrink-0 bg-white border-b border-slate-200 shadow-sm`}>
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(s => !s)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-black text-slate-900 text-lg flex items-center gap-2">
                {selectedClient ? (
                  <>
                    <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600 transition-colors font-black text-base">←</button>
                    <span className={`w-7 h-7 ${pal?.bg} rounded-lg flex items-center justify-center text-white font-black text-sm inline-flex`}>
                      {selectedClient.businessName[0]}
                    </span>
                    <span className={pal?.text}>{selectedClient.businessName}</span>
                  </>
                ) : (
                  <>
                    <span>📅</span> Client Calendar Master
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-400 font-bold">
                {selectedClient
                  ? `${clientMonthPosts.length} posts in ${format(month, 'MMMM yyyy')} · ${clientMonthPosts.filter(p => p.status==='Posted').length} posted`
                  : `${clients.length} clients · ${monthPosts.length} posts this month`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* month nav (shown when viewing a client) */}
            {selectedClient && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setMonth(m => subMonths(m, 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 transition-colors text-sm">‹</button>
                <span className="font-black text-slate-800 text-sm min-w-[120px] text-center">{format(month, 'MMM yyyy')}</span>
                <button onClick={() => setMonth(m => addMonths(m, 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 transition-colors text-sm">›</button>
                <button onClick={() => setMonth(new Date())}
                  className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-colors">
                  Now
                </button>
              </div>
            )}

            {/* quick stats pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {(() => {
                const src = selectedId
                  ? posts.filter(p => (p.clientId?._id || p.clientId) === selectedId)
                  : posts;
                const pending = src.filter(p => p.approvalStatus === 'Pending').length;
                const overdue = src.filter(p => { try { return isBefore(parseISO(p.scheduledDate), startOfDay(new Date())) && p.status !== 'Posted'; } catch { return false; } }).length;
                return [
                  pending > 0 && <div key="p" className="text-xs font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg">⏳ {pending}</div>,
                  overdue > 0 && <div key="o" className="text-xs font-black bg-red-100 text-red-700 px-2.5 py-1 rounded-lg">🚨 {overdue}</div>,
                ].filter(Boolean);
              })()}
            </div>

            <button onClick={handleAddPost}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-4 py-2 rounded-xl transition-colors shadow-sm">
              ➕ Add Post
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          </div>
        )}

        {/* ── SIDEBAR ── */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 shrink-0 flex flex-col
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `} style={{ top: 0, bottom: 0 }}>
          <ClientSidebar
            clients={clients}
            posts={posts}
            month={month}
            selectedId={selectedId}
            onSelect={id => { setSelectedId(id); setSidebarOpen(false); }}
            onClose={() => setSidebarOpen(false)}
            onAddClient={() => setShowAddClient(true)}
          />
        </div>

        {/* ── MAIN AREA ── */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-w-0">

          {selectedClient ? (
            // ── PER-CLIENT CALENDAR VIEW ──
            <div className="space-y-4">
              {/* quota bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <span>🎯</span> Content Quota — {format(month, 'MMMM yyyy')}
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">
                    {clientMonthPosts.filter(p => p.status === 'Posted').length} / {clientMonthPosts.length} posted
                  </span>
                </div>
                <QuotaBar client={selectedClient} posts={posts} month={month} />
              </div>

              {/* month nav (mobile) + calendar */}
              <div className="sm:hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex items-center justify-between">
                <button onClick={() => setMonth(m => subMonths(m, 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 font-black text-slate-600 flex items-center justify-center">‹</button>
                <span className="font-black text-slate-800">{format(month, 'MMMM yyyy')}</span>
                <button onClick={() => setMonth(m => addMonths(m, 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 font-black text-slate-600 flex items-center justify-center">›</button>
              </div>

              <ClientCalendar
                client={selectedClient}
                clientIdx={selectedIdx}
                posts={posts}
                month={month}
                onDayClick={handleDayClick}
                onPostClick={handlePostClick}
              />

              {/* this month's posts list */}
              {clientMonthPosts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                      <span>📋</span> Posts this month
                      <span className="bg-slate-100 text-slate-600 text-xs font-black px-2 py-0.5 rounded-full">{clientMonthPosts.length}</span>
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {clientMonthPosts.sort((a,b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map(p => {
                      const cat = getCat(p.category);
                      return (
                        <button key={p._id} onClick={() => handlePostClick(p)}
                          className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                          <span className="text-xl shrink-0">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] font-black ${cat.text} ${cat.bg} px-1.5 py-0.5 rounded-md`}>{p.category}</span>
                              {p.platforms?.slice(0,3).map(pl => <span key={pl} className="text-xs text-slate-400">{PLATFORM_ICONS[pl]}</span>)}
                            </div>
                            <p className="text-xs text-slate-700 line-clamp-1">{p.caption}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-slate-600">{fd(p.scheduledDate)}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status==='Posted'?'bg-emerald-100 text-emerald-700':p.status==='Scheduled'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600'}`}>
                              {p.status==='Posted'?'✅':p.status==='Scheduled'?'📅':'📝'} {p.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* ── CREDENTIALS VAULT ── */}
              <ClientCredentialsVault
                clientId={selectedClient._id}
                clientName={selectedClient.businessName}
              />

            </div>
          ) : (
            // ── ALL CLIENTS MASTER OVERVIEW ──
            <AllClientsOverview
              clients={clients}
              posts={posts}
              month={month}
              onClientSelect={id => { setSelectedId(id); }}
            />
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSaved={handleClientAdded}
        />
      )}

      {(createModal || editPost) && (
        <PostModal
          post={editPost || null}
          clients={clients}
          preDate={preDate || (dayPanel || null)}
          preClient={selectedId}
          onClose={closeAll}
          onSave={fetchAll}
        />
      )}

      {detailPost && (
        <PostDetailPanel
          post={detailPost}
          clients={clients}
          onClose={() => setDetailPost(null)}
          onEdit={post => { setDetailPost(null); setEditPost(post); }}
          onRefresh={fetchAll}
        />
      )}

      {dayPanel && (
        <DayPanel
          day={dayPanel}
          posts={posts}
          clients={clients}
          clientId={selectedId}
          onClose={() => setDayPanel(null)}
          onPostClick={handlePostClick}
          onAddPost={() => { setPreDate(dayPanel); setDayPanel(null); setCreateModal(true); }}
        />
      )}

      {/* mobile FAB */}
      <button onClick={handleAddPost}
        className="lg:hidden fixed bottom-20 right-4 z-10 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all">
        ➕
      </button>
    </div>
  );
}
