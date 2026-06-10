import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, parseISO, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Draft:     { bg: 'bg-slate-100',    text: 'text-slate-600',   dot: 'bg-slate-400',    label: 'Draft',     icon: '📝' },
  Scheduled: { bg: 'bg-blue-100',     text: 'text-blue-700',    dot: 'bg-blue-500',     label: 'Scheduled', icon: '⏰' },
  Sent:      { bg: 'bg-emerald-100',  text: 'text-emerald-700', dot: 'bg-emerald-500',  label: 'Sent',      icon: '✅' },
  Failed:    { bg: 'bg-red-100',      text: 'text-red-700',     dot: 'bg-red-500',      label: 'Failed',    icon: '❌' },
};

const TYPE_CONFIG = {
  text:     { icon: '💬', label: 'Text' },
  image:    { icon: '🖼️', label: 'Image' },
  document: { icon: '📄', label: 'Document' },
};

const WA_GREEN   = '#25D366';
const WA_DARK    = '#128C7E';
const WA_LIGHT   = '#DCF8C6';
const WA_BG      = '#ECE5DD';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  try { return format(parseISO(iso), 'h:mm a'); } catch { return ''; }
}
function fmtDate(iso) {
  try { return format(parseISO(iso), 'dd MMM yyyy, h:mm a'); } catch { return '—'; }
}
function fmtDateShort(iso) {
  try { return format(parseISO(iso), 'dd MMM'); } catch { return '—'; }
}

// ─── ComposePanel ─────────────────────────────────────────────────────────────

function ComposePanel({ clients, selectedClientId, onSent, editMsg, onClearEdit }) {
  const blank = {
    clientId:     selectedClientId || '',
    phoneNumber:  '',
    message:      '',
    mediaUrl:     '',
    messageType:  'text',
    scheduledAt:  '',
    campaignName: '',
    status:       'Draft',
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editMsg) {
      setForm({
        clientId:     editMsg.clientId?._id || editMsg.clientId || '',
        phoneNumber:  editMsg.phoneNumber  || '',
        message:      editMsg.message      || '',
        mediaUrl:     editMsg.mediaUrl     || '',
        messageType:  editMsg.messageType  || 'text',
        scheduledAt:  editMsg.scheduledAt  ? format(parseISO(editMsg.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
        campaignName: editMsg.campaignName || '',
        status:       editMsg.status       || 'Draft',
      });
    } else {
      setForm(f => ({ ...blank, clientId: selectedClientId || f.clientId }));
    }
  }, [editMsg, selectedClientId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async (sendNow = false) => {
    if (!form.clientId)        { toast.error('Select a client.'); return; }
    if (!form.phoneNumber.trim()) { toast.error('Enter phone number.'); return; }
    if (!form.message.trim())  { toast.error('Enter message text.'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        status:      sendNow ? 'Sent' : form.scheduledAt ? 'Scheduled' : 'Draft',
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      };

      let resp;
      if (editMsg?._id) {
        resp = await api.put(`/whatsapp/${editMsg._id}`, payload);
        toast.success('Message updated!');
      } else {
        resp = await api.post('/whatsapp', payload);
        toast.success(sendNow ? 'Message sent!' : form.scheduledAt ? 'Scheduled!' : 'Saved as draft!');
      }

      // If sendNow and not already sent, call the send endpoint
      if (sendNow && !editMsg?._id) {
        try { await api.patch(`/whatsapp/${resp.data.message._id}/send`); } catch {}
      }

      onSent();
      if (editMsg) onClearEdit();
      setForm({ ...blank, clientId: selectedClientId || '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border-t border-slate-100 p-4 space-y-3">
      {editMsg && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <span className="text-blue-600 text-xs font-bold">Editing message</span>
          <button onClick={onClearEdit} className="ml-auto text-xs text-slate-500 hover:text-red-500">✕ Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Client</label>
          <select
            value={form.clientId}
            onChange={e => set('clientId', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            <option value="">Select client…</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.businessName || c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Phone Number</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phoneNumber}
            onChange={e => set('phoneNumber', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Type</label>
          <select
            value={form.messageType}
            onChange={e => set('messageType', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Campaign</label>
          <input
            type="text"
            placeholder="Campaign name…"
            value={form.campaignName}
            onChange={e => set('campaignName', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Schedule</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={e => set('scheduledAt', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {form.messageType !== 'text' && (
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Media URL</label>
          <input
            type="url"
            placeholder="https://…"
            value={form.mediaUrl}
            onChange={e => set('mediaUrl', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-slate-500 mb-1 block">Message</label>
        <textarea
          rows={3}
          placeholder="Type your WhatsApp message here…"
          value={form.message}
          onChange={e => set('message', e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleSend(false)}
          disabled={saving}
          className="flex-1 py-2 rounded-xl border-2 border-green-500 text-green-700 font-bold text-sm hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          {form.scheduledAt ? '⏰ Schedule' : '💾 Save Draft'}
        </button>
        <button
          onClick={() => handleSend(true)}
          disabled={saving}
          className="flex-1 py-2 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 active:scale-95 shadow-md"
          style={{ background: `linear-gradient(135deg, ${WA_GREEN}, ${WA_DARK})` }}
        >
          {saving ? '…' : '▶ Send Now'}
        </button>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, onEdit, onDelete, onSend }) {
  const st  = STATUS_CONFIG[msg.status] || STATUS_CONFIG.Draft;
  const typ = TYPE_CONFIG[msg.messageType] || TYPE_CONFIG.text;
  const isRight = msg.status === 'Sent';

  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-3 shadow-sm relative group ${
          isRight ? 'rounded-br-none' : 'bg-white rounded-bl-none'
        }`}
        style={isRight ? { backgroundColor: WA_LIGHT } : {}}
      >
        {/* Campaign tag */}
        {msg.campaignName && (
          <div className="text-[10px] font-black text-green-700 uppercase tracking-wider mb-1">
            {msg.campaignName}
          </div>
        )}

        {/* Media preview */}
        {msg.messageType !== 'text' && msg.mediaUrl && (
          <div className="mb-2">
            {msg.messageType === 'image' ? (
              <img src={msg.mediaUrl} alt="media" className="rounded-lg max-h-32 object-cover w-full" />
            ) : (
              <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1.5 text-xs text-blue-600 hover:underline">
                📄 View Document
              </a>
            )}
          </div>
        )}

        {/* Message text */}
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.message}</p>

        {/* Phone + time */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400">{msg.phoneNumber}</span>
          {msg.scheduledAt && msg.status === 'Scheduled' && (
            <span className="text-[10px] text-blue-500">⏰ {fmtDate(msg.scheduledAt)}</span>
          )}
          {msg.sentAt && (
            <span className="text-[10px] text-slate-400">{fmtTime(msg.sentAt)}</span>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
            {st.icon} {st.label}
          </span>
          <span className="text-[10px] text-slate-400">{typ.icon}</span>
        </div>

        {/* Action buttons */}
        {msg.status !== 'Sent' && (
          <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-md z-10">
            {msg.status !== 'Sent' && (
              <button onClick={() => onSend(msg._id)}
                className="text-[11px] font-bold text-green-600 hover:text-green-800 px-1" title="Send now">
                ▶
              </button>
            )}
            <button onClick={() => onEdit(msg)}
              className="text-[11px] text-blue-500 hover:text-blue-700 px-1" title="Edit">
              ✏
            </button>
            <button onClick={() => onDelete(msg._id)}
              className="text-[11px] text-red-500 hover:text-red-700 px-1" title="Delete">
              🗑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WhatsAppHub (main) ───────────────────────────────────────────────────────

export default function WhatsAppHub() {
  const [clients,    setClients]    = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [selClient,  setSelClient]  = useState(null);
  const [filterStat, setFilterStat] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [editMsg,    setEditMsg]    = useState(null);
  const feedRef = useRef(null);

  // ── load ────────────────────────────────────────────────────────────────────

  const loadClients = useCallback(async () => {
    try {
      const r = await api.get('/clients');
      const list = r.data.clients || [];
      setClients(list);
      if (!selClient && list.length > 0) setSelClient(list[0]);
    } catch { toast.error('Failed to load clients'); }
  }, [selClient]);

  const loadMessages = useCallback(async () => {
    try {
      const params = {};
      if (selClient?._id) params.clientId = selClient._id;
      if (filterStat)     params.status   = filterStat;
      const r = await api.get('/whatsapp', { params });
      setMessages(r.data.messages || []);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }, [selClient, filterStat]);

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (clients.length) loadMessages(); }, [selClient, filterStat, clients.length]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/whatsapp/${id}`);
      toast.success('Deleted');
      setMessages(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  }, []);

  const handleSendNow = useCallback(async (id) => {
    const tid = toast.loading('Sending…');
    try {
      const r = await api.patch(`/whatsapp/${id}/send`);
      toast.success('Sent!', { id: tid });
      setMessages(prev => prev.map(m => m._id === id ? r.data.message : m));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed', { id: tid });
    }
  }, []);

  // ── stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const sentThisMonth = messages.filter(m =>
      m.status === 'Sent' && m.sentAt && isThisMonth(parseISO(m.sentAt))
    ).length;
    const pending   = messages.filter(m => ['Draft', 'Scheduled'].includes(m.status)).length;
    const failed    = messages.filter(m => m.status === 'Failed').length;
    const total     = messages.length;
    const sent      = messages.filter(m => m.status === 'Sent').length;
    const rate      = total > 0 ? Math.round((sent / total) * 100) : 0;
    return { sentThisMonth, pending, failed, rate };
  }, [messages]);

  // ── client msg counts ────────────────────────────────────────────────────────

  const clientMsgCounts = useMemo(() => {
    const map = {};
    messages.forEach(m => {
      const cid = m.clientId?._id || m.clientId;
      if (cid) map[cid] = (map[cid] || 0) + 1;
    });
    return map;
  }, [messages]);

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-white" style={{ minHeight: '600px' }}>

      {/* ── LEFT: client list ─────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-slate-100 bg-slate-50 hidden sm:flex">

        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100" style={{ backgroundColor: WA_DARK }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-white font-black text-sm">WhatsApp Hub</p>
              <p className="text-white/60 text-xs">Campaign Manager</p>
            </div>
          </div>
        </div>

        {/* Status filter */}
        <div className="px-3 py-2 border-b border-slate-100">
          <select
            value={filterStat}
            onChange={e => setFilterStat(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto">
          {clients.map(client => {
            const active  = selClient?._id === client._id;
            const count   = clientMsgCounts[client._id] || 0;
            const initial = (client.businessName || client.name || '?')[0].toUpperCase();
            return (
              <button
                key={client._id}
                onClick={() => setSelClient(client)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left transition-all hover:bg-white ${
                  active ? 'bg-white border-l-4 border-l-green-500' : ''
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${WA_GREEN}, ${WA_DARK})` }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${active ? 'text-green-800' : 'text-slate-800'}`}>
                    {client.businessName || client.name}
                  </p>
                  {count > 0 && (
                    <p className="text-xs text-slate-400">{count} message{count > 1 ? 's' : ''}</p>
                  )}
                </div>
                {count > 0 && (
                  <span
                    className="text-[10px] font-black text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: WA_GREEN }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: chat area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0"
          style={{ backgroundColor: WA_DARK }}>
          {selClient ? (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{ background: WA_GREEN }}
              >
                {(selClient.businessName || selClient.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{selClient.businessName || selClient.name}</p>
                <p className="text-white/60 text-xs">WhatsApp Campaign</p>
              </div>
            </>
          ) : (
            <p className="text-white/70 text-sm">Select a client →</p>
          )}

          {/* Stats pills */}
          <div className="flex gap-2 ml-auto">
            <div className="bg-white/10 rounded-full px-2 py-1 text-center">
              <p className="text-white text-xs font-black">{stats.sentThisMonth}</p>
              <p className="text-white/60 text-[9px]">sent</p>
            </div>
            <div className="bg-white/10 rounded-full px-2 py-1 text-center">
              <p className="text-white text-xs font-black">{stats.rate}%</p>
              <p className="text-white/60 text-[9px]">rate</p>
            </div>
            <div className="bg-white/10 rounded-full px-2 py-1 text-center">
              <p className="text-white text-xs font-black">{stats.pending}</p>
              <p className="text-white/60 text-[9px]">pending</p>
            </div>
          </div>
        </div>

        {/* Mobile client selector */}
        <div className="sm:hidden px-3 py-2 border-b border-slate-100 bg-white">
          <select
            value={selClient?._id || ''}
            onChange={e => {
              const c = clients.find(x => x._id === e.target.value);
              setSelClient(c || null);
            }}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400"
          >
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.businessName || c.name}</option>
            ))}
          </select>
        </div>

        {/* Message feed */}
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325d366' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), ${WA_BG}` }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Loading messages…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-slate-600 font-bold">No messages yet</p>
              <p className="text-slate-400 text-sm mt-1">
                {selClient ? `Compose your first message to ${selClient.businessName || selClient.name}` : 'Select a client to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Group by date */}
              {(() => {
                const grouped = {};
                messages.forEach(m => {
                  const d = m.scheduledAt || m.createdAt;
                  const key = d ? format(parseISO(d), 'dd MMM yyyy') : 'Undated';
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(m);
                });
                return Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-slate-300/50" />
                      <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-3 py-0.5 rounded-full shadow-sm">
                        {date}
                      </span>
                      <div className="flex-1 h-px bg-slate-300/50" />
                    </div>
                    {msgs.map(m => (
                      <MessageBubble
                        key={m._id}
                        msg={m}
                        onEdit={setEditMsg}
                        onDelete={handleDelete}
                        onSend={handleSendNow}
                      />
                    ))}
                  </div>
                ));
              })()}
            </>
          )}
        </div>

        {/* Compose panel */}
        <ComposePanel
          clients={clients}
          selectedClientId={selClient?._id || ''}
          onSent={loadMessages}
          editMsg={editMsg}
          onClearEdit={() => setEditMsg(null)}
        />
      </div>
    </div>
  );
}
