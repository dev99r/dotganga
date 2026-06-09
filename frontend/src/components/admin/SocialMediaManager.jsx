import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isTomorrow, addMonths, subMonths, getDay,
  isBefore, startOfDay, isThisMonth, addDays,
} from 'date-fns';

// ─── constants ───────────────────────────────────────────────────────────────

const PLATFORMS  = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'WhatsApp'];
const CATEGORIES = ['Reel', 'Carousel', 'Story', 'Organic', 'Ad Creative'];

const CAT = {
  Reel:         { icon: '🎬', bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-300', dot: 'bg-violet-500',  badge: 'bg-violet-600',  grad: 'from-violet-500 to-purple-600'  },
  Carousel:     { icon: '🖼️', bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',   dot: 'bg-blue-500',    badge: 'bg-blue-600',    grad: 'from-blue-500 to-cyan-600'      },
  Story:        { icon: '📱', bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-300',   dot: 'bg-pink-500',    badge: 'bg-pink-600',    grad: 'from-pink-500 to-rose-600'      },
  Organic:      { icon: '🌿', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300',dot: 'bg-emerald-500', badge: 'bg-emerald-600', grad: 'from-emerald-500 to-teal-600'   },
  'Ad Creative':{ icon: '🎯', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',  dot: 'bg-amber-500',   badge: 'bg-amber-600',   grad: 'from-orange-500 to-amber-600'   },
};
const getCat = k => CAT[k] || { icon: '📋', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400', badge: 'bg-slate-500', grad: 'from-slate-400 to-slate-600' };

const PLATFORM_ICONS = { Instagram: '📸', Facebook: '👍', LinkedIn: '💼', Twitter: '🐦', YouTube: '▶️', WhatsApp: '💬' };

// 17 vivid client colors
const CLIENT_PALETTE = [
  { bg: 'bg-violet-500',  light: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-400', ring: 'ring-violet-400'  },
  { bg: 'bg-pink-500',    light: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-400',   ring: 'ring-pink-400'    },
  { bg: 'bg-blue-500',    light: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-400',   ring: 'ring-blue-400'    },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400',ring: 'ring-emerald-400' },
  { bg: 'bg-orange-500',  light: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-400', ring: 'ring-orange-400'  },
  { bg: 'bg-cyan-500',    light: 'bg-cyan-100',    text: 'text-cyan-700',    border: 'border-cyan-400',   ring: 'ring-cyan-400'    },
  { bg: 'bg-rose-500',    light: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-400',   ring: 'ring-rose-400'    },
  { bg: 'bg-teal-500',    light: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-400',   ring: 'ring-teal-400'    },
  { bg: 'bg-indigo-500',  light: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-400', ring: 'ring-indigo-400'  },
  { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-400',ring: 'ring-fuchsia-400' },
  { bg: 'bg-lime-500',    light: 'bg-lime-100',    text: 'text-lime-700',    border: 'border-lime-400',   ring: 'ring-lime-400'    },
  { bg: 'bg-sky-500',     light: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-400',    ring: 'ring-sky-400'     },
  { bg: 'bg-amber-500',   light: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-400',  ring: 'ring-amber-400'   },
  { bg: 'bg-green-500',   light: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-400',  ring: 'ring-green-400'   },
  { bg: 'bg-purple-500',  light: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-400', ring: 'ring-purple-400'  },
  { bg: 'bg-red-500',     light: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-400',    ring: 'ring-red-400'     },
  { bg: 'bg-slate-500',   light: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-400',  ring: 'ring-slate-400'   },
];

const fd  = (iso) => { try { return format(parseISO(iso), 'dd MMM'); } catch { return '—'; } };
const fdt = (iso) => { try { return format(parseISO(iso), 'dd MMM · hh:mm a'); } catch { return '—'; } };

// ─── PostModal (Create/Edit) ──────────────────────────────────────────────────

function PostModal({ post, clients, preDate, onClose, onSave }) {
  const isEdit = !!post?._id;
  const [form, setForm] = useState({
    clientId:      post?.clientId?._id || post?.clientId || '',
    category:      post?.category || 'Reel',
    platforms:     post?.platforms || ['Instagram'],
    caption:       post?.caption || '',
    hashtags:      post?.hashtags || '',
    scheduledDate: post?.scheduledDate
      ? format(parseISO(post.scheduledDate), "yyyy-MM-dd'T'HH:mm")
      : preDate
        ? format(preDate, "yyyy-MM-dd'T'10:00")
        : format(new Date(), "yyyy-MM-dd'T'10:00"),
    status:        post?.status || 'Scheduled',
  });
  const [saving, setSaving] = useState(false);

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }));
  };

  const handleSave = async () => {
    if (!form.clientId)      { toast.error('Select a client.'); return; }
    if (!form.caption.trim()) { toast.error('Add a caption.'); return; }
    if (!form.platforms.length){ toast.error('Select at least one platform.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, scheduledDate: new Date(form.scheduledDate).toISOString() };
      if (isEdit) {
        await api.put(`/posts/${post._id}`, payload);
        toast.success('Post updated!');
      } else {
        await api.post('/posts', payload);
        toast.success('Post created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const cat = getCat(form.category);
  const selectedClient = clients.find(c => c._id === form.clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-xl max-h-[95vh] overflow-y-auto">

        {/* header */}
        <div className={`bg-gradient-to-r ${cat.grad} px-6 py-5 rounded-t-3xl sm:rounded-t-3xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-black text-xl">
                {isEdit ? '✏️ Edit Post' : '➕ New Post'}
              </p>
              <p className="text-white/70 text-sm mt-0.5">
                {isEdit ? `Editing · ${fd(post.scheduledDate)}` : 'Add to content calendar'}
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 font-black text-lg">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* client selector */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Client *</label>
            <select
              value={form.clientId}
              onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">— Select a client —</option>
              {clients.map((c, i) => {
                const pal = CLIENT_PALETTE[i % CLIENT_PALETTE.length];
                return <option key={c._id} value={c._id}>{c.businessName}</option>;
              })}
            </select>
          </div>

          {/* category */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Content Type *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const cfg = getCat(c);
                const sel = form.category === c;
                return (
                  <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${
                      sel ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
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
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                      sel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Caption *</label>
              <span className={`text-xs font-bold ${form.caption.length > 2000 ? 'text-red-500' : 'text-slate-400'}`}>
                {form.caption.length}/2200
              </span>
            </div>
            <textarea
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Write the caption for this post…"
              rows={5}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300"
            />
          </div>

          {/* hashtags */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Hashtags</label>
            <input type="text" value={form.hashtags}
              onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
              placeholder="#brand #instagram #reels"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300"
            />
          </div>

          {/* status */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Status</label>
            <div className="flex gap-2">
              {['Draft','Scheduled','Posted'].map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                    form.status === s
                      ? s === 'Posted'   ? 'bg-emerald-600 border-emerald-600 text-white'
                        : s === 'Scheduled' ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-600 border-slate-600 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {s === 'Posted' ? '✅ ' : s === 'Scheduled' ? '📅 ' : '📝 '}{s}
                </button>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex-1 py-3 bg-gradient-to-r ${cat.grad} text-white font-black rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2`}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                : isEdit ? '💾 Update Post' : '🚀 Create Post'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PostDetailModal ──────────────────────────────────────────────────────────

function PostDetailModal({ post, clients, onClose, onEdit, onMarkPosted, onDelete }) {
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cat    = getCat(post.category);
  const client = clients.find(c => c._id === (post.clientId?._id || post.clientId));
  const clientIdx = clients.findIndex(c => c._id === (post.clientId?._id || post.clientId));
  const pal    = CLIENT_PALETTE[clientIdx % CLIENT_PALETTE.length] || CLIENT_PALETTE[0];

  const doMarkPosted = async () => {
    setMarking(true);
    try {
      await api.put(`/posts/${post._id}`, { status: 'Posted', approvalStatus: 'Approved' });
      toast.success('✅ Marked as Posted!');
      onMarkPosted();
      onClose();
    } catch { toast.error('Failed to update.'); }
    finally { setMarking(false); }
  };

  const doDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted.');
      onMarkPosted();
      onClose();
    } catch { toast.error('Failed to delete.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">

        {/* coloured top */}
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
          {/* client badge */}
          {client && (
            <div className={`inline-flex items-center gap-2 ${pal.light} ${pal.text} ${pal.border} border rounded-xl px-3 py-1.5 text-sm font-black`}>
              <span className={`w-2 h-2 rounded-full ${pal.bg}`} />
              {client.businessName}
            </div>
          )}

          {/* platforms */}
          <div className="flex flex-wrap gap-1.5">
            {post.platforms?.map(p => (
              <span key={p} className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                {PLATFORM_ICONS[p]} {p}
              </span>
            ))}
          </div>

          {/* status pills */}
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              post.status === 'Posted'    ? 'bg-emerald-100 text-emerald-700' :
              post.status === 'Scheduled' ? 'bg-blue-100 text-blue-700'       :
                                            'bg-slate-100 text-slate-600'
            }`}>
              {post.status === 'Posted' ? '✅' : post.status === 'Scheduled' ? '📅' : '📝'} {post.status}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              post.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
              post.approvalStatus === 'Pending'  ? 'bg-amber-100 text-amber-700'     :
              post.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-700'         :
                                                   'bg-violet-100 text-violet-700'
            }`}>
              {post.approvalStatus === 'Approved' ? '✅' : post.approvalStatus === 'Pending' ? '⏳' : post.approvalStatus === 'Rejected' ? '❌' : '✏️'} {post.approvalStatus}
            </span>
          </div>

          {/* caption */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-black text-slate-400 mb-1.5">Caption</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
          </div>

          {/* hashtags */}
          {post.hashtags && (
            <p className="text-xs text-blue-600 leading-relaxed">{post.hashtags}</p>
          )}

          {/* actions */}
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

// ─── master calendar ─────────────────────────────────────────────────────────

function MasterCalendar({ posts, clients, month, onDayClick, onPostClick, filterClient }) {
  const start  = startOfMonth(month);
  const end    = endOfMonth(month);
  const days   = eachDayOfInterval({ start, end });
  const blanks = getDay(start);

  const clientColorMap = useMemo(() => {
    const map = {};
    clients.forEach((c, i) => { map[c._id] = CLIENT_PALETTE[i % CLIENT_PALETTE.length]; });
    return map;
  }, [clients]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      try {
        const key = format(parseISO(p.scheduledDate), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(p);
      } catch {}
    });
    return map;
  }, [posts]);

  const filtered = filterClient
    ? Object.fromEntries(Object.entries(postsByDay).map(([k, v]) => [k, v.filter(p => (p.clientId?._id || p.clientId) === filterClient)]))
    : postsByDay;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* day headers */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-xs font-black text-slate-400 uppercase py-3 px-1">{d}</div>
        ))}
      </div>

      {/* day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`b${i}`} className="bg-slate-50/50 min-h-[80px] lg:min-h-[110px]" />
        ))}
        {days.map(day => {
          const key   = format(day, 'yyyy-MM-dd');
          const dPost = filtered[key] || [];
          const isT   = isToday(day);
          const past  = isBefore(day, startOfDay(new Date()));

          return (
            <div key={key}
              onClick={() => onDayClick(day)}
              className={`min-h-[80px] lg:min-h-[110px] p-1.5 cursor-pointer transition-colors group relative ${
                isT   ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' :
                past  ? 'bg-slate-50/50' :
                        'bg-white hover:bg-slate-50'
              }`}>
              {/* date number */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-1 ${
                isT ? 'bg-blue-600 text-white' : 'text-slate-600 group-hover:bg-slate-200'
              }`}>
                {format(day, 'd')}
              </div>

              {/* post chips */}
              <div className="space-y-0.5">
                {dPost.slice(0, 3).map(p => {
                  const cIdx = clients.findIndex(c => c._id === (p.clientId?._id || p.clientId));
                  const pal  = clientColorMap[p.clientId?._id || p.clientId] || CLIENT_PALETTE[0];
                  const cat  = getCat(p.category);
                  return (
                    <button key={p._id}
                      onClick={e => { e.stopPropagation(); onPostClick(p); }}
                      className={`w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded-md ${pal.light} border ${pal.border} hover:opacity-80 transition-opacity`}>
                      <span className="text-[10px] shrink-0">{cat.icon}</span>
                      <span className={`text-[9px] lg:text-[10px] font-black truncate ${pal.text}`}>
                        {clients.find(c => c._id === (p.clientId?._id || p.clientId))?.businessName?.split(' ')[0] || 'Client'}
                      </span>
                      {p.status === 'Posted' && <span className="ml-auto text-[9px]">✅</span>}
                      {p.approvalStatus === 'Pending' && <span className="ml-auto text-[9px]">⏳</span>}
                    </button>
                  );
                })}
                {dPost.length > 3 && (
                  <div className="text-[10px] font-black text-slate-400 px-1">+{dPost.length - 3} more</div>
                )}
              </div>

              {/* add hover button */}
              {!past && (
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-md">+</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TodayView ───────────────────────────────────────────────────────────────

function TodayView({ posts, clients, onPostClick, onCreateClick }) {
  const clientColorMap = useMemo(() => {
    const map = {};
    clients.forEach((c, i) => { map[c._id] = CLIENT_PALETTE[i % CLIENT_PALETTE.length]; });
    return map;
  }, [clients]);

  const todayPosts    = posts.filter(p => { try { return isToday(parseISO(p.scheduledDate)); } catch { return false; } });
  const tomorrowPosts = posts.filter(p => { try { return isTomorrow(parseISO(p.scheduledDate)); } catch { return false; } });
  const overduePosts  = posts.filter(p => {
    try {
      const d = parseISO(p.scheduledDate);
      return isBefore(d, startOfDay(new Date())) && p.status !== 'Posted';
    } catch { return false; }
  });

  const postedToday = todayPosts.filter(p => p.status === 'Posted').length;
  const reelsToday  = todayPosts.filter(p => p.category === 'Reel').length;
  const pendingApproval = posts.filter(p => p.approvalStatus === 'Pending').length;

  return (
    <div className="space-y-5">
      {/* stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Posts",   val: todayPosts.length,    color: 'bg-blue-600',    icon: '📅' },
          { label: 'Posted Today',     val: postedToday,          color: 'bg-emerald-600', icon: '✅' },
          { label: 'Needs Approval',   val: pendingApproval,      color: 'bg-amber-500',   icon: '⏳' },
          { label: 'Overdue',          val: overduePosts.length,  color: 'bg-red-500',     icon: '🚨' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center text-white text-lg mb-2`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-slate-800">{s.val}</p>
            <p className="text-xs text-slate-400 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* overdue alert */}
      {overduePosts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚨</span>
            <p className="font-black text-red-700">
              {overduePosts.length} overdue post{overduePosts.length !== 1 ? 's' : ''} — mark as posted or reschedule
            </p>
          </div>
          <div className="space-y-2">
            {overduePosts.slice(0, 4).map(p => {
              const pal = clientColorMap[p.clientId?._id || p.clientId] || CLIENT_PALETTE[0];
              const cat = getCat(p.category);
              const client = clients.find(c => c._id === (p.clientId?._id || p.clientId));
              return (
                <button key={p._id} onClick={() => onPostClick(p)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl bg-white border ${pal.border} hover:shadow-sm transition-shadow`}>
                  <span className="text-lg">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black ${pal.text}`}>{client?.businessName}</p>
                    <p className="text-xs text-slate-600 line-clamp-1">{p.caption?.slice(0, 60)}</p>
                    <p className="text-[10px] text-red-500 font-bold">{fdt(p.scheduledDate)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* today's content */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <span>📅</span> Today's Content
            {todayPosts.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{todayPosts.length}</span>
            )}
          </h3>
          <button onClick={onCreateClick}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-blue-700 transition-colors">
            ➕ Add Post
          </button>
        </div>

        {todayPosts.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-black text-slate-500">No posts scheduled for today.</p>
            <button onClick={onCreateClick}
              className="mt-3 bg-blue-600 text-white text-sm font-black px-4 py-2 rounded-xl hover:bg-blue-700">
              ➕ Create a Post
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {todayPosts.map(p => {
              const pal    = clientColorMap[p.clientId?._id || p.clientId] || CLIENT_PALETTE[0];
              const cat    = getCat(p.category);
              const client = clients.find(c => c._id === (p.clientId?._id || p.clientId));
              return (
                <button key={p._id} onClick={() => onPostClick(p)}
                  className={`text-left bg-white rounded-2xl border-2 ${pal.border} shadow-sm hover:shadow-md transition-shadow p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${pal.bg}`} />
                      <span className={`text-xs font-black ${pal.text}`}>{client?.businessName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${cat.text} ${cat.bg} px-1.5 py-0.5 rounded-md`}>{cat.icon} {p.category}</span>
                      {p.status === 'Posted'
                        ? <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">✅ Posted</span>
                        : p.approvalStatus === 'Pending'
                        ? <span className="text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">⏳ Review</span>
                        : <span className="text-xs font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">📅 Ready</span>
                      }
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{p.caption}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {p.platforms?.slice(0, 3).map(pl => (
                      <span key={pl} className="text-xs text-slate-400">{PLATFORM_ICONS[pl]}</span>
                    ))}
                    <span className="ml-auto text-xs text-slate-400">{format(parseISO(p.scheduledDate), 'hh:mm a')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* tomorrow preview */}
      {tomorrowPosts.length > 0 && (
        <div>
          <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2 text-sm">
            <span>🌅</span> Tomorrow ({tomorrowPosts.length} posts)
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tomorrowPosts.map(p => {
              const pal    = clientColorMap[p.clientId?._id || p.clientId] || CLIENT_PALETTE[0];
              const cat    = getCat(p.category);
              const client = clients.find(c => c._id === (p.clientId?._id || p.clientId));
              return (
                <button key={p._id} onClick={() => onPostClick(p)}
                  className={`text-left flex items-start gap-2.5 p-3 ${pal.light} border ${pal.border} rounded-xl hover:shadow-sm transition-shadow`}>
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-black ${pal.text}`}>{client?.businessName}</p>
                    <p className="text-xs text-slate-600 line-clamp-1">{p.caption?.slice(0, 45)}…</p>
                    <p className="text-[10px] text-slate-400">{format(parseISO(p.scheduledDate), 'hh:mm a')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AllPostsList ─────────────────────────────────────────────────────────────

function AllPostsList({ posts, clients, onPostClick }) {
  const [search, setSearch]   = useState('');
  const [catF,   setCatF]     = useState('');
  const [statusF,setStatusF]  = useState('');
  const [clientF,setClientF]  = useState('');

  const clientColorMap = useMemo(() => {
    const map = {};
    clients.forEach((c, i) => { map[c._id] = CLIENT_PALETTE[i % CLIENT_PALETTE.length]; });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    return posts
      .filter(p => {
        const cid = p.clientId?._id || p.clientId;
        if (clientF && cid !== clientF) return false;
        if (catF    && p.category !== catF) return false;
        if (statusF && p.status   !== statusF) return false;
        if (search) {
          const s = search.toLowerCase();
          const client = clients.find(c => c._id === cid);
          if (!p.caption?.toLowerCase().includes(s) && !client?.businessName?.toLowerCase().includes(s)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
  }, [posts, clients, search, catF, statusF, clientF]);

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-2.5">
        <input type="text" placeholder="Search caption or client…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400" />
        <select value={clientF} onChange={e => setClientF(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
        </select>
        <select value={catF} onChange={e => setCatF(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Types</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Status</option>
          {['Draft','Scheduled','Posted'].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="flex items-center text-xs text-slate-400 font-bold ml-auto">
          {filtered.length} posts
        </div>
      </div>

      {/* list */}
      <div className="space-y-2">
        {filtered.slice(0, 100).map(p => {
          const cid    = p.clientId?._id || p.clientId;
          const client = clients.find(c => c._id === cid);
          const pal    = clientColorMap[cid] || CLIENT_PALETTE[0];
          const cat    = getCat(p.category);

          return (
            <button key={p._id} onClick={() => onPostClick(p)}
              className="w-full text-left bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all p-3.5 flex items-start gap-3">
              <span className="text-xl shrink-0">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-black ${pal.text} ${pal.light} px-2 py-0.5 rounded-full border ${pal.border}`}>
                    {client?.businessName || 'Unknown Client'}
                  </span>
                  <span className={`text-xs font-bold ${cat.bg} ${cat.text} px-1.5 py-0.5 rounded-md`}>{p.category}</span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-1">{p.caption}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-600">{fd(p.scheduledDate)}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                  p.status === 'Posted'    ? 'bg-emerald-100 text-emerald-700' :
                  p.status === 'Scheduled' ? 'bg-blue-100 text-blue-700'       :
                                             'bg-slate-100 text-slate-600'
                }`}>
                  {p.status === 'Posted' ? '✅' : p.status === 'Scheduled' ? '📅' : '📝'} {p.status}
                </span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-black text-slate-400">No posts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ClientOverview ───────────────────────────────────────────────────────────

function ClientOverview({ clients, posts, onClientClick }) {
  const clientColorMap = useMemo(() => {
    const map = {};
    clients.forEach((c, i) => { map[c._id] = CLIENT_PALETTE[i % CLIENT_PALETTE.length]; });
    return map;
  }, [clients]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {clients.map((client, i) => {
          const pal     = CLIENT_PALETTE[i % CLIENT_PALETTE.length];
          const cPosts  = posts.filter(p => (p.clientId?._id || p.clientId) === client._id);
          const posted  = cPosts.filter(p => p.status === 'Posted').length;
          const total   = cPosts.length;
          const pending = cPosts.filter(p => p.approvalStatus === 'Pending').length;
          const pct     = total ? Math.round((posted / total) * 100) : 0;

          return (
            <button key={client._id} onClick={() => onClientClick(client._id)}
              className={`text-left bg-white rounded-2xl border-2 ${pal.border} shadow-sm hover:shadow-md transition-all p-4 hover:scale-[1.02]`}>
              <div className={`w-10 h-10 ${pal.bg} rounded-xl flex items-center justify-center text-white font-black text-lg mb-3`}>
                {client.businessName[0]}
              </div>
              <p className={`font-black text-sm ${pal.text} leading-tight mb-0.5`}>{client.businessName}</p>
              <p className="text-[10px] text-slate-400 font-bold line-clamp-1 mb-2">{client.industry}</p>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-bold">{posted}/{total} posts</span>
                {pending > 0 && (
                  <span className="bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded-full">⏳ {pending}</span>
                )}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${pal.bg} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SocialMediaManager() {
  const [tab,        setTab]        = useState('today');
  const [clients,    setClients]    = useState([]);
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [month,      setMonth]      = useState(new Date());
  const [filterClient, setFilterClient] = useState('');

  const [createModal, setCreateModal]   = useState(false);
  const [editPost,    setEditPost]       = useState(null);
  const [detailPost,  setDetailPost]     = useState(null);
  const [preDate,     setPreDate]        = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/clients'),
        api.get('/posts?limit=800'),
      ]);
      setClients(cRes.data.clients || cRes.data || []);
      setPosts(pRes.data.posts || pRes.data || []);
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDayClick = (day) => {
    setPreDate(day);
    setCreateModal(true);
  };

  const handlePostClick = (post) => {
    setDetailPost(post);
  };

  const handleCreateClick = () => {
    setPreDate(new Date());
    setCreateModal(true);
  };

  const closeAll = () => {
    setCreateModal(false);
    setEditPost(null);
    setDetailPost(null);
    setPreDate(null);
  };

  // stats
  const monthPosts   = useMemo(() => posts.filter(p => { try { return isThisMonth(parseISO(p.scheduledDate)); } catch { return false; } }), [posts]);
  const totalPosted  = posts.filter(p => p.status === 'Posted').length;
  const totalPending = posts.filter(p => p.approvalStatus === 'Pending').length;
  const todayCount   = posts.filter(p => { try { return isToday(parseISO(p.scheduledDate)); } catch { return false; } }).length;

  const TABS = [
    { id: 'today',    label: 'Today',     icon: '⚡', badge: todayCount  },
    { id: 'calendar', label: 'Calendar',  icon: '📅', badge: null        },
    { id: 'clients',  label: 'Clients',   icon: '👥', badge: null        },
    { id: 'all',      label: 'All Posts', icon: '📋', badge: null        },
  ];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 font-bold">Loading social calendar…</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">

      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-black text-slate-900 text-xl flex items-center gap-2">
              <span className="text-2xl">📱</span> Social Media Master Calendar
            </h1>
            <p className="text-sm text-slate-400 font-bold">
              {clients.length} clients · {posts.length} posts · {monthPosts.length} this month
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* stats pills */}
            <div className="flex items-center gap-2">
              {[
                { label: 'Today',    val: todayCount,    bg: 'bg-blue-100',    text: 'text-blue-700'    },
                { label: 'Posted',   val: totalPosted,   bg: 'bg-emerald-100', text: 'text-emerald-700' },
                { label: 'Pending',  val: totalPending,  bg: 'bg-amber-100',   text: 'text-amber-700'   },
              ].map(s => (
                <div key={s.label} className={`${s.bg} ${s.text} text-xs font-black px-2.5 py-1 rounded-lg`}>
                  {s.val} {s.label}
                </div>
              ))}
            </div>

            <button onClick={handleCreateClick}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-4 py-2 rounded-xl transition-colors shadow-sm">
              ➕ New Post
            </button>
          </div>
        </div>

        {/* tab bar */}
        <div className="flex border-t border-slate-100 px-4 lg:px-6 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-black whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}>
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">

        {/* ── TODAY ── */}
        {tab === 'today' && (
          <TodayView
            posts={posts}
            clients={clients}
            onPostClick={handlePostClick}
            onCreateClick={handleCreateClick}
          />
        )}

        {/* ── CALENDAR ── */}
        {tab === 'calendar' && (
          <div className="space-y-4">
            {/* calendar controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
              {/* month nav */}
              <div className="flex items-center gap-2">
                <button onClick={() => setMonth(m => subMonths(m, 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 transition-colors">‹</button>
                <h2 className="font-black text-slate-800 text-lg min-w-[160px] text-center">
                  {format(month, 'MMMM yyyy')}
                </h2>
                <button onClick={() => setMonth(m => addMonths(m, 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 transition-colors">›</button>
                <button onClick={() => setMonth(new Date())}
                  className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
                  Today
                </button>
              </div>

              {/* client filter */}
              <div className="flex-1 min-w-[180px]">
                <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">👥 All Clients</option>
                  {clients.map((c, i) => (
                    <option key={c._id} value={c._id}>{c.businessName}</option>
                  ))}
                </select>
              </div>

              {/* client color legend (visible only when no filter) */}
              {!filterClient && clients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-xs">
                  {clients.slice(0, 8).map((c, i) => {
                    const pal = CLIENT_PALETTE[i % CLIENT_PALETTE.length];
                    return (
                      <button key={c._id} onClick={() => setFilterClient(c._id)}
                        className={`flex items-center gap-1 text-[10px] font-black ${pal.light} ${pal.text} border ${pal.border} px-1.5 py-0.5 rounded-full hover:opacity-80`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pal.bg}`} />
                        {c.businessName.split(' ')[0]}
                      </button>
                    );
                  })}
                  {clients.length > 8 && (
                    <span className="text-[10px] text-slate-400 font-bold self-center">+{clients.length - 8} more</span>
                  )}
                </div>
              )}

              {filterClient && (
                <button onClick={() => setFilterClient('')}
                  className="text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
                  ✕ Clear Filter
                </button>
              )}
            </div>

            {/* calendar stats */}
            {!filterClient && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORIES.map(cat => {
                  const cfg = getCat(cat);
                  const cnt = posts.filter(p => {
                    try { return p.category === cat && isThisMonth(parseISO(p.scheduledDate)); }
                    catch { return false; }
                  }).length;
                  return (
                    <div key={cat} className={`${cfg.bg} border ${cfg.border} rounded-xl p-3 text-center`}>
                      <span className="text-xl">{cfg.icon}</span>
                      <p className={`font-black text-xl ${cfg.text}`}>{cnt}</p>
                      <p className={`text-[10px] ${cfg.text} opacity-70 font-bold`}>{cat}s</p>
                    </div>
                  );
                })}
              </div>
            )}

            <MasterCalendar
              posts={posts}
              clients={clients}
              month={month}
              onDayClick={handleDayClick}
              onPostClick={handlePostClick}
              filterClient={filterClient}
            />
          </div>
        )}

        {/* ── CLIENTS ── */}
        {tab === 'clients' && (
          <ClientOverview
            clients={clients}
            posts={posts}
            onClientClick={(id) => { setFilterClient(id); setTab('calendar'); }}
          />
        )}

        {/* ── ALL POSTS ── */}
        {tab === 'all' && (
          <AllPostsList
            posts={posts}
            clients={clients}
            onPostClick={handlePostClick}
          />
        )}
      </div>

      {/* ── MODALS ── */}
      {(createModal || editPost) && (
        <PostModal
          post={editPost || null}
          clients={clients}
          preDate={preDate}
          onClose={closeAll}
          onSave={fetchAll}
        />
      )}

      {detailPost && (
        <PostDetailModal
          post={detailPost}
          clients={clients}
          onClose={() => setDetailPost(null)}
          onEdit={(p) => { setDetailPost(null); setEditPost(p); }}
          onMarkPosted={fetchAll}
        />
      )}
    </div>
  );
}
