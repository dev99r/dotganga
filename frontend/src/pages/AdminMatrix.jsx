import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OperationalDeck       from '../components/admin/OperationalDeck';
import ShiftConfig           from '../components/admin/ShiftConfig';
import StaffManagement       from '../components/admin/StaffManagement';
import PayrollMatrix         from '../components/admin/PayrollMatrix';
import DailyReportsView      from '../components/admin/DailyReportsView';
import MonthlyAttendanceGrid from '../components/admin/MonthlyAttendanceGrid';
import TaskBoard             from '../components/admin/TaskBoard';
import LeadsView             from '../components/admin/LeadsView';
import UserManagement        from '../components/admin/UserManagement';
import ClientsManagement     from '../components/admin/ClientsManagement';
import SocialMediaManager    from '../components/admin/SocialMediaManager';
import MetaAdsView           from '../components/admin/MetaAdsView';
import ApprovalsView         from '../components/admin/ApprovalsView';
import MediaLibraryView      from '../components/admin/MediaLibraryView';
import NotificationsBell     from '../components/shared/NotificationsBell';

const NAV_FULL = [
  { id:'dashboard',  label:'Dashboard',     short:'Home',    icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', group:'hr' },
  { id:'attendance', label:'30-Day Grid',   short:'Grid',    icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', group:'hr' },
  { id:'staff',      label:'Staff',         short:'Staff',   icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', group:'hr' },
  { id:'payroll',    label:'Payroll',       short:'Pay',     icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', group:'hr' },
  { id:'reports',    label:'Daily Reports', short:'Reports', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', group:'hr' },
  { id:'tasks',      label:'Task Board',    short:'Tasks',   icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', group:'hr' },
  { id:'leads',      label:'Leads CRM',     short:'Leads',   icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge:'CRM', group:'agency' },
  { id:'clients',    label:'Clients',       short:'Clients', icon:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', badge:'NEW', group:'agency' },
  { id:'social',     label:'Social Media',  short:'Social',  icon:'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', badge:'NEW', group:'agency' },
  { id:'metaads',    label:'Meta Ads',      short:'Ads',     icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', badge:'NEW', group:'agency' },
  { id:'approvals',  label:'Approvals',     short:'OK',      icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', badge:'NEW', group:'agency' },
  { id:'media',      label:'Media Library', short:'Media',   icon:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', badge:'NEW', group:'agency' },
  { id:'users',      label:'Users',         short:'Users',   icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', group:'admin' },
  { id:'settings',   label:'Settings',      short:'Config',  icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z', group:'admin' },
];

const ROLE_NAV = {
  'Super Admin': NAV_FULL.map(n => n.id),
  'Admin':       NAV_FULL.map(n => n.id),
  'Manager':     ['dashboard','attendance','staff','reports','tasks','leads','clients','social','approvals','media'],
  'SMM':         ['social','approvals','media','clients'],
  'Meta Ads Manager': ['metaads','clients'],
};

// Bottom-bar quick-access tabs per role (max 4; "More" is always 5th)
const QUICK_TABS = {
  'Super Admin':       ['dashboard','social','clients','leads'],
  'Admin':             ['dashboard','social','clients','leads'],
  'Manager':           ['dashboard','reports','tasks','clients'],
  'SMM':               ['social','approvals','clients','media'],
  'Meta Ads Manager':  ['metaads','clients'],
};

const TITLES = {
  dashboard:'Operational Dashboard', attendance:'30-Day Attendance Grid', staff:'Staff Management',
  payroll:'Payroll Matrix', reports:'Daily Reports', tasks:'Task Board',
  leads:'Leads CRM', clients:'Clients', social:'Social Media Manager',
  metaads:'Meta Ads', approvals:'Approvals', media:'Media Library',
  users:'User Management', settings:'Office Configuration',
};

const GROUP_LABELS = { hr:'HR & Attendance', agency:'Agency', admin:'Admin' };
const GROUP_ORDER  = ['hr','agency','admin'];
const BADGE_COLOR  = { CRM:'bg-emerald-500', NEW:'bg-blue-500' };

export default function AdminMatrix() {
  const { user, logout } = useAuth();
  const [activeNav,   setActiveNav]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allowed     = ROLE_NAV[user?.role] || ROLE_NAV['Manager'];
  const visibleNav  = NAV_FULL.filter(n => allowed.includes(n.id));
  const quickTabIds = QUICK_TABS[user?.role] || QUICK_TABS['Manager'];
  const quickTabs   = quickTabIds.map(id => NAV_FULL.find(n => n.id === id)).filter(Boolean);
  const initials    = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'A';
  const fullHeight  = ['tasks','leads','social','approvals','media'].includes(activeNav);

  const grouped = GROUP_ORDER
    .map(g => ({ group: g, items: visibleNav.filter(n => n.group === g) }))
    .filter(g => g.items.length > 0);

  const navigate = (id) => { setActiveNav(id); setSidebarOpen(false); };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 bg-blue-950 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 shrink-0">
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-center">
            <img src="/logo.svg" alt="DotGanga" className="h-8 w-auto" />
          </div>
          <p className="text-blue-300/60 text-[10px] text-center mt-2 uppercase tracking-widest">
            {user?.role === 'Manager' ? 'Manager Console'
              : user?.role === 'SMM' ? 'Social Media'
              : user?.role === 'Meta Ads Manager' ? 'Meta Ads'
              : 'Admin Console'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-2 overflow-y-auto space-y-4">
          {grouped.map(({ group, items }) => (
            <div key={group}>
              <p className="text-blue-400/60 text-xs font-black uppercase tracking-wider px-2 mb-2">
                {GROUP_LABELS[group]}
              </p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = activeNav === item.id;
                  return (
                    <button key={item.id} onClick={() => navigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all leading-none ${
                        active ? 'bg-white/15 text-white' : 'text-blue-300 hover:bg-white/5 hover:text-white'
                      }`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="truncate">{item.label}</span>
                      {item.badge && !active && (
                        <span className={`ml-auto text-[10px] font-black ${BADGE_COLOR[item.badge]||'bg-emerald-500'} text-white px-1.5 py-0.5 rounded-full shrink-0`}>
                          {item.badge}
                        </span>
                      )}
                      {active && <div className="ml-auto w-1 h-4 bg-white rounded-full shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-xs font-black shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-blue-400 text-[10px]">{user?.role}</p>
            </div>
            <button onClick={logout} title="Sign out"
              className="p-1.5 rounded-lg text-blue-400 hover:text-red-400 hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-10 shadow-sm shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-black text-slate-900 text-lg truncate leading-tight">{TITLES[activeNav]}</h1>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>

          <NotificationsBell />
          <img src="/logo.svg" alt="DotGanga" className="lg:hidden h-6 w-auto ml-1" />
        </header>

        {/* Content — pb-16 on mobile so bottom nav never covers content */}
        <main className={`flex-1 min-h-0 pb-16 lg:pb-0 ${
          fullHeight
            ? 'overflow-hidden flex flex-col'
            : 'overflow-y-auto p-4 lg:p-8'
        }`}>
          {activeNav === 'tasks'     ? <TaskBoard />            :
           activeNav === 'leads'     ? <LeadsView />            :
           activeNav === 'social'    ? <SocialMediaManager />   :
           activeNav === 'approvals' ? <ApprovalsView />        :
           activeNav === 'media'     ? <MediaLibraryView />     :
           (
            <div className="max-w-6xl mx-auto">
              {activeNav === 'dashboard'  && <OperationalDeck />}
              {activeNav === 'reports'    && <DailyReportsView />}
              {activeNav === 'attendance' && <MonthlyAttendanceGrid />}
              {activeNav === 'staff'      && <StaffManagement />}
              {activeNav === 'payroll'    && <PayrollMatrix />}
              {activeNav === 'settings'   && <ShiftConfig />}
              {activeNav === 'clients'    && <ClientsManagement />}
              {activeNav === 'metaads'    && <MetaAdsView />}
              {activeNav === 'users'      && <UserManagement />}
            </div>
          )}
        </main>

        {/* ── Mobile bottom tab bar ── */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch">
            {quickTabs.map(item => {
              const active = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => navigate(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 min-w-0 ${
                    active ? 'text-blue-950' : 'text-slate-400'
                  }`}>
                  <div className={`w-9 h-7 flex items-center justify-center rounded-xl transition-all ${
                    active ? 'bg-blue-950/10' : ''
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 1.5} d={item.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold truncate max-w-full px-1 ${active ? 'text-blue-950' : 'text-slate-400'}`}>
                    {item.short}
                  </span>
                </button>
              );
            })}

            {/* More — opens full sidebar */}
            <button onClick={() => setSidebarOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 min-w-0 text-slate-400">
              <div className="w-9 h-7 flex items-center justify-center rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <span className="text-xs font-bold">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
