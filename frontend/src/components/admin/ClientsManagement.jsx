import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVICES = [
  { id:'Social Media',    icon:'📱', color:'bg-violet-100 text-violet-700' },
  { id:'Meta Ads',        icon:'🎯', color:'bg-blue-100 text-blue-700'    },
  { id:'Video Editing',   icon:'🎬', color:'bg-pink-100 text-pink-700'    },
  { id:'Graphic Design',  icon:'🎨', color:'bg-orange-100 text-orange-700'},
  { id:'Website',         icon:'🌐', color:'bg-cyan-100 text-cyan-700'    },
  { id:'SEO',             icon:'🔍', color:'bg-green-100 text-green-700'  },
  { id:'Shoot',           icon:'📷', color:'bg-emerald-100 text-emerald-700'},
  { id:'Branding',        icon:'✨', color:'bg-amber-100 text-amber-700'  },
  { id:'Content Writing', icon:'✍️', color:'bg-indigo-100 text-indigo-700'},
  { id:'Other',           icon:'📋', color:'bg-slate-100 text-slate-600'  },
];
const INDUSTRIES = [
  { id:'Fashion',         icon:'👗', grad:'from-pink-400 to-rose-500'     },
  { id:'Food & Beverage', icon:'🍜', grad:'from-orange-400 to-amber-500'  },
  { id:'Real Estate',     icon:'🏠', grad:'from-blue-400 to-indigo-500'   },
  { id:'Healthcare',      icon:'⚕️', grad:'from-teal-400 to-emerald-500'  },
  { id:'Education',       icon:'📚', grad:'from-violet-400 to-purple-500' },
  { id:'E-commerce',      icon:'🛒', grad:'from-cyan-400 to-blue-500'     },
  { id:'Finance',         icon:'💰', grad:'from-emerald-400 to-green-500' },
  { id:'Travel',          icon:'✈️', grad:'from-sky-400 to-blue-500'      },
  { id:'Retail',          icon:'🏪', grad:'from-amber-400 to-orange-500'  },
  { id:'Tech',            icon:'💻', grad:'from-slate-400 to-slate-600'   },
  { id:'Other',           icon:'🏢', grad:'from-slate-400 to-slate-500'   },
];

const CONTENT_TARGETS_DEFAULT = { Reel:6, Carousel:8, Story:12, Organic:8, 'Ad Creative':4 };

const getIndustry = (id) => INDUSTRIES.find(i=>i.id===id) || INDUSTRIES[INDUSTRIES.length-1];
const getService  = (id) => SERVICES.find(s=>s.id===id);

const SVC_COLORS = {
  'Social Media':'bg-violet-100 text-violet-700','Meta Ads':'bg-blue-100 text-blue-700',
  'Video Editing':'bg-pink-100 text-pink-700','Graphic Design':'bg-orange-100 text-orange-700',
  'Website':'bg-cyan-100 text-cyan-700','SEO':'bg-green-100 text-green-700',
  'Shoot':'bg-emerald-100 text-emerald-700','Branding':'bg-amber-100 text-amber-700',
  'Content Writing':'bg-indigo-100 text-indigo-700',
};

// ─── Wizard Steps Config ──────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:'Brand',    icon:'✨', title:'Brand Identity',   subtitle:"Set the brand name, logo and industry"    },
  { id:2, label:'Contact',  icon:'📞', title:'Contact Details',  subtitle:'How to reach the client'                  },
  { id:3, label:'Services', icon:'🛠️', title:'Services',         subtitle:'What you deliver for this client'         },
  { id:4, label:'Team',     icon:'👥', title:'Assign Team',      subtitle:'Who manages this client'                  },
  { id:5, label:'Strategy', icon:'📅', title:'Content Strategy', subtitle:'Monthly content targets & platform mix'   },
  { id:6, label:'Review',   icon:'🚀', title:'Review & Launch',  subtitle:'Confirm and create client profile'        },
];

const EMPTY_FORM = {
  businessName:'', contactName:'', email:'', phone:'', website:'', industry:'',
  services:[], notes:'', logoUrl:'', assignedSMM:[], assignedMetaManager:'',
  contentTargets: { ...CONTENT_TARGETS_DEFAULT },
  primaryPlatforms:['Instagram'],
  monthlyBudget:'', contractNote:'',
};

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <label className="text-xs font-black text-slate-600 uppercase tracking-wider">{label}</label>
        {required && <span className="text-[10px] text-red-400 font-bold">required</span>}
        {hint && <span className="text-[10px] text-slate-400 ml-auto">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all";

// ─── Add/Edit Client Wizard ───────────────────────────────────────────────────
function ClientWizard({ mode, initial, staff, onClose, onSaved }) {
  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState(initial || EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview,setLogoPreview]= useState(initial?.logoUrl || '');
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT = (k, v) => setForm(f => ({ ...f, contentTargets: { ...f.contentTargets, [k]: Number(v)||0 } }));
  const totalSteps = mode === 'edit' ? 5 : 6;

  const smm  = staff.filter(u => u.role === 'SMM');
  const meta = staff.filter(u => u.role === 'Meta Ads Manager');

  const toggleService  = s => set('services', form.services.includes(s) ? form.services.filter(x=>x!==s) : [...form.services,s]);
  const togglePlatform = p => set('primaryPlatforms', form.primaryPlatforms.includes(p) ? form.primaryPlatforms.filter(x=>x!==p) : [...form.primaryPlatforms,p]);

  const canNext = () => {
    if (step === 1) return form.businessName.trim().length > 0;
    if (step === 2) return form.contactName.trim().length > 0 && form.email.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (mode === 'add') {
        await api.post('/clients', payload);
        toast.success(`🎉 ${form.businessName} added successfully!`);
      } else {
        await api.put(`/clients/${initial._id}`, payload);
        toast.success('Client updated.');
      }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save client.'); }
    finally { setSubmitting(false); }
  };

  const industry = getIndustry(form.industry);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl shadow-black/30" onClick={e=>e.stopPropagation()}>

        {/* ── Wizard Header ── */}
        <div className={`bg-gradient-to-br ${industry.grad} px-6 py-5 relative overflow-hidden`}>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full"/>
          <div className="absolute -bottom-4 right-12 w-20 h-20 bg-white/10 rounded-full"/>
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-12 h-12 rounded-2xl object-cover bg-white/20 ring-2 ring-white/30"
                  onError={()=>setLogoPreview('')}/>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl ring-2 ring-white/30">
                  {form.businessName?.charAt(0)?.toUpperCase() || industry.icon}
                </div>
              )}
              <div>
                <h2 className="font-black text-white text-lg leading-tight">{form.businessName || (mode==='add'?'New Client':'Edit Client')}</h2>
                <p className="text-white/70 text-xs">{STEPS[step-1].subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Step progress */}
          <div className="relative flex items-center gap-0 mt-5">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button onClick={()=>i+1 < step && setStep(i+1)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                    step === s.id ? 'bg-white text-blue-800 shadow-lg scale-110' :
                    step > s.id  ? 'bg-white/40 text-white' :
                    'bg-white/20 text-white/60'
                  }`}>
                  {step > s.id ? '✓' : s.icon}
                </button>
                {i < STEPS.length-1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${step > s.id ? 'bg-white/50' : 'bg-white/20'}`}/>
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-2">
            {STEPS.map(s=>(
              <div key={s.id} className="flex-1 text-center">
                <p className={`text-[10px] font-bold transition-all ${step===s.id?'text-white':'text-white/40'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP 1: Brand Identity */}
          {step === 1 && (
            <div className="space-y-5">
              <Field label="Business Name" required>
                <input autoFocus value={form.businessName} onChange={e=>set('businessName',e.target.value)}
                  placeholder="e.g. Acme Fashion, TechVibe Solutions…"
                  className={INPUT_CLS}/>
              </Field>

              <Field label="Industry">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                  {INDUSTRIES.map(ind => (
                    <button key={ind.id} type="button" onClick={()=>set('industry',ind.id)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                        form.industry===ind.id
                          ? `bg-gradient-to-br ${ind.grad} text-white border-transparent shadow-md`
                          : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-white'
                      }`}>
                      <span className="text-xl">{ind.icon}</span>
                      <span className="text-[10px] font-black leading-tight">{ind.id}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Logo URL" hint="Paste any image URL">
                <input value={form.logoUrl} onChange={e=>{set('logoUrl',e.target.value);setLogoPreview(e.target.value);}}
                  placeholder="https://example.com/logo.png"
                  className={INPUT_CLS}/>
                {logoPreview && (
                  <div className="mt-2 flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
                    <img src={logoPreview} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-200"
                      onError={()=>setLogoPreview('')}/>
                    <p className="text-xs text-slate-500 font-medium">Logo preview</p>
                  </div>
                )}
              </Field>

              <Field label="Internal Notes" hint="Optional">
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}
                  placeholder="Key context about this client, special requirements, campaign history…"
                  className={`${INPUT_CLS} resize-none`}/>
              </Field>
            </div>
          )}

          {/* STEP 2: Contact Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Person" required>
                  <input value={form.contactName} onChange={e=>set('contactName',e.target.value)}
                    placeholder="Priya Sharma" className={INPUT_CLS}/>
                </Field>
                <Field label="Email" required>
                  <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                    placeholder="priya@example.com" className={INPUT_CLS}/>
                </Field>
                <Field label="Phone">
                  <input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)}
                    placeholder="+91 98765 43210" className={INPUT_CLS}/>
                </Field>
                <Field label="Website">
                  <input value={form.website} onChange={e=>set('website',e.target.value)}
                    placeholder="https://example.com" className={INPUT_CLS}/>
                </Field>
              </div>
              <Field label="Monthly Budget (₹)" hint="For internal planning">
                <input type="number" value={form.monthlyBudget} onChange={e=>set('monthlyBudget',e.target.value)}
                  placeholder="50000" className={INPUT_CLS}/>
              </Field>
              <Field label="Contract / Retainer Note" hint="Optional">
                <textarea value={form.contractNote} onChange={e=>set('contractNote',e.target.value)} rows={2}
                  placeholder="6-month retainer, renewal in Dec 2025…"
                  className={`${INPUT_CLS} resize-none`}/>
              </Field>
            </div>
          )}

          {/* STEP 3: Services */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Select all services you deliver for this client:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {SERVICES.map(svc => {
                  const sel = form.services.includes(svc.id);
                  return (
                    <button key={svc.id} type="button" onClick={()=>toggleService(svc.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                        sel ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${sel?'bg-blue-100':'bg-slate-100'}`}>
                        {svc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${sel?'text-blue-700':'text-slate-700'}`}>{svc.id}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${sel?'bg-blue-500 border-blue-500':'border-slate-300'}`}>
                        {sel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {form.services.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-xs text-slate-500 font-bold mb-2">{form.services.length} services selected:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.services.map(s => {
                      const svc = getService(s);
                      return <span key={s} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${SVC_COLORS[s]||'bg-slate-100 text-slate-600'}`}>{svc?.icon} {s}</span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Team Assignment */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-black text-slate-700 mb-3">Social Media Managers</p>
                {smm.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-sm text-amber-700 font-bold">No SMM users yet</p>
                    <p className="text-xs text-amber-600 mt-1">Go to User Management → Create a user with the SMM role first.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {smm.map(u => {
                      const sel = (form.assignedSMM||[]).includes(u._id);
                      return (
                        <label key={u._id} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          sel ? 'border-violet-300 bg-violet-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}>
                          <input type="checkbox" className="hidden"
                            checked={sel}
                            onChange={e => {
                              const list = form.assignedSMM||[];
                              set('assignedSMM', e.target.checked ? [...list,u._id] : list.filter(x=>x!==u._id));
                            }}/>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${sel?'bg-violet-500 text-white':'bg-slate-100 text-slate-600'}`}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${sel?'text-violet-700':'text-slate-700'}`}>{u.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel?'bg-violet-500 border-violet-500':'border-slate-300'}`}>
                            {sel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-black text-slate-700 mb-3">Meta Ads Manager</p>
                {meta.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <p className="text-sm text-blue-700 font-bold">No Meta Ads Manager users yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[{_id:'', name:'— None —', email:''}, ...meta].map(u => {
                      const sel = form.assignedMetaManager === u._id;
                      return (
                        <label key={u._id} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          sel && u._id ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}>
                          <input type="radio" className="hidden" name="metaManager"
                            checked={sel}
                            onChange={()=>set('assignedMetaManager', u._id||null)}/>
                          {u._id ? (
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${sel?'bg-blue-500 text-white':'bg-slate-100 text-slate-600'}`}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-base shrink-0">⊘</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${sel&&u._id?'text-blue-700':'text-slate-700'}`}>{u.name}</p>
                            {u.email && <p className="text-[10px] text-slate-400">{u.email}</p>}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel&&u._id?'bg-blue-500 border-blue-500':'border-slate-300'}`}>
                            {sel && u._id && <div className="w-2 h-2 bg-white rounded-full"/>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Content Strategy */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-blue-950 to-violet-900 rounded-2xl p-4 text-white">
                <p className="text-sm font-black mb-0.5">Monthly Content Blueprint</p>
                <p className="text-xs text-white/60">Set monthly content targets — these drive the quota bars in the Social Media Manager</p>
              </div>

              {/* Targets */}
              <div className="space-y-3">
                {[
                  {key:'Reel',         icon:'🎬', color:'bg-pink-500',    desc:'Short-form video, 15-90 sec'        },
                  {key:'Carousel',     icon:'🎠', color:'bg-violet-500',  desc:'Multi-image swipe posts'            },
                  {key:'Story',        icon:'📱', color:'bg-blue-500',    desc:'24-hr Stories & Story sequences'    },
                  {key:'Organic',      icon:'📸', color:'bg-emerald-500', desc:'Static posts, quotes, info-graphics'},
                  {key:'Ad Creative',  icon:'🎯', color:'bg-orange-500',  desc:'Paid social ad creatives'          },
                ].map(({ key, icon, color, desc }) => (
                  <div key={key} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3.5">
                    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white text-base shrink-0`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800">{key}</p>
                      <p className="text-[10px] text-slate-400">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={()=>setT(key,Math.max(0,(form.contentTargets[key]||0)-1))}
                        className="w-8 h-8 bg-white rounded-xl border border-slate-200 font-black text-slate-500 hover:bg-slate-100 flex items-center justify-center text-lg leading-none">−</button>
                      <span className="w-8 text-center font-black text-slate-800 text-lg">{form.contentTargets[key]||0}</span>
                      <button type="button" onClick={()=>setT(key,(form.contentTargets[key]||0)+1)}
                        className="w-8 h-8 bg-blue-950 rounded-xl font-black text-white hover:bg-blue-900 flex items-center justify-center text-lg leading-none">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total summary */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-800">Total posts/month</p>
                  <p className="text-xs text-slate-400">across all content types</p>
                </div>
                <div className="text-3xl font-black text-blue-950">{Object.values(form.contentTargets||{}).reduce((a,b)=>a+b,0)}</div>
              </div>

              {/* Primary Platforms */}
              <div>
                <p className="text-sm font-black text-slate-700 mb-3">Primary Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {id:'Instagram',icon:'📸'},{id:'Facebook',icon:'📘'},{id:'LinkedIn',icon:'💼'},
                    {id:'Twitter',icon:'🐦'},{id:'YouTube',icon:'▶️'},{id:'WhatsApp',icon:'💬'},
                  ].map(p => {
                    const sel = form.primaryPlatforms?.includes(p.id);
                    return (
                      <button key={p.id} type="button" onClick={()=>togglePlatform(p.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          sel ? 'bg-blue-950 text-white border-blue-950 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        {p.icon} {p.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review */}
          {step === 6 && (
            <div className="space-y-4">
              <div className={`bg-gradient-to-br ${industry.grad} rounded-3xl p-5 text-white relative overflow-hidden`}>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"/>
                <div className="flex items-center gap-3 relative">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30 bg-white/20"/>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl ring-2 ring-white/30">{industry.icon}</div>
                  )}
                  <div>
                    <h3 className="text-xl font-black">{form.businessName}</h3>
                    <p className="text-white/70 text-sm">{form.contactName} · {form.industry}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Contact</p>
                  <p className="text-sm font-bold text-slate-800">{form.email}</p>
                  {form.phone && <p className="text-xs text-slate-400">{form.phone}</p>}
                  {form.website && <p className="text-xs text-blue-500 truncate">{form.website}</p>}
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Monthly Plan</p>
                  <p className="text-2xl font-black text-blue-950">{Object.values(form.contentTargets||{}).reduce((a,b)=>a+b,0)}</p>
                  <p className="text-[10px] text-slate-400">posts per month</p>
                </div>
              </div>

              {form.services.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Services ({form.services.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.services.map(s => {
                      const svc = getService(s);
                      return <span key={s} className={`text-[10px] font-bold px-2 py-1 rounded-full ${SVC_COLORS[s]||'bg-slate-100 text-slate-600'}`}>{svc?.icon} {s}</span>;
                    })}
                  </div>
                </div>
              )}

              {(form.assignedSMM?.length > 0 || form.assignedMetaManager) && (
                <div className="bg-slate-50 rounded-2xl p-3.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Team</p>
                  {form.assignedSMM?.length > 0 && (
                    <p className="text-xs text-slate-700">
                      <span className="font-bold">SMM:</span> {smm.filter(u=>form.assignedSMM.includes(u._id)).map(u=>u.name).join(', ')}
                    </p>
                  )}
                  {form.assignedMetaManager && (
                    <p className="text-xs text-slate-700 mt-1">
                      <span className="font-bold">Meta Manager:</span> {meta.find(u=>u._id===form.assignedMetaManager)?.name}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-emerald-700 font-bold text-sm">Everything looks good!</p>
                <p className="text-emerald-600 text-xs mt-1">Click "Launch Client" to create their profile and unlock the content calendar.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation Footer ── */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-3 shrink-0 bg-white">
          {step > 1 ? (
            <button onClick={()=>setStep(s=>s-1)} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Back
            </button>
          ) : (
            <button onClick={onClose} className="text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors">Cancel</button>
          )}

          <div className="flex-1 flex justify-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.id} className={`h-1.5 rounded-full transition-all ${step===s.id?'w-8 bg-blue-950':step>s.id?'w-4 bg-blue-200':'w-4 bg-slate-200'}`}/>
            ))}
          </div>

          {step < 6 ? (
            <button onClick={()=>canNext()&&setStep(s=>s+1)} disabled={!canNext()}
              className="flex items-center gap-1.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black px-5 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-blue-950/20 active:scale-95">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Saving…</>
              ) : (
                <>🚀 {mode==='add'?'Launch Client':'Save Changes'}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Credentials Modal ────────────────────────────────────────────────────────
function CredentialsModal({ client, onClose }) {
  const [step,     setStep]     = useState('check'); // check | create | show
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState(null);
  const [creds,    setCreds]    = useState(null);
  const [creating, setCreating] = useState(false);

  // Generate a readable random password
  const makePassword = () => {
    const words = ['Dg', 'Social', 'Brand', 'Client', 'Media'];
    const word = words[Math.floor(Math.random() * words.length)];
    const num  = Math.floor(1000 + Math.random() * 9000);
    return `${word}@${num}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/users?role=Client`);
        const found = (res.data.users || []).find(u => u.clientRef?._id === client._id || u.clientRef === client._id);
        setExisting(found || null);
        setStep(found ? 'show-existing' : 'create');
      } catch { setStep('create'); }
      finally { setChecking(false); }
    })();
  }, [client._id]);

  const handleCreate = async () => {
    const pw = makePassword();
    setCreating(true);
    try {
      await api.post('/users', {
        name:     client.contactName,
        email:    client.email,
        password: pw,
        role:     'Client',
        clientId: client._id,
        phone:    client.phone || '',
      });
      setCreds({ email: client.email, password: pw });
      setStep('show');
      toast.success('Client login created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create login.');
    } finally { setCreating(false); }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-950 to-indigo-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">Client Portal Access</p>
              <h3 className="font-black text-lg">{client.businessName}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 text-sm font-black">✕</button>
          </div>
        </div>

        <div className="p-6">
          {checking ? (
            <div className="py-8 flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
            </div>
          ) : step === 'show-existing' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">✓ Login Exists</p>
                <p className="text-sm text-slate-700">A portal account already exists for this client.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{existing?.email}</p>
                  </div>
                  <button onClick={()=>copy(existing?.email)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 active:scale-95 transition-all">Copy</button>
                </div>
                <div className="h-px bg-slate-200"/>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Password</p>
                  <p className="text-sm text-slate-500 mt-0.5 italic">Password is private — use Reset to change it</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold">Portal URL</p>
                <p className="text-xs text-blue-800 font-medium mt-0.5 break-all">{window.location.origin}/client</p>
              </div>
              <button onClick={onClose} className="w-full py-3 rounded-2xl bg-blue-950 text-white font-black text-sm">Done</button>
            </div>
          ) : step === 'create' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                No portal login exists for <span className="font-bold text-slate-800">{client.businessName}</span> yet.
                Create one now so the client can review and approve content.
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-bold text-slate-800">{client.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-bold text-slate-800">{client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="font-bold text-blue-700">Client</span>
                </div>
              </div>
              <button onClick={handleCreate} disabled={creating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-900 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</> : '🔑 Create Portal Login'}
              </button>
            </div>
          ) : (
            /* Credentials revealed */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                <p className="text-emerald-700 font-black text-sm">✅ Portal login created!</p>
                <p className="text-emerald-600 text-xs mt-0.5">Share these credentials with your client</p>
              </div>

              {[{ label:'Email / Username', value:creds?.email }, { label:'Password', value:creds?.password }].map(row=>(
                <div key={row.label} className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{row.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-black text-slate-800 text-sm break-all font-mono">{row.value}</p>
                    <button onClick={()=>copy(row.value)} className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 active:scale-95">Copy</button>
                  </div>
                </div>
              ))}

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Portal Login URL</p>
                <p className="text-xs text-amber-800 font-medium break-all">{window.location.origin}/client</p>
              </div>

              <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">⚠️ Save these now</p>
                <p className="text-xs text-red-700 mt-0.5">Password is shown only once and cannot be retrieved later.</p>
              </div>

              <button onClick={onClose} className="w-full py-3 rounded-2xl bg-blue-950 text-white font-black text-sm active:scale-95 transition-all">
                Done — I've saved the credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Client Card ──────────────────────────────────────────────────────────────
function ClientCard({ client, onEdit, onToggle, onViewStrategy, onCredentials }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ind = getIndustry(client.industry);
  const initial = client.businessName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${client.isActive?'border-slate-100 hover:border-slate-200':'border-red-100 opacity-60'}`}>
      {/* Gradient banner */}
      <div className={`h-16 bg-gradient-to-br ${ind.grad} relative overflow-hidden`}>
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"/>
        <div className="absolute top-2 left-3 text-white/30 text-3xl font-black">{ind.icon}</div>
        {/* Status dot */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1`}>
          <div className={`w-1.5 h-1.5 rounded-full ${client.isActive?'bg-emerald-400':'bg-red-400'}`}/>
          <span className="text-[10px] text-white font-bold">{client.isActive?'Active':'Inactive'}</span>
        </div>
      </div>

      {/* Logo */}
      <div className="px-4 -mt-6 flex items-end justify-between mb-3 relative z-10">
        <div className={`w-12 h-12 rounded-2xl ring-3 ring-white shadow-lg overflow-hidden ${client.logoUrl?'bg-white':'bg-gradient-to-br '+ind.grad} flex items-center justify-center`}>
          {client.logoUrl ? (
            <img src={client.logoUrl} alt="" className="w-full h-full object-cover"
              onError={e=>{e.target.style.display='none';e.target.parentElement.innerHTML=`<span class="text-white font-black text-lg">${initial}</span>`;}}/>
          ) : (
            <span className="text-white font-black text-lg">{initial}</span>
          )}
        </div>
        {/* 3-dot menu */}
        <div className="relative mt-7">
          <button onClick={()=>setMenuOpen(!menuOpen)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20" onClick={()=>setMenuOpen(false)}>
              <button onClick={()=>onEdit(client)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left font-medium">
                ✏️ Edit Profile
              </button>
              <button onClick={()=>onViewStrategy(client)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left font-medium">
                📅 View Strategy
              </button>
              <button onClick={()=>onCredentials(client)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 text-left font-medium">
                🔑 Portal Access
              </button>
              {client.website && (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left font-medium">
                  🌐 Visit Website
                </a>
              )}
              <div className="h-px bg-slate-100 my-1"/>
              <button onClick={()=>onToggle(client)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 text-left font-medium ${client.isActive?'text-red-500':'text-emerald-600'}`}>
                {client.isActive ? '🔴 Deactivate' : '🟢 Reactivate'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Name + contact */}
        <div>
          <h3 className="font-black text-slate-900 text-lg leading-tight">{client.businessName}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{client.contactName}</p>
          {client.industry && (
            <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-br ${ind.grad} text-white`}>
              {ind.icon} {client.industry}
            </span>
          )}
        </div>

        {/* Services */}
        {client.services?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {client.services.slice(0,4).map(s=>(
              <span key={s} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SVC_COLORS[s]||'bg-slate-100 text-slate-600'}`}>{getService(s)?.icon} {s}</span>
            ))}
            {client.services.length > 4 && <span className="text-[10px] font-bold text-slate-400 px-1.5">+{client.services.length-4}</span>}
          </div>
        )}

        {/* Contact quick links */}
        <div className="flex gap-2">
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl py-2 text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors" title={client.email}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              Email
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl py-2 text-[10px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              Call
            </a>
          )}
        </div>

        {/* Footer badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {client.metaConnected && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Meta Live
            </span>
          )}
          {client.assignedSMM?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {client.assignedSMM.slice(0,3).map(s=>(
                  <div key={s._id||s} title={s.name||''} className="w-5 h-5 rounded-full bg-violet-500 ring-2 ring-white flex items-center justify-center text-white text-[10px] font-black">
                    {(s.name||'?').charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{client.assignedSMM.length} SMM</span>
            </div>
          )}
        </div>

        {/* Edit CTA */}
        <button onClick={()=>onEdit(client)}
          className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-950 hover:text-white text-slate-700 text-xs font-black border border-slate-100 hover:border-blue-950 transition-all group">
          <span className="group-hover:hidden">Manage Client</span>
          <span className="hidden group-hover:inline">✏️ Edit Profile</span>
        </button>
      </div>
    </div>
  );
}

// ─── Content Strategy Drawer ──────────────────────────────────────────────────
function StrategyDrawer({ client, onClose }) {
  const ind = getIndustry(client.industry);
  const targets = client.contentTargets || CONTENT_TARGETS_DEFAULT;
  const total   = Object.values(targets).reduce((a,b)=>a+b,0);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-br ${ind.grad} px-5 py-6 text-white relative overflow-hidden shrink-0`}>
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full"/>
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {client.logoUrl ? (
                <img src={client.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/30"/>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg ring-2 ring-white/30">
                  {client.businessName?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-black">{client.businessName}</h3>
                <p className="text-white/60 text-xs">{client.industry}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-3 relative">
            <p className="text-3xl font-black">{total}</p>
            <p className="text-white/70 text-xs">posts planned per month</p>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Monthly Content Blueprint</p>
          {[
            {key:'Reel',         icon:'🎬', color:'from-pink-500 to-rose-600',    desc:'Short-form video'       },
            {key:'Carousel',     icon:'🎠', color:'from-violet-500 to-purple-600',desc:'Multi-image swipe posts'},
            {key:'Story',        icon:'📱', color:'from-blue-500 to-cyan-600',    desc:'24-hr Stories'          },
            {key:'Organic',      icon:'📸', color:'from-emerald-500 to-teal-600', desc:'Static + info posts'    },
            {key:'Ad Creative',  icon:'🎯', color:'from-orange-500 to-red-600',   desc:'Paid social creatives'  },
          ].map(({ key, icon, color, desc }) => {
            const count = targets[key] || 0;
            return (
              <div key={key} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3.5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-lg shrink-0`}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-black text-slate-800">{key}</p>
                    <p className="text-sm font-black text-slate-800">{count} <span className="text-slate-400 font-normal">/mo</span></p>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
                      style={{width: `${Math.min((count/Math.max(total,1))*100*2.5,100)}%`}}/>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
                </div>
              </div>
            );
          })}

          {/* Services */}
          {client.services?.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Active Services</p>
              <div className="flex flex-wrap gap-1.5">
                {client.services.map(s => {
                  const svc = getService(s);
                  return <span key={s} className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl ${SVC_COLORS[s]||'bg-slate-100 text-slate-600'}`}>{svc?.icon} {s}</span>;
                })}
              </div>
            </div>
          )}

          {client.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1.5">Team Notes</p>
              <p className="text-sm text-amber-800 leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientsManagement() {
  const [clients,  setClients]  = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [credClient,setCredClient] = useState(null);

  const load = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/clients'),
        api.get('/users'),
      ]);
      setClients(cRes.data.clients || []);
      setStaff(sRes.data.users   || []);
    } catch { toast.error('Failed to load clients.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (client) => {
    try {
      if (client.isActive) {
        await api.delete(`/clients/${client._id}`);
        toast.success('Client deactivated.');
      } else {
        await api.put(`/clients/${client._id}`, { isActive: true });
        toast.success('Client reactivated.');
      }
      load();
    } catch { toast.error('Failed.'); }
  };

  const stats = useMemo(() => ({
    total:   clients.length,
    active:  clients.filter(c=>c.isActive).length,
    meta:    clients.filter(c=>c.metaConnected).length,
    industries: [...new Set(clients.map(c=>c.industry).filter(Boolean))].length,
  }), [clients]);

  const displayed = useMemo(() => {
    let list = clients;
    if (filter === 'active')   list = list.filter(c=>c.isActive);
    if (filter === 'inactive') list = list.filter(c=>!c.isActive);
    if (filter === 'meta')     list = list.filter(c=>c.metaConnected);
    if (search) list = list.filter(c => `${c.businessName} ${c.contactName} ${c.email} ${c.industry}`.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [clients, filter, search]);

  return (
    <div className="space-y-5">
      {/* ── Top Hero Bar ── */}
      <div className="bg-gradient-to-br from-blue-950 to-indigo-900 rounded-3xl px-5 py-5 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full"/>
        <div className="absolute bottom-0 right-20 w-24 h-24 bg-white/5 rounded-full"/>
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black">Client Portfolio</h2>
            <p className="text-blue-300 text-sm mt-0.5">Manage clients, content strategy & team assignments</p>
          </div>
          <button onClick={()=>setModal('add')}
            className="flex items-center gap-2 bg-white text-blue-950 font-black px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-50 transition-all shadow-lg active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
            Add Client
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 relative">
          {[
            {label:'Total',      value:stats.total,      sub:'clients'},
            {label:'Active',     value:stats.active,     sub:'running'},
            {label:'Meta Live',  value:stats.meta,       sub:'connected'},
            {label:'Industries', value:stats.industries, sub:'sectors'},
          ].map(s=>(
            <div key={s.label} className="bg-white/10 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, contact, industry…"
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"/>
          {search && (
            <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-0.5 shadow-sm">
          {[{id:'all',label:'All'},{id:'active',label:'Active'},{id:'inactive',label:'Inactive'},{id:'meta',label:'Meta'}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter===f.id?'bg-blue-950 text-white shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i=>(
            <div key={i} className="bg-slate-100 rounded-3xl animate-pulse" style={{height:'280px'}}/>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center shadow-sm">
          <p className="text-6xl mb-4">🏢</p>
          <p className="text-xl font-black text-slate-600">
            {search || filter !== 'all' ? 'No clients match' : 'No clients yet'}
          </p>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            {search || filter !== 'all' ? 'Try a different search or filter.' : 'Add your first client to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={()=>setModal('add')}
              className="bg-blue-950 text-white font-black px-6 py-3 rounded-2xl text-sm hover:bg-blue-900 transition-colors shadow-lg">
              + Add First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(c=>(
            <ClientCard key={c._id} client={c}
              onEdit={c=>{setSelected(c);setModal('edit');}}
              onToggle={handleToggle}
              onViewStrategy={c=>setStrategy(c)}
              onCredentials={c=>setCredClient(c)}
            />
          ))}
          {/* Add Client CTA card */}
          <button onClick={()=>setModal('add')}
            className="h-full min-h-[260px] rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            </div>
            <div className="text-center">
              <p className="font-black text-sm">Add New Client</p>
              <p className="text-xs opacity-60 mt-0.5">Create a 6-step profile</p>
            </div>
          </button>
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && (
        <ClientWizard mode="add" staff={staff}
          onClose={()=>setModal(null)}
          onSaved={()=>{load();setModal(null);}}/>
      )}
      {modal === 'edit' && selected && (
        <ClientWizard mode="edit"
          initial={{
            ...selected,
            assignedSMM: selected.assignedSMM?.map(s=>s._id||s)||[],
            contentTargets: selected.contentTargets || CONTENT_TARGETS_DEFAULT,
            primaryPlatforms: selected.primaryPlatforms || ['Instagram'],
          }}
          staff={staff}
          onClose={()=>{setModal(null);setSelected(null);}}
          onSaved={()=>{load();setModal(null);setSelected(null);}}/>
      )}
      {strategy && <StrategyDrawer client={strategy} onClose={()=>setStrategy(null)}/>}
      {credClient && <CredentialsModal client={credClient} onClose={()=>setCredClient(null)}/>}
    </div>
  );
}
