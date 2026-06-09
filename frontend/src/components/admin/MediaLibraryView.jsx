import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_ICONS = { image:'🖼️', video:'🎬', document:'📄', other:'📎' };
const TYPE_COLOR = { image:'bg-violet-50 text-violet-700', video:'bg-pink-50 text-pink-700', document:'bg-blue-50 text-blue-700', other:'bg-slate-100 text-slate-600' };

function formatBytes(bytes) {
  if (!bytes) return '—';
  const k = 1024;
  if (bytes < k)       return `${bytes} B`;
  if (bytes < k * k)   return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / k / k).toFixed(1)} MB`;
}

function AddMediaModal({ clients, folders, onClose, onSaved }) {
  const [form,       setForm]       = useState({ clientId:'', fileName:'', fileUrl:'', thumbnailUrl:'', fileType:'image', folder:'General', tags:'' });
  const [submitting, setSubmitting] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.fileName || !form.fileUrl) {
      toast.error('Client, file name, and URL are required.'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/media', {
        ...form,
        tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        thumbnailUrl: form.thumbnailUrl || form.fileUrl,
      });
      toast.success('Media added!');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900">Add to Media Library</h2>
            <p className="text-xs text-slate-400">Paste a CDN or Cloudinary URL</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client *</label>
            <select value={form.clientId} onChange={e=>set('clientId',e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">— Select client —</option>
              {clients.map(c=><option key={c._id} value={c._id}>{c.businessName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Name *</label>
              <input value={form.fileName} onChange={e=>set('fileName',e.target.value)} placeholder="campaign_banner.jpg"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
              <select value={form.fileType} onChange={e=>set('fileType',e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                {['image','video','document','other'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">File URL *</label>
            <input value={form.fileUrl} onChange={e=>set('fileUrl',e.target.value)} placeholder="https://res.cloudinary.com/…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Folder</label>
              <input value={form.folder} onChange={e=>set('folder',e.target.value)} list="folders-list" placeholder="General"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
              <datalist id="folders-list">{folders.map(f=><option key={f} value={f}/>)}</datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tags</label>
              <input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="logo, banner, 2024"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
            </div>
          </div>
          {form.fileUrl && form.fileType === 'image' && (
            <div className="bg-slate-50 rounded-2xl p-3">
              <p className="text-[10px] font-bold text-slate-400 mb-2">Preview</p>
              <img src={form.fileUrl} alt="" className="w-full h-32 object-cover rounded-xl bg-slate-200" onError={e=>{e.target.style.display='none';}}/>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-blue-950 text-white text-sm font-black hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</> : 'Add Media'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MediaCard({ media, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const isImage = media.fileType === 'image';

  return (
    <div
      className="bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden hover:shadow-md transition-all group"
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      {/* Thumbnail */}
      <div className="relative bg-slate-100 aspect-square">
        {isImage ? (
          <img src={media.thumbnailUrl||media.fileUrl} alt={media.fileName} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {TYPE_ICONS[media.fileType]||'📎'}
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <a href={media.fileUrl} target="_blank" rel="noopener noreferrer"
              className="bg-white text-slate-700 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
            <button onClick={()=>onDelete(media)}
              className="bg-red-500 text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-bold text-slate-700 truncate" title={media.fileName}>{media.fileName}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_COLOR[media.fileType]||'bg-slate-100 text-slate-500'}`}>
            {media.fileType}
          </span>
          <span className="text-[10px] text-slate-400">{formatBytes(media.fileSize)}</span>
        </div>
        {media.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {media.tags.slice(0,3).map(t=>(
              <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">#{t}</span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-1.5">{format(new Date(media.createdAt),'dd MMM')}</p>
      </div>
    </div>
  );
}

export default function MediaLibraryView() {
  const [media,        setMedia]        = useState([]);
  const [folders,      setFolders]      = useState([]);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [showAdd,      setShowAdd]      = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (clientFilter) params.append('clientId', clientFilter);
      if (typeFilter)   params.append('fileType',  typeFilter);
      if (folderFilter) params.append('folder',    folderFilter);
      if (search)       params.append('search',    search);
      const [mRes, cRes] = await Promise.all([
        api.get(`/media?${params}`),
        api.get('/clients'),
      ]);
      setMedia(mRes.data.media   || []);
      setFolders(mRes.data.folders || []);
      setClients(cRes.data.clients || []);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  }, [clientFilter, typeFilter, folderFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.fileName}"?`)) return;
    try { await api.delete(`/media/${item._id}`); toast.success('Deleted.'); load(); }
    catch { toast.error('Failed.'); }
  };

  const byType = t => media.filter(m=>m.fileType===t).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Media Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">{media.length} files across all clients</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-950 hover:bg-blue-900 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-950/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Add Media
        </button>
      </div>

      {/* Type stats */}
      <div className="grid grid-cols-4 gap-2">
        {['image','video','document','other'].map(t=>(
          <button key={t} onClick={()=>setTypeFilter(typeFilter===t?'':t)}
            className={`bg-white rounded-2xl border px-3 py-2.5 text-center shadow-sm transition-all ${typeFilter===t?'border-blue-500 ring-2 ring-blue-200':'border-slate-100 hover:border-slate-200'}`}>
            <p className="text-2xl mb-1">{TYPE_ICONS[t]}</p>
            <p className="text-lg font-black text-slate-800">{byType(t)}</p>
            <p className="text-[10px] text-slate-400 capitalize font-semibold">{t}s</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files…"
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"/>
        </div>
        <select value={clientFilter} onChange={e=>setClientFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm">
          <option value="">All Clients</option>
          {clients.map(c=><option key={c._id} value={c._id}>{c.businessName}</option>)}
        </select>
        {folders.length > 0 && (
          <select value={folderFilter} onChange={e=>setFolderFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm">
            <option value="">All Folders</option>
            {folders.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_,i)=><div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <p className="text-5xl mb-3">🖼️</p>
          <p className="font-bold text-slate-500">No media files yet</p>
          <button onClick={()=>setShowAdd(true)} className="mt-4 bg-blue-950 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-900">+ Add First File</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {media.map(m=><MediaCard key={m._id} media={m} onDelete={handleDelete}/>)}
        </div>
      )}

      {showAdd && (
        <AddMediaModal clients={clients} folders={folders} onClose={()=>setShowAdd(false)} onSaved={()=>{load();setShowAdd(false);}}/>
      )}
    </div>
  );
}
