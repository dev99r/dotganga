import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_CFG = {
  Pending:  { bg:'bg-amber-100',   text:'text-amber-700',   border:'border-amber-200',   icon:'⏳' },
  Approved: { bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-200', icon:'✅' },
  Rejected: { bg:'bg-red-100',     text:'text-red-700',     border:'border-red-200',     icon:'❌' },
  Revision: { bg:'bg-violet-100',  text:'text-violet-700',  border:'border-violet-200',  icon:'✏️' },
};

const PLATFORM_ICONS = { Instagram:'📸',Facebook:'📘',LinkedIn:'💼',Twitter:'🐦',YouTube:'▶️',WhatsApp:'💬' };

function ApprovalCard({ approval, onAction, isExpanded, onToggle }) {
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const s   = STATUS_CFG[approval.status] || {};
  const post = approval.postId || {};

  const act = async (status) => {
    setLoading(true);
    try {
      await onAction(approval._id, status, note);
      setNote('');
    } finally { setLoading(false); }
  };

  return (
    <div className={`bg-white rounded-3xl ring-1 overflow-hidden ${s.border||'ring-slate-100'} shadow-sm`}>
      {/* Status bar */}
      <div className={`h-1 w-full ${approval.status==='Pending'?'bg-amber-400':approval.status==='Approved'?'bg-emerald-500':approval.status==='Rejected'?'bg-red-500':'bg-violet-500'}`}/>

      <div className="p-4">
        {/* Top */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {approval.clientId?.businessName?.charAt(0)||'?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-slate-800 truncate">{approval.clientId?.businessName}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                {s.icon} {approval.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {post.platforms?.map(p=><span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}
              {post.category && <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">{post.category}</span>}
              {post.aiGenerated && <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(approval.createdAt), {addSuffix:true})}</p>
            {approval.dueDate && <p className="text-[10px] text-red-400 font-bold mt-0.5">Due {format(new Date(approval.dueDate),'dd MMM')}</p>}
          </div>
        </div>

        {/* Caption preview */}
        {post.caption && (
          <div className="mt-3 bg-slate-50 rounded-2xl p-3">
            <p className={`text-xs text-slate-600 leading-relaxed ${isExpanded?'':'line-clamp-3'}`}>{post.caption}</p>
            {post.hashtags && <p className="text-[10px] text-blue-500 mt-1">{post.hashtags}</p>}
            {post.caption?.length > 150 && (
              <button onClick={onToggle} className="text-[10px] font-bold text-blue-500 mt-1">
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Media */}
        {post.mediaUrls?.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {post.mediaUrls.slice(0,4).map((url,i)=>(
              <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0 bg-slate-100"/>
            ))}
          </div>
        )}

        {/* Scheduled date */}
        {post.scheduledDate && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>Scheduled: {format(new Date(post.scheduledDate),'EEE dd MMM, HH:mm')}</span>
          </div>
        )}

        {/* Note (if rejected/revision) */}
        {approval.clientNote && (
          <div className="mt-2 bg-amber-50 rounded-xl p-2.5 border border-amber-100">
            <p className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">Client Note</p>
            <p className="text-xs text-amber-800 italic">"{approval.clientNote}"</p>
          </div>
        )}

        {/* Action buttons for pending */}
        {approval.status === 'Pending' && (
          <div className="mt-3 space-y-2">
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add note (optional)…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"/>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={()=>act('Approved')} disabled={loading}
                className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-colors disabled:opacity-50">
                ✓ Approve
              </button>
              <button onClick={()=>act('Revision')} disabled={loading}
                className="py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-black transition-colors disabled:opacity-50">
                ✏️ Revision
              </button>
              <button onClick={()=>act('Rejected')} disabled={loading}
                className="py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black transition-colors disabled:opacity-50">
                ✕ Reject
              </button>
            </div>
          </div>
        )}

        {/* Reviewed info */}
        {approval.reviewedBy && (
          <p className="text-[10px] text-slate-400 mt-2">
            Reviewed by {approval.reviewedBy?.name||'—'} {approval.reviewedAt && `· ${formatDistanceToNow(new Date(approval.reviewedAt),{addSuffix:true})}`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsView() {
  const [approvals,   setApprovals]   = useState([]);
  const [stats,       setStats]       = useState({});
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('Pending');
  const [clientFilter,setClientFilter]= useState('');
  const [clients,     setClients]     = useState([]);
  const [expanded,    setExpanded]    = useState({});

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.append('status', filter);
      if (clientFilter)    params.append('clientId', clientFilter);
      const [aRes, cRes] = await Promise.all([
        api.get(`/approvals?${params}`),
        api.get('/clients'),
      ]);
      setApprovals(aRes.data.approvals || []);
      setStats(aRes.data.stats || {});
      setClients(cRes.data.clients || []);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  }, [filter, clientFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, status, note) => {
    try {
      await api.patch(`/approvals/${id}`, { status, clientNote: note });
      toast.success(`Content ${status.toLowerCase()}.`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const TABS = ['All','Pending','Approved','Rejected','Revision'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900">Approvals</h2>
        <p className="text-xs text-slate-400 mt-0.5">Review and manage content approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          {label:'Total',    value:stats.total   ||0, color:'text-slate-800'},
          {label:'Pending',  value:stats.pending ||0, color:'text-amber-600'},
          {label:'Approved', value:stats.approved||0, color:'text-emerald-600'},
          {label:'Rejected', value:stats.rejected||0, color:'text-red-600'},
          {label:'Revision', value:stats.revision||0, color:'text-violet-600'},
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5 text-center shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setFilter(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter===t
                  ? t==='Pending'?'bg-amber-500 text-white'
                    :t==='Approved'?'bg-emerald-500 text-white'
                    :t==='Rejected'?'bg-red-500 text-white'
                    :t==='Revision'?'bg-violet-500 text-white'
                    :'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>{t}</button>
          ))}
        </div>
        <select value={clientFilter} onChange={e=>setClientFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm">
          <option value="">All Clients</option>
          {clients.map(c=><option key={c._id} value={c._id}>{c.businessName}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"/>)}
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-3">✅</p>
          <p className="font-bold text-slate-500">No {filter !== 'All' ? filter.toLowerCase() : ''} approvals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals.map(a => (
            <ApprovalCard
              key={a._id}
              approval={a}
              onAction={handleAction}
              isExpanded={!!expanded[a._id]}
              onToggle={()=>setExpanded(e=>({...e,[a._id]:!e[a._id]}))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
