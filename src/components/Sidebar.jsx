'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ROLE_CFG = {
  SuperAdmin:      { label: 'Super Admin',      color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  Admin:           { label: 'Admin',            color: 'text-red-400',    bg: 'bg-red-500/15'    },
  Manager:         { label: 'Manager',          color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  Sales:           { label: 'Sales',            color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  VideoEditor:     { label: 'Video Editor',     color: 'text-purple-400', bg: 'bg-purple-500/15' },
  GraphicDesigner: { label: 'Graphic Designer', color: 'text-pink-400',   bg: 'bg-pink-500/15'   },
  SMM:             { label: 'Social Media',     color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
  ContentWriter:   { label: 'Content Writer',   color: 'text-green-400',  bg: 'bg-green-500/15'  },
  Intern:          { label: 'Intern',           color: 'text-orange-400', bg: 'bg-orange-500/15' },
  Client:          { label: 'Client',           color: 'text-emerald-400',bg: 'bg-emerald-500/15'},
  MetaAdsManager:  { label: 'Meta Ads Mgr',     color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
};

// Shared icon paths
const ICONS = {
  home:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  leads:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  pipeline: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  import:   'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  meta:     'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  call:     'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  report:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  team:     'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  social:   'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
  approve:  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clients:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  portal:   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
};

// Navigation items per role
const NAV = {
  SuperAdmin: [
    { href: '/dashboard', label: 'Dashboard',    icon: ICONS.home   },
    { href: '/clients',   label: 'Clients',      icon: ICONS.clients, color: 'text-emerald-400' },
    { href: '/social',    label: 'Social Posts', icon: ICONS.social,  color: 'text-pink-400'    },
    { href: '/approvals', label: 'Approvals',    icon: ICONS.approve, color: 'text-amber-400'   },
    { href: '/leads',     label: 'All Leads',    icon: ICONS.leads  },
    { href: '/pipeline',  label: 'Pipeline',     icon: ICONS.pipeline},
    { href: '/meta',      label: 'Meta Ads',     icon: ICONS.meta,    color: 'text-blue-400'    },
    { href: '/calls',     label: 'Call Center',  icon: ICONS.call,    color: 'text-green-400'   },
    { href: '/report',    label: 'Reports',      icon: ICONS.report,  color: 'text-amber-400'   },
    { href: '/employees', label: 'Employees',    icon: ICONS.team,    color: 'text-pink-400'    },
    { href: '/reminders', label: 'Reminders',    icon: ICONS.bell   },
  ],
  Admin: [
    { href: '/dashboard', label: 'Dashboard',    icon: ICONS.home   },
    { href: '/clients',   label: 'Clients',      icon: ICONS.clients, color: 'text-emerald-400' },
    { href: '/social',    label: 'Social Posts', icon: ICONS.social,  color: 'text-pink-400'    },
    { href: '/approvals', label: 'Approvals',    icon: ICONS.approve, color: 'text-amber-400'   },
    { href: '/leads',     label: 'All Leads',    icon: ICONS.leads  },
    { href: '/pipeline',  label: 'Pipeline',     icon: ICONS.pipeline},
    { href: '/import',    label: 'Import Leads', icon: ICONS.import },
    { href: '/meta',      label: 'Meta Ads',     icon: ICONS.meta,    color: 'text-blue-400'    },
    { href: '/calls',     label: 'Call Center',  icon: ICONS.call,    color: 'text-green-400'   },
    { href: '/report',    label: 'Daily Reports',icon: ICONS.report,  color: 'text-amber-400'   },
    { href: '/employees', label: 'Employees',    icon: ICONS.team,    color: 'text-pink-400'    },
    { href: '/reminders', label: 'Reminders',    icon: ICONS.bell   },
  ],
  Manager: [
    { href: '/dashboard', label: 'Dashboard',    icon: ICONS.home   },
    { href: '/clients',   label: 'Clients',      icon: ICONS.clients, color: 'text-emerald-400' },
    { href: '/social',    label: 'Social Posts', icon: ICONS.social,  color: 'text-pink-400'    },
    { href: '/approvals', label: 'Approvals',    icon: ICONS.approve, color: 'text-amber-400'   },
    { href: '/leads',     label: 'All Leads',    icon: ICONS.leads  },
    { href: '/pipeline',  label: 'Pipeline',     icon: ICONS.pipeline},
    { href: '/calls',     label: 'Call Center',  icon: ICONS.call,    color: 'text-green-400'   },
    { href: '/report',    label: 'Team Reports', icon: ICONS.report,  color: 'text-amber-400'   },
    { href: '/employees', label: 'Employees',    icon: ICONS.team,    color: 'text-pink-400'    },
    { href: '/reminders', label: 'Reminders',    icon: ICONS.bell   },
  ],
  Sales: [
    { href: '/leads',     label: 'My Leads',     icon: ICONS.leads  },
    { href: '/pipeline',  label: 'Pipeline',     icon: ICONS.pipeline},
    { href: '/calls',     label: 'Call Center',  icon: ICONS.call,    color: 'text-green-400'   },
    { href: '/report',    label: 'Daily Report', icon: ICONS.report,  color: 'text-amber-400'   },
    { href: '/reminders', label: 'Reminders',    icon: ICONS.bell   },
  ],
  SMM: [
    { href: '/social',    label: 'Content Calendar', icon: ICONS.social,  color: 'text-pink-400' },
    { href: '/approvals', label: 'Approvals',        icon: ICONS.approve, color: 'text-amber-400'},
    { href: '/clients',   label: 'Clients',          icon: ICONS.clients, color: 'text-emerald-400'},
    { href: '/meta',      label: 'Meta Ads',         icon: ICONS.meta,    color: 'text-blue-400' },
    { href: '/leads',     label: 'Leads',            icon: ICONS.leads,   color: 'text-cyan-400' },
    { href: '/report',    label: 'Daily Report',     icon: ICONS.report,  color: 'text-cyan-400' },
  ],
  MetaAdsManager: [
    { href: '/meta',      label: 'Meta Ads',         icon: ICONS.meta,    color: 'text-blue-400'   },
    { href: '/clients',   label: 'Clients',          icon: ICONS.clients, color: 'text-emerald-400'},
    { href: '/leads',     label: 'Leads',            icon: ICONS.leads  },
    { href: '/report',    label: 'Daily Report',     icon: ICONS.report,  color: 'text-amber-400'  },
  ],
  Client: [
    { href: '/client-portal', label: 'My Portal',   icon: ICONS.portal                           },
    { href: '/social',        label: 'My Content',  icon: ICONS.social,  color: 'text-pink-400' },
  ],
  VideoEditor: [
    { href: '/report', label: 'Daily Report', icon: ICONS.report, color: 'text-purple-400' },
  ],
  GraphicDesigner: [
    { href: '/social',  label: 'Content',     icon: ICONS.social,  color: 'text-pink-400'   },
    { href: '/report',  label: 'Daily Report',icon: ICONS.report,  color: 'text-pink-400'   },
  ],
  ContentWriter: [
    { href: '/social',  label: 'Content',     icon: ICONS.social,  color: 'text-green-400'  },
    { href: '/report',  label: 'Daily Report',icon: ICONS.report,  color: 'text-green-400'  },
  ],
  Intern: [
    { href: '/report', label: 'Daily Report', icon: ICONS.report, color: 'text-orange-400' },
  ],
};

export default function Sidebar({ user }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [collapsed, setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  const role    = user?.role || 'Sales';
  const navItems = NAV[role] || NAV.Sales;
  const cfg      = ROLE_CFG[role] || ROLE_CFG.Sales;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`px-4 py-5 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-slate-100 text-sm leading-tight">DotGanga</p>
            <p className="text-muted text-[10px] leading-tight">Command Center</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <a key={item.href} href={item.href}
              onClick={e => { e.preventDefault(); router.push(item.href); setMobileOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                active ? 'bg-primary/15 text-primary-light' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}>
              <svg className={`w-4 h-4 shrink-0 ${active ? 'text-primary-light' : (item.color || 'text-slate-400')}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <div className="ml-auto w-1 h-4 bg-primary rounded-full" />}
            </a>
          );
        })}
      </nav>

      {/* Bottom: user + collapse + logout */}
      <div className="px-2 py-3 border-t border-border space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-50">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${cfg.bg} ${cfg.color}`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-slate-300 hover:bg-surface-50 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
          </svg>
          {!collapsed && 'Collapse'}
        </button>
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-danger hover:bg-danger/5 text-xs transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface-100 border border-border text-slate-300">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-surface-100 border-r border-border" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className={`hidden lg:flex flex-col h-full bg-surface-100 border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
