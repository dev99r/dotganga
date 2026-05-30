import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CheckInPanel from '../components/staff/CheckInPanel';
import EarningsTracker from '../components/staff/EarningsTracker';
import LeaveManager from '../components/staff/LeaveManager';
import DailyReportForm from '../components/staff/DailyReportForm';
import AttendanceHistory from '../components/staff/AttendanceHistory';
import MyTasks from '../components/staff/MyTasks';
import api from '../utils/api';

const TABS = [
  {
    id: 'home', label: 'Home',
    icon: (a) => (
      <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'report', label: 'Report',
    icon: (a) => (
      <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'tasks', label: 'Tasks',
    icon: (a) => (
      <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'earnings', label: 'Earnings',
    icon: (a) => (
      <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'history', label: 'History',
    icon: (a) => (
      <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'leaves', label: 'Leaves',
    icon: (a) => (
      <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function StaffHub() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab]   = useState('home');
  const [company,   setCompany]     = useState(null);
  const [showLogout,setShowLogout]  = useState(false);
  const [sidebarOpen,setSidebarOpen]= useState(false);

  useEffect(() => {
    api.get('/company').then(({ data }) => setCompany(data.company)).catch(() => {});
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const activeTabObj = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-blue-950 min-h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <img src="/logo.svg" alt="DotGanga" className="h-8 w-auto" />
          <p className="text-blue-400 text-[10px] uppercase tracking-widest mt-1.5 font-bold">Staff Portal</p>
        </div>

        {/* User card */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-black text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-black text-white text-sm truncate">{user?.name}</p>
              <p className="text-blue-400 text-xs truncate">{user?.designation}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  active ? 'bg-white text-blue-950' : 'text-blue-300 hover:bg-white/10 hover:text-white'
                }`}>
                <span className={active ? 'text-blue-950' : 'text-blue-400'}>
                  {tab.icon(active)}
                </span>
                {tab.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-950" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <img src="/logo.svg" alt="DotGanga" className="h-7 w-auto" />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-black text-slate-800">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.designation}</p>
              </div>
              <button onClick={() => setShowLogout(true)}
                className="w-9 h-9 rounded-xl bg-blue-950 flex items-center justify-center text-white font-black text-sm">
                {initials}
              </button>
            </div>
          </div>

          {/* Mobile tab bar */}
          <div className="flex border-t border-slate-100 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[60px] flex flex-col items-center py-2.5 gap-0.5 transition-colors relative ${
                    active ? 'text-blue-900' : 'text-slate-400'
                  }`}>
                  <span className={active ? 'text-blue-900' : 'text-slate-400'}>{tab.icon(active)}</span>
                  <span className={`text-[9px] font-black ${active ? 'text-blue-900' : 'text-slate-400'}`}>{tab.label}</span>
                  {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-900 rounded-full" />}
                </button>
              );
            })}
          </div>
        </header>

        {/* Desktop page header */}
        <div className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Portal</p>
            <h1 className="font-black text-slate-900 text-xl">{activeTabObj?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-black text-slate-800 text-sm">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.department} · {user?.designation}</p>
            </div>
            <button onClick={() => setShowLogout(true)}
              className="w-10 h-10 rounded-2xl bg-blue-950 flex items-center justify-center text-white font-black">
              {initials}
            </button>
          </div>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full">
            {activeTab === 'home'     && <CheckInPanel company={company} />}
            {activeTab === 'report'   && <DailyReportForm />}
            {activeTab === 'tasks'    && <MyTasks />}
            {activeTab === 'earnings' && <EarningsTracker />}
            {activeTab === 'history'  && <AttendanceHistory />}
            {activeTab === 'leaves'   && <LeaveManager />}
          </div>
        </main>
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-up shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-950 flex items-center justify-center text-white font-black text-lg">
                {initials}
              </div>
              <div>
                <p className="font-black text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-5">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 btn-secondary py-3">Cancel</button>
              <button onClick={logout} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 active:scale-95 transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
