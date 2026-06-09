import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isSameMonth, addMonths, subMonths,
} from 'date-fns';

// ─── Config ───────────────────────────────────────────────────────────────────
const PLATFORMS = ['Instagram','Facebook','LinkedIn','Twitter','YouTube','WhatsApp'];
const CATEGORIES = ['Reel','Carousel','Story','Organic','Ad Creative','Other'];

const CAT = {
  Reel:         { icon:'🎬', grad:'from-pink-500 to-rose-600',   light:'bg-pink-50 text-pink-700',     dot:'bg-pink-500'   },
  Carousel:     { icon:'🎠', grad:'from-violet-500 to-purple-600',light:'bg-violet-50 text-violet-700', dot:'bg-violet-500' },
  Story:        { icon:'📱', grad:'from-blue-500 to-cyan-600',    light:'bg-blue-50 text-blue-700',     dot:'bg-blue-500'   },
  Organic:      { icon:'📸', grad:'from-emerald-500 to-teal-600', light:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
  'Ad Creative':{ icon:'🎯', grad:'from-orange-500 to-red-600',   light:'bg-orange-50 text-orange-700', dot:'bg-orange-500' },
  Other:        { icon:'📋', grad:'from-slate-500 to-slate-700',  light:'bg-slate-100 text-slate-600',  dot:'bg-slate-500'  },
};
const getCat = k => CAT[k] || CAT.Other;

const PLATFORM_ICONS = {
  Instagram:'📸', Facebook:'📘', LinkedIn:'💼', Twitter:'🐦', YouTube:'▶️', WhatsApp:'💬',
};

const APPROVAL = {
  Pending:  { bg:'bg-amber-400',    dot:'● ', label:'Pending'  },
  Approved: { bg:'bg-emerald-500',  dot:'● ', label:'Approved' },
  Rejected: { bg:'bg-red-500',      dot:'● ', label:'Rejected' },
  Revision: { bg:'bg-violet-500',   dot:'● ', label:'Revision' },
};

// Monthly content targets (fallback)
const DEFAULT_TARGETS = { Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 };

// ─── Sub-components ──────────────────────────────────────────────────────────
function CategoryChip({ category, size = 'sm' }) {
  const c = getCat(category);
  const sz = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-xs px-1.5 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full ${sz} ${c.light}`}>
      {c.icon} {category}
    </span>
  );
}

// Content Quota Bar — shows monthly targets vs actuals (uses client's custom targets if set)
function QuotaBar({ posts, client }) {
  const targets = useMemo(() => {
    if (client?.contentTargets && Object.keys(client.contentTargets).length > 0) {
      return { ...DEFAULT_TARGETS, ...client.contentTargets };
    }
    return DEFAULT_TARGETS;
  }, [client]);

  const counts = useMemo(() => {
    const m = {};
    posts.forEach(p => { m[p.category] = (m[p.category]||0) + 1; });
    return m;
  }, [posts]);

  const done  = Object.values(counts).reduce((a,b)=>a+b,0);
  const total = Object.values(targets).reduce((a,b)=>a+b,0);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-black text-slate-800">Monthly Blueprint</p>
          {client && <p className="text-xs text-slate-400 mt-0.5">{client.businessName}</p>}
        </div>
        <div className="text-right">
          <span className="text-base font-black text-slate-800">{done}</span>
          <span className="text-xs text-slate-400">/{total} posts</span>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {Object.entries(targets).map(([cat, target]) => {
          const cnt = counts[cat] || 0;
          const pct = Math.min(Math.round((cnt / target) * 100), 100);
          const c   = getCat(cat);
          const over = cnt >= target;
          return (
            <div key={cat} className="text-center">
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${c.grad} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`text-xs font-black ${over?'text-emerald-600':'text-slate-800'}`}>
                {cnt}<span className="font-normal text-slate-400">/{target}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.icon} {cat}</p>
              {over && <span className="text-[10px] text-emerald-500 font-black">✓ Done</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Post card that appears in calendar cells
function MiniPostCard({ post, onClick }) {
  const c = getCat(post.category);
  const ap = APPROVAL[post.approvalStatus];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(post); }}
      className={`w-full text-left rounded-lg overflow-hidden border border-white/20 hover:scale-[1.02] transition-transform`}
    >
      <div className={`bg-gradient-to-br ${c.grad} px-2 py-1.5`}>
        <div className="flex items-center gap-1">
          <span className="text-white text-xs">{c.icon}</span>
          <span className="text-white text-xs font-black truncate flex-1">{post.category}</span>
          <div className="flex gap-0.5">
            {post.platforms?.slice(0,2).map(p => (
              <span key={p} className="text-white text-xs">{PLATFORM_ICONS[p]}</span>
            ))}
          </div>
        </div>
        {post.caption && (
          <p className="text-white/80 text-[10px] mt-0.5 leading-tight line-clamp-1">{post.caption.slice(0,40)}</p>
        )}
      </div>
      {/* Approval indicator */}
      <div className={`h-0.5 w-full ${ap?.bg || 'bg-slate-300'}`} />
    </button>
  );
}

// Day cell in the calendar
function DayCell({ day, posts, isCurrentMonth, onAddPost, onPostClick, selectedDay, onSelect }) {
  const dayPosts = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), day));
  const isSel    = selectedDay && isSameDay(day, selectedDay);
  const todayClass = isToday(day) ? 'bg-blue-950 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300';
  const cellBg = isToday(day) ? 'bg-blue-50/40'
               : isSel        ? 'bg-indigo-50'
               : !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white';

  return (
    <div
      className={`border-r border-b border-slate-100 ${cellBg} group relative flex flex-col cursor-pointer
        min-h-[52px] sm:min-h-[110px] transition-colors duration-100`}
      onClick={() => isCurrentMonth && onSelect(day)}
    >
      {/* Day number */}
      <div className="flex items-start justify-between p-1 sm:p-1.5">
        <span className={`text-xs sm:text-sm font-black w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all ${todayClass}`}>
          {format(day,'d')}
        </span>
        {/* Add button — desktop hover only */}
        {isCurrentMonth && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddPost(day); }}
            className="hidden sm:flex opacity-0 group-hover:opacity-100 w-5 h-5 bg-blue-950 text-white rounded-full text-[10px] font-black items-center justify-center transition-all hover:scale-110"
          >
            +
          </button>
        )}
      </div>

      {/* Mobile: colored dot indicators */}
      {dayPosts.length > 0 && (
        <div className="flex flex-wrap gap-0.5 px-1 pb-1 sm:hidden">
          {dayPosts.slice(0, 5).map((post) => (
            <div key={post._id} className={`w-1.5 h-1.5 rounded-full ${getCat(post.category).dot}`} />
          ))}
          {dayPosts.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
        </div>
      )}

      {/* Desktop: full MiniPostCards */}
      <div className="hidden sm:block flex-1 px-1 pb-1 space-y-0.5 overflow-hidden">
        {dayPosts.slice(0, 3).map(post => (
          <MiniPostCard key={post._id} post={post} onClick={onPostClick} />
        ))}
        {dayPosts.length > 3 && (
          <div className="text-[10px] text-slate-400 font-bold text-center py-0.5">
            +{dayPosts.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

// Post detail drawer
function PostDrawer({ post, onClose, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);
  const c  = getCat(post.category);
  const ap = APPROVAL[post.approvalStatus];

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      await api.patch(`/posts/${post._id}/approve`, { status });
      toast.success(`Post ${status.toLowerCase()}`);
      onUpdate();
    } catch { toast.error('Failed.'); }
    finally { setLoading(false); }
  };

  const del = async () => {
    if (!confirm('Delete this post?')) return;
    try { await api.delete(`/posts/${post._id}`); toast.success('Deleted.'); onDelete(); }
    catch { toast.error('Failed.'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-br ${c.grad} px-6 py-5 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{c.icon}</span>
                <h2 className="text-lg font-black">{post.category}</h2>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                {post.platforms?.map(p=><span key={p}>{PLATFORM_ICONS[p]} {p}</span>)}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          {post.scheduledDate && (
            <p className="text-white/70 text-xs mt-3">
              📅 {format(new Date(post.scheduledDate),'EEEE, dd MMMM yyyy · HH:mm')}
            </p>
          )}
        </div>

        {/* Approval status */}
        <div className={`px-6 py-3 flex items-center justify-between ${ap?.bg||'bg-slate-400'} bg-opacity-20`}>
          <span className="text-xs font-black text-slate-700">Approval: {post.approvalStatus}</span>
          <span className="text-sm">{post.approvalStatus==='Approved'?'✅':post.approvalStatus==='Rejected'?'❌':post.approvalStatus==='Revision'?'✏️':'⏳'}</span>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
          {/* Media */}
          {post.mediaUrls?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.mediaUrls.map((url,i)=>(
                <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-2xl bg-slate-100"/>
              ))}
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Caption</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
              {post.hashtags && <p className="text-xs text-blue-500 mt-2">{post.hashtags}</p>}
            </div>
          )}

          {/* Script section */}
          {(post.script?.hook || post.script?.body || post.script?.voiceover) && (
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 space-y-3">
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider">📝 Content Script</p>
              {post.script?.hook && (
                <div>
                  <p className="text-[10px] font-black text-violet-400 uppercase mb-1">🪝 Hook</p>
                  <p className="text-sm text-violet-800 font-medium">{post.script.hook}</p>
                </div>
              )}
              {post.script?.body && (
                <div>
                  <p className="text-[10px] font-black text-violet-400 uppercase mb-1">📖 Body</p>
                  <p className="text-xs text-violet-700 whitespace-pre-wrap leading-relaxed">{post.script.body}</p>
                </div>
              )}
              {post.script?.cta && (
                <div>
                  <p className="text-[10px] font-black text-violet-400 uppercase mb-1">📣 CTA</p>
                  <p className="text-sm text-violet-800 font-medium">{post.script.cta}</p>
                </div>
              )}
              {post.script?.textOverlays?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-violet-400 uppercase mb-1.5">💬 Text Overlays</p>
                  {post.script.textOverlays.map((t,i)=>(
                    <div key={i} className="bg-violet-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-1 inline-block mr-1">{t}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video links */}
          {post.videoUrls?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎬 Video Files</p>
              {post.videoUrls.map((url,i)=>(
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5 hover:bg-pink-100 transition-colors">
                  <span className="text-base">🎬</span>
                  <p className="flex-1 text-xs text-pink-700 truncate">{url}</p>
                  <span className="text-[10px] text-pink-500 font-bold shrink-0">Open →</span>
                </a>
              ))}
            </div>
          )}

          {/* Notes */}
          {post.notes && (
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Internal Notes</p>
              <p className="text-xs text-amber-800">{post.notes}</p>
            </div>
          )}

          {/* Approval note */}
          {post.approvalNote && (
            <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
              <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Client Feedback</p>
              <p className="text-xs text-red-700 italic">"{post.approvalNote}"</p>
            </div>
          )}

          {/* Action buttons */}
          {post.approvalStatus === 'Pending' && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>changeStatus('Approved')} disabled={loading}
                className="py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-colors">
                ✓ Approve
              </button>
              <button onClick={()=>changeStatus('Revision')} disabled={loading}
                className="py-2.5 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-black transition-colors">
                ✏️ Revise
              </button>
              <button onClick={()=>changeStatus('Rejected')} disabled={loading}
                className="py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black transition-colors">
                ✕ Reject
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex gap-2">
          <button onClick={del} className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Delete
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Script Generator ─────────────────────────────────────────────────────────
const SCRIPT_TEMPLATES = {
  Reel: {
    hook: [
      '🔥 Wait — you NEED to see this before you scroll past...',
      "POV: You just found the secret everyone's talking about 👀",
      "3 seconds. That's all I need to change how you think about this.",
    ],
    body: [
      "Here's what most people don't know:\n→ Point 1\n→ Point 2\n→ Point 3\n\nAnd the best part? It works every single time.",
      'Let me show you exactly how we did it — step by step.\n\nFirst: [step 1]\nThen: [step 2]\nFinally: [step 3]',
    ],
    cta: [
      'Drop a 🔥 if this helped. Follow for more!',
      'Save this for later & share with a friend!',
      'Comment below — we read every reply!',
    ],
  },
  Carousel: {
    hook: [
      'Swipe → to see what changed everything for us 🎯',
      '5 things I wish I knew earlier (slide 3 is the game-changer)',
      "Save this post — you'll thank yourself later 📌",
    ],
    body: [
      'Slide 1: Hook / Problem\nSlide 2-4: Key Points (one per slide)\nSlide 5: Results / Proof\nSlide 6: CTA',
      'Start with a bold claim.\nBack it up with data.\nEnd with a clear takeaway.',
    ],
    cta: [
      'Which slide hit hardest? Comment below!',
      'Save & share this with your team!',
    ],
  },
  Story: {
    hook: [
      'Psst — this is just for our close friends 🤫',
      "Quick update you don't want to miss!",
      '24 hours only ⏰',
    ],
    body: [
      'Keep it punchy — 5 words per slide max.\nUse polls, questions, and sliders for engagement.',
      'Frame 1: Question\nFrame 2: Tease answer\nFrame 3: Reveal + CTA',
    ],
    cta: [
      'Tap the link in bio! →',
      'Reply to this story!',
      'Swipe up for more!',
    ],
  },
  Organic: {
    hook: [
      "Here's a perspective you won't hear anywhere else:",
      'Real talk — this took us 3 months to figure out:',
      'A little reminder for your feed today 💛',
    ],
    body: [
      'Tell a story.\nMake a point.\nLeave them with something they can use TODAY.',
      'Lead with empathy.\nFollow with value.\nClose with conversation.',
    ],
    cta: [
      'Double tap if you agree ❤️',
      'Tag someone who needs to hear this!',
      'What do you think? Tell us below 👇',
    ],
  },
  'Ad Creative': {
    hook: [
      'Stop scrolling — this is for you.',
      'Limited time. Real results.',
      'Before you skip this ad — read this:',
    ],
    body: [
      'Problem → Agitate → Solution\n\nProblem: [pain point]\nAgitate: [consequences]\nSolution: [your offer]',
      'Social proof + Offer + Urgency.\n\nOver [X] happy customers.\nGet [result] in [timeframe].\nOffer ends [date].',
    ],
    cta: [
      'Click to claim your spot now →',
      'Shop now — only [X] left!',
      'Book a free call today!',
    ],
  },
};

const randPick = arr => arr[Math.floor(Math.random()*arr.length)];

// Create/Edit post modal
const EMPTY = {
  clientId:'', platforms:[], caption:'', hashtags:'', mediaUrls:[], videoUrls:[],
  scheduledDate:'', category:'Reel', notes:'',
  script:{ hook:'', body:'', cta:'', voiceover:'', textOverlays:[] },
};

function PostModal({ mode, initial, clients, preDate, onClose, onSaved }) {
  const [form,       setForm]       = useState(initial || { ...EMPTY, scheduledDate: preDate ? format(preDate,'yyyy-MM-dd\'T\'HH:mm') : '' });
  const [urlInput,   setUrlInput]   = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [overlayInput,setOverlayInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [scriptLoading,setScriptLoading] = useState(false);
  const [tab,        setTab]        = useState('content');
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setS = (k, v) => setForm(f => ({ ...f, script: { ...f.script, [k]: v } }));

  const togglePlatform = p => set('platforms', form.platforms.includes(p) ? form.platforms.filter(x=>x!==p) : [...form.platforms,p]);
  const addUrl      = () => { if(urlInput.trim()){set('mediaUrls',[...form.mediaUrls,urlInput.trim()]);setUrlInput('');} };
  const addVideoUrl = () => { if(videoInput.trim()){set('videoUrls',[...(form.videoUrls||[]),videoInput.trim()]);setVideoInput('');} };
  const addOverlay  = () => { if(overlayInput.trim()){setS('textOverlays',[...(form.script?.textOverlays||[]),overlayInput.trim()]);setOverlayInput('');} };

  const generateScript = async () => {
    setScriptLoading(true);
    await new Promise(r=>setTimeout(r,900));
    const tpl = SCRIPT_TEMPLATES[form.category] || SCRIPT_TEMPLATES.Organic;
    setForm(f => ({
      ...f,
      script: {
        ...f.script,
        hook:     randPick(tpl.hook),
        body:     randPick(tpl.body),
        cta:      randPick(tpl.cta),
        voiceover: `[INTRO]\n${randPick(tpl.hook)}\n\n[MAIN]\n${randPick(tpl.body)}\n\n[OUTRO]\n${randPick(tpl.cta)}`,
      }
    }));
    setScriptLoading(false);
    toast.success('📝 Script generated!');
  };

  const generateAI = async () => {
    const client = clients.find(c=>c._id===form.clientId);
    setAiLoading(true);
    await new Promise(r=>setTimeout(r,1200));
    const templates = {
      Reel:[
        `🎬 Behind the scenes at ${client?.businessName||'our studio'} — see the magic before it goes live! Tag someone who needs to see this. 🚀`,
        `✨ New ${form.category} dropping soon! Get ready ${client?.businessName||'team'} followers — this one's going to blow your mind! 🔥`,
      ],
      Carousel:[
        `💡 ${client?.businessName||'We'} break it down — swipe to see all ${randN(3,7)} tips you need to know today. Save this for later! 📌`,
        `🌟 The ultimate guide to [topic] — ${client?.businessName||'your brand'}'s step-by-step breakdown. Swipe through all slides! →`,
      ],
      Story:[
        `👆 Quick poll: Which one do you prefer? Reply to this story! ⬆️`,
        `🔥 24-hour flash deal! Don't miss out — tap the link in bio NOW! ⏰`,
      ],
      Organic:[
        `💬 We asked our community and YOU delivered! Here's what ${client?.businessName||'our'} fans are loving right now. What's YOUR take? 👇`,
        `🙌 Milestone unlocked! ${client?.businessName||'We'} just hit [number] [milestone]. Thank you for being part of this journey! ❤️`,
      ],
    };
    const pool = templates[form.category] || templates.Organic;
    set('caption', pool[Math.floor(Math.random()*pool.length)]);
    set('hashtags', `#${(client?.businessName||'brand').replace(/\s/g,'')} #DigitalMarketing #SocialMedia #${form.category} #ContentMarketing`);
    set('aiGenerated', true);
    setAiLoading(false);
    toast.success('✨ AI caption generated!');
  };

  const randN = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId)        { toast.error('Select a client.'); return; }
    if (!form.platforms.length){ toast.error('Pick at least one platform.'); return; }
    setSubmitting(true);
    try {
      if (mode === 'add') { await api.post('/posts', form); toast.success('🎉 Post created & sent for approval!'); }
      else                { await api.put(`/posts/${initial._id}`, form); toast.success('Post updated.'); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900">{mode==='add'?'Create Post':'Edit Post'}</h2>
              <p className="text-xs text-slate-400">{preDate ? `Scheduling for ${format(preDate,'dd MMM yyyy')}` : 'Schedule content for client approval'}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Category quick-select (most important first) */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => {
              const c = getCat(cat);
              return (
                <button key={cat} type="button" onClick={()=>set('category',cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                    form.category===cat
                      ? `bg-gradient-to-br ${c.grad} text-white border-transparent shadow-md`
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}>
                  {c.icon} {cat}
                </button>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 mt-3 overflow-x-auto">
            {[
              {id:'content',  label:'✍️ Caption'  },
              {id:'script',   label:'📝 Script'   },
              {id:'media',    label:'🖼️ Media'    },
              {id:'schedule', label:'📅 Schedule' },
            ].map(t=>(
              <button key={t.id} type="button" onClick={()=>setTab(t.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all min-w-0 ${tab===t.id?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'content' && (
            <>
              {/* Client */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client *</label>
                <select value={form.clientId} onChange={e=>set('clientId',e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="">— Select client —</option>
                  {clients.map(c=><option key={c._id} value={c._id}>{c.businessName}</option>)}
                </select>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Platforms *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p=>(
                    <button key={p} type="button" onClick={()=>togglePlatform(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        form.platforms.includes(p)
                          ? 'bg-blue-950 text-white border-transparent shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {PLATFORM_ICONS[p]} {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Caption</label>
                  <button type="button" onClick={generateAI} disabled={aiLoading||!form.clientId}
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 disabled:opacity-40 transition-colors">
                    {aiLoading?<><div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"/>Generating…</>:'✨ AI Write'}
                  </button>
                </div>
                <textarea value={form.caption} onChange={e=>set('caption',e.target.value)} rows={5}
                  placeholder={`Write your ${form.category.toLowerCase()} caption here…`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"/>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-400">{form.caption.length} chars</p>
                  {form.aiGenerated && <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI Generated</span>}
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hashtags</label>
                <input value={form.hashtags} onChange={e=>set('hashtags',e.target.value)}
                  placeholder="#DigitalMarketing #Branding #SocialMedia…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
              </div>
            </>
          )}

          {tab === 'script' && (
            <div className="space-y-4">
              {/* AI Script Generator button */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-black text-violet-800">AI Script Writer</p>
                    <p className="text-[10px] text-violet-500">Generates hook, body & CTA for {form.category}</p>
                  </div>
                  <button type="button" onClick={generateScript} disabled={scriptLoading}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black px-4 py-2 rounded-xl text-xs disabled:opacity-40 transition-all active:scale-95">
                    {scriptLoading ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Writing…</> : '✨ Generate Script'}
                  </button>
                </div>
              </div>

              {/* Hook */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🪝 Opening Hook <span className="text-slate-300 normal-case font-normal">(first 3 seconds)</span></label>
                <input value={form.script?.hook||''} onChange={e=>setS('hook',e.target.value)}
                  placeholder="Stop scrolling — this is for you…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">📖 Main Body / Script</label>
                <textarea value={form.script?.body||''} onChange={e=>setS('body',e.target.value)} rows={5}
                  placeholder="The main content, story, or talking points…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"/>
              </div>

              {/* CTA */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">📣 Call to Action</label>
                <input value={form.script?.cta||''} onChange={e=>setS('cta',e.target.value)}
                  placeholder="Drop a 🔥 if this helped! Follow for more…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
              </div>

              {/* Voiceover */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🎙️ Full Voiceover / Script</label>
                <textarea value={form.script?.voiceover||''} onChange={e=>setS('voiceover',e.target.value)} rows={6}
                  placeholder="Complete word-for-word script for the video or voiceover…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none font-mono text-xs"/>
              </div>

              {/* Text Overlays */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">💬 Text Overlays / Captions on Video</label>
                <div className="flex gap-2">
                  <input value={overlayInput} onChange={e=>setOverlayInput(e.target.value)}
                    placeholder="Add a text overlay line…"
                    onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addOverlay())}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                  <button type="button" onClick={addOverlay} className="bg-violet-600 text-white font-bold px-4 rounded-xl hover:bg-violet-700 text-sm">+</button>
                </div>
                {form.script?.textOverlays?.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {form.script.textOverlays.map((txt,i)=>(
                      <div key={i} className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2">
                        <span className="text-[10px] text-violet-400 font-black w-4">{i+1}</span>
                        <p className="flex-1 text-sm text-violet-800 font-medium">{txt}</p>
                        <button type="button" onClick={()=>setS('textOverlays',form.script.textOverlays.filter((_,j)=>j!==i))}
                          className="text-violet-400 hover:text-red-500 text-xs font-black">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'media' && (
            <div className="space-y-4">
              {/* Image URLs */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🖼️ Images / Thumbnails</label>
                <div className="flex gap-2">
                  <input value={urlInput} onChange={e=>setUrlInput(e.target.value)}
                    placeholder="https://res.cloudinary.com/… or any image URL"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addUrl())}
                  />
                  <button type="button" onClick={addUrl} className="bg-blue-950 text-white font-bold px-4 rounded-xl hover:bg-blue-900 text-sm">Add</button>
                </div>
              </div>
              {/* Video URLs */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">🎬 Video URLs (YouTube, Drive, Cloudinary…)</label>
                <div className="flex gap-2">
                  <input value={videoInput} onChange={e=>setVideoInput(e.target.value)}
                    placeholder="https://drive.google.com/… or YouTube link"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addVideoUrl())}
                  />
                  <button type="button" onClick={addVideoUrl} className="bg-pink-600 text-white font-bold px-4 rounded-xl hover:bg-pink-700 text-sm">+</button>
                </div>
                {(form.videoUrls||[]).length > 0 && (
                  <div className="mt-2 space-y-2">
                    {form.videoUrls.map((url,i)=>(
                      <div key={i} className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5">
                        <span className="text-base">🎬</span>
                        <p className="flex-1 text-xs text-pink-700 truncate font-medium">{url}</p>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-pink-500 font-bold hover:text-pink-700">Open</a>
                        <button type="button" onClick={()=>set('videoUrls',form.videoUrls.filter((_,j)=>j!==i))}
                          className="text-pink-400 hover:text-red-500 font-black text-xs ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.mediaUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {form.mediaUrls.map((url,i)=>(
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded-2xl bg-slate-100"
                        onError={e=>{e.target.parentElement.innerHTML=`<div class="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs">🖼️ Invalid URL</div>`;}}
                      />
                      <button type="button" onClick={()=>set('mediaUrls',form.mediaUrls.filter((_,j)=>j!==i))}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] font-black transition-all flex items-center justify-center">
                        ✕
                      </button>
                    </div>
                  ))}
                  <div onClick={()=>document.getElementById('urlInput')?.focus()}
                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 cursor-pointer hover:border-slate-300 transition-colors">
                    <span className="text-2xl">+</span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm text-slate-400 font-semibold">Paste image URLs above</p>
                  <p className="text-xs text-slate-300 mt-1">Supports Cloudinary, Unsplash, any CDN</p>
                </div>
              )}
            </div>
          )}

          {tab === 'schedule' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled Date & Time</label>
                <input type="datetime-local" value={form.scheduledDate} onChange={e=>set('scheduledDate',e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Internal Notes</label>
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}
                  placeholder="Notes for the team — reference photos, campaign context, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"/>
              </div>

              {/* Preview */}
              {form.caption && (
                <div className="bg-slate-900 rounded-2xl p-4 text-white">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Post Preview</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getCat(form.category).grad} flex items-center justify-center text-sm`}>
                      {getCat(form.category).icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{clients.find(c=>c._id===form.clientId)?.businessName||'Client Name'}</p>
                      <p className="text-[10px] text-slate-500">{form.scheduledDate ? format(new Date(form.scheduledDate),'dd MMM · HH:mm') : 'Not scheduled'}</p>
                    </div>
                  </div>
                  {form.mediaUrls?.[0] && <img src={form.mediaUrls[0]} alt="" className="w-full aspect-video object-cover rounded-xl mb-3 bg-slate-800"/>}
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap line-clamp-4">{form.caption}</p>
                  {form.hashtags && <p className="text-xs text-blue-400 mt-2">{form.hashtags}</p>}
                  <div className="flex gap-2 mt-3">
                    {form.platforms?.map(p=><span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${getCat(form.category).grad} shadow-lg`}>
            {submitting?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</>:(mode==='add'?`✨ Create ${form.category}`:'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SocialMediaManager() {
  const [posts,      setPosts]      = useState([]);
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [month,      setMonth]      = useState(new Date());
  const [view,       setView]       = useState('calendar');
  const [clientFilter,setClientFilter] = useState('');
  const [modal,      setModal]      = useState(null); // null | 'add'
  const [preDate,    setPreDate]    = useState(null);
  const [drawer,     setDrawer]     = useState(null); // post to show in drawer
  const [selectedPost,setSelectedPost] = useState(null);
  const [selectedDay,  setSelectedDay]  = useState(null);

  const load = useCallback(async () => {
    try {
      const from = format(startOfMonth(month), 'yyyy-MM-dd');
      const to   = format(endOfMonth(month),   'yyyy-MM-dd');
      const params = new URLSearchParams({ from, to, limit:200 });
      if (clientFilter) params.append('clientId', clientFilter);
      const [pRes, cRes] = await Promise.all([
        api.get(`/posts?${params}`),
        api.get('/clients'),
      ]);
      setPosts(pRes.data.posts || []);
      setClients(cRes.data.clients?.filter(c=>c.isActive) || []);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  }, [month, clientFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = (date = null) => { setPreDate(date); setModal('add'); };
  const openPost = (post)        => { setDrawer(post); };

  // Build calendar days (always 6 weeks for consistent height)
  const calDays = useMemo(() => {
    const start = startOfMonth(month);
    const end   = endOfMonth(month);
    const days  = eachDayOfInterval({ start, end });
    const leading  = start.getDay();
    const trailing = 6 - end.getDay();
    const prevDays = Array.from({ length: leading },  (_, i) => new Date(start.getFullYear(), start.getMonth(), -leading + i + 1));
    const nextDays = Array.from({ length: trailing }, (_, i) => new Date(end.getFullYear(),   end.getMonth()+1, i+1));
    return [...prevDays, ...days, ...nextDays];
  }, [month]);

  // Stats
  const stats = useMemo(() => {
    const t = { total:0, draft:0, scheduled:0, posted:0, pending:0, approved:0 };
    posts.forEach(p => {
      t.total++;
      if (p.status === 'Draft')       t.draft++;
      if (p.status === 'Scheduled')   t.scheduled++;
      if (p.status === 'Posted')      t.posted++;
      if (p.approvalStatus === 'Pending')  t.pending++;
      if (p.approvalStatus === 'Approved') t.approved++;
    });
    return t;
  }, [posts]);

  const selectedClient = clients.find(c => c._id === clientFilter);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ── */}
      <div className="px-5 pt-4 pb-3 shrink-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-slate-900">Social Media Manager</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedClient ? `${selectedClient.businessName} — ` : ''}{format(month,'MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
              {[{v:'calendar',icon:'📅',label:'Cal'},{v:'list',icon:'📋',label:'List'}].map(({v,icon,label})=>(
                <button key={v} onClick={()=>setView(v)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view===v?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>
                  {icon} <span className="hidden sm:inline">{v==='calendar'?'Calendar':'List'}</span><span className="sm:hidden">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>openAdd()}
              className="flex items-center gap-1.5 bg-blue-950 hover:bg-blue-900 text-white font-black px-3 sm:px-4 py-2.5 rounded-2xl text-sm transition-all shadow-lg shadow-blue-950/20 active:scale-95">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              <span className="hidden sm:inline">New Post</span>
            </button>
          </div>
        </div>

        {/* Client tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={()=>setClientFilter('')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 whitespace-nowrap transition-all ${!clientFilter?'bg-blue-950 text-white border-blue-950':'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
            All Clients
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${!clientFilter?'bg-white text-blue-950':'bg-slate-100 text-slate-500'}`}>{posts.length}</span>
          </button>
          {clients.map(c => {
            const cnt = posts.filter(p=>p.clientId?._id===c._id||p.clientId===c._id).length;
            const pending = posts.filter(p=>(p.clientId?._id===c._id||p.clientId===c._id)&&p.approvalStatus==='Pending').length;
            return (
              <button key={c._id} onClick={()=>setClientFilter(c._id===clientFilter?'':c._id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 whitespace-nowrap transition-all ${clientFilter===c._id?'bg-blue-950 text-white border-blue-950':'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                {c.logoUrl
                  ? <img src={c.logoUrl} alt="" className="w-4 h-4 rounded-md object-cover"/>
                  : <div className="w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">{c.businessName?.charAt(0)}</div>
                }
                {c.businessName}
                {cnt > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${clientFilter===c._id?'bg-white text-blue-950':'bg-slate-100 text-slate-500'}`}>{cnt}</span>}
                {pending > 0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-white">{pending}</span>}
              </button>
            );
          })}
        </div>

        {/* Quota bar */}
        <QuotaBar posts={posts} client={selectedClient} />

        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            {label:'Total',     value:stats.total,     color:'text-slate-800'},
            {label:'Draft',     value:stats.draft,     color:'text-slate-500'},
            {label:'Scheduled', value:stats.scheduled, color:'text-blue-600' },
            {label:'Posted',    value:stats.posted,    color:'text-emerald-600'},
            {label:'⏳ Pending',value:stats.pending,   color:'text-amber-600'},
            {label:'✅ OK',     value:stats.approved,  color:'text-emerald-600'},
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-2 py-2 text-center shadow-sm">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar / List ── */}
      <div className="flex-1 overflow-auto px-5 pb-5">
        {loading ? (
          <div className="h-full bg-slate-50 rounded-3xl animate-pulse"/>
        ) : view === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <button onClick={()=>setMonth(m=>subMonths(m,1))} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div className="text-center">
                <p className="font-black text-slate-900">{format(month,'MMMM yyyy')}</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  {Object.entries(CAT).slice(0,5).map(([k,v])=>(
                    <div key={k} className="flex items-center gap-1">
                      <span className="text-[10px]">{v.icon}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={()=>setMonth(m=>addMonths(m,1))} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
                <div key={d} className="text-center py-2.5 text-xs font-black text-slate-400 uppercase tracking-wider border-r border-slate-100 last:border-0">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7" style={{minHeight:'480px'}}>
              {calDays.map((day, idx) => (
                <DayCell
                  key={idx}
                  day={day}
                  posts={posts}
                  isCurrentMonth={isSameMonth(day, month)}
                  onAddPost={openAdd}
                  onPostClick={openPost}
                  selectedDay={selectedDay}
                  onSelect={(d) => setSelectedDay(s => s && isSameDay(s, d) ? null : d)}
                />
              ))}
            </div>

            {/* Mobile selected-day panel */}
            {selectedDay && (() => {
              const dp = posts.filter(p => p.scheduledDate && isSameDay(new Date(p.scheduledDate), selectedDay));
              return (
                <div className="sm:hidden border-t border-slate-100 animate-slide-up">
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-800">{format(selectedDay, 'EEE, d MMMM')}</p>
                      <p className="text-[10px] text-slate-400">{dp.length} post{dp.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { openAdd(selectedDay); setSelectedDay(null); }}
                        className="bg-blue-950 text-white text-xs font-black px-3 py-1.5 rounded-xl active:scale-95 transition-all">
                        + Add Post
                      </button>
                      <button onClick={() => setSelectedDay(null)}
                        className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-black active:scale-95">
                        ✕
                      </button>
                    </div>
                  </div>
                  {/* Panel content */}
                  {dp.length === 0 ? (
                    <div className="py-7 text-center">
                      <p className="text-2xl mb-1.5">📅</p>
                      <p className="text-sm text-slate-400 font-semibold">Nothing scheduled</p>
                      <p className="text-xs text-slate-300 mt-0.5">Tap "+ Add Post" to schedule</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {dp.map(post => {
                        const c  = getCat(post.category);
                        return (
                          <button key={post._id} onClick={() => openPost(post)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left transition-colors">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-base shrink-0`}>
                              {c.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.light}`}>{post.category}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  post.approvalStatus==='Approved' ? 'bg-emerald-100 text-emerald-700' :
                                  post.approvalStatus==='Pending'  ? 'bg-amber-100 text-amber-700'    :
                                  post.approvalStatus==='Rejected' ? 'bg-red-100 text-red-700'        :
                                  'bg-violet-100 text-violet-700'
                                }`}>{post.approvalStatus}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{post.caption || '(no caption)'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {post.platforms?.slice(0,3).map(p=><span key={p} className="text-xs">{PLATFORM_ICONS[p]}</span>)}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          /* List view */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {posts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-5xl mb-3">📅</p>
                <p className="font-bold text-slate-500 text-lg">No posts this month</p>
                <p className="text-sm text-slate-400 mt-1">Click "+ New Post" or tap any calendar day to create one</p>
                <button onClick={()=>openAdd()} className="mt-5 bg-blue-950 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-blue-900 transition-colors">
                  + Create First Post
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {/* Group by date */}
                {[...new Set(posts.map(p => p.scheduledDate ? format(new Date(p.scheduledDate),'yyyy-MM-dd') : 'unscheduled'))]
                  .sort()
                  .map(dateKey => {
                    const dayPosts = posts.filter(p => (p.scheduledDate ? format(new Date(p.scheduledDate),'yyyy-MM-dd') : 'unscheduled') === dateKey);
                    return (
                      <div key={dateKey}>
                        <div className="px-5 py-2.5 bg-slate-50 flex items-center gap-3 sticky top-0">
                          <p className="text-xs font-black text-slate-700">
                            {dateKey === 'unscheduled' ? '📌 Unscheduled' : format(new Date(dateKey), 'EEEE, dd MMMM')}
                          </p>
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">{dayPosts.length} posts</span>
                        </div>
                        {dayPosts.map(post => {
                          const c  = getCat(post.category);
                          const ap = APPROVAL[post.approvalStatus];
                          return (
                            <div key={post._id} onClick={()=>openPost(post)}
                              className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-lg shrink-0`}>
                                {c.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-slate-800 truncate">
                                    {post.clientId?.businessName||'Client'}
                                  </p>
                                  <CategoryChip category={post.category}/>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    post.approvalStatus==='Approved'?'bg-emerald-100 text-emerald-700':
                                    post.approvalStatus==='Pending'?'bg-amber-100 text-amber-700':
                                    post.approvalStatus==='Rejected'?'bg-red-100 text-red-700':
                                    'bg-violet-100 text-violet-700'
                                  }`}>{post.approvalStatus}</span>
                                  {post.aiGenerated && <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">✨ AI</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{post.caption||'(no caption)'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {post.platforms?.map(p=><span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}
                                  {post.scheduledDate && <p className="text-[10px] text-slate-400">📅 {format(new Date(post.scheduledDate),'HH:mm')}</p>}
                                  {post.mediaUrls?.length > 0 && <span className="text-[10px] text-slate-400">🖼️ {post.mediaUrls.length} media</span>}
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      {modal === 'add' && (
        <PostModal
          mode="add"
          clients={clients}
          preDate={preDate}
          onClose={()=>{setModal(null);setPreDate(null);}}
          onSaved={()=>{load();setModal(null);setPreDate(null);}}
        />
      )}
      {drawer && (
        <PostDrawer
          post={drawer}
          onClose={()=>setDrawer(null)}
          onUpdate={()=>{load();setDrawer(null);}}
          onDelete={()=>{load();setDrawer(null);}}
        />
      )}
    </div>
  );
}
