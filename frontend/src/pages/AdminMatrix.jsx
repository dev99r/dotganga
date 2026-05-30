import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OperationalDeck from '../components/admin/OperationalDeck';
import ShiftConfig from '../components/admin/ShiftConfig';
import StaffManagement from '../components/admin/StaffManagement';
import PayrollMatrix from '../components/admin/PayrollMatrix';
import DailyReportsView from '../components/admin/DailyReportsView';
import MonthlyAttendanceGrid from '../components/admin/MonthlyAttendanceGrid';
import TaskBoard from '../components/admin/TaskBoard';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    icon: `M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6` },
  { id: 'reports',    label: 'Daily Reports', icon: `M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4` },
  { id: 'tasks',      label: 'Task Board',    icon: `M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2` },
  { id: 'attendance', label: '30-Day Grid',   icon: `M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z` },
  { id: 'staff',      label: 'Staff',         icon: `M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z` },
  { id: 'payroll',    label: 'Payroll',       icon: `M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z` },
  { id: 'settings',   label: 'Settings',      icon: `M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z` },
];

const TITLES = { dashboard: 'Operational Dashboard', reports: 'Daily Reports', tasks: 'Task Board', attendance: '30-Day Attendance Grid', staff: 'Staff Management', payroll: 'Payroll Matrix', settings: 'Office Configuration' };

export default function AdminMatrix() {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials   = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  const isManager  = user?.role === 'Manager';
  // Managers see Dashboard, Reports, 30-Day Grid, Staff — not Payroll or Settings
  const visibleNav = isManager ? NAV.filter(n => ['dashboard','reports','tasks','attendance','staff'].includes(n.id)) : NAV;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 bg-blue-950 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5">
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-center">
            <img src="/logo.svg" alt="DotGanga" className="h-8 w-auto" />
          </div>
          <p className="text-blue-300/60 text-[10px] text-center mt-2 uppercase tracking-widest">
            {isManager ? 'Manager Console' : 'Admin Console'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {visibleNav.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? 'bg-white/15 text-white' : 'text-blue-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="w-4.5 h-4.5 shrink-0" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
                {active && <div className="ml-auto w-1 h-4 bg-white rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-xs font-black">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-blue-400 text-[10px]">{user?.role === 'Manager' ? 'Manager' : 'Administrator'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-blue-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-base">{TITLES[activeNav]}</h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Mobile logo */}
          <img src="/logo.svg" alt="DotGanga" className="lg:hidden h-6 w-auto" />
        </header>

        <main className={`flex-1 min-h-0 ${activeNav === 'tasks' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-4 lg:p-8'}`}>
          {activeNav === 'tasks' ? (
            <TaskBoard />
          ) : (
            <div className="max-w-6xl mx-auto">
              {activeNav === 'dashboard'  && <OperationalDeck />}
              {activeNav === 'reports'    && <DailyReportsView />}
              {activeNav === 'attendance' && <MonthlyAttendanceGrid />}
              {activeNav === 'staff'      && <StaffManagement />}
              {activeNav === 'payroll'    && <PayrollMatrix />}
              {activeNav === 'settings'   && <ShiftConfig />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
