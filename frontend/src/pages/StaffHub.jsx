import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CheckInPanel from '../components/staff/CheckInPanel';
import EarningsTracker from '../components/staff/EarningsTracker';
import LeaveManager from '../components/staff/LeaveManager';
import DailyReportForm from '../components/staff/DailyReportForm';
import AttendanceHistory from '../components/staff/AttendanceHistory';
import api from '../utils/api';

const TABS = [
  {
    id: 'home', label: 'Home',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-900' : 'text-slate-400'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'report', label: 'Report',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-900' : 'text-slate-400'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'earnings', label: 'Earnings',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-900' : 'text-slate-400'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'history', label: 'History',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-900' : 'text-slate-400'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'leaves', label: 'Leaves',
    icon: (a) => (
      <svg className={`w-5 h-5 ${a ? 'text-blue-900' : 'text-slate-400'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function StaffHub() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [company, setCompany] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    api.get('/company').then(({ data }) => setCompany(data.company)).catch(() => {});
  }, []);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ maxWidth: '480px', margin: '0 auto' }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <img src="/logo.svg" alt="DotGanga" className="h-7 w-auto" />

          {/* User info + logout */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400">{user?.designation || 'Staff'}</p>
            </div>
            <button onClick={() => setShowLogout(true)}
              className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-bold text-sm shrink-0 hover:bg-blue-800 transition-colors"
              title="Sign out">
              {initials}
            </button>
            <button onClick={() => setShowLogout(true)}
              className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors shrink-0"
              title="Sign out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab bar inside header for clean look */}
        <div className="flex border-t border-slate-100">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors relative ${
                  active ? 'text-blue-900' : 'text-slate-400'
                }`}
              >
                {tab.icon(active)}
                <span className={`text-[10px] font-bold ${active ? 'text-blue-900' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto p-4 pb-6">
        {activeTab === 'home'     && <CheckInPanel company={company} />}
        {activeTab === 'report'   && <DailyReportForm />}
        {activeTab === 'earnings' && <EarningsTracker />}
        {activeTab === 'history'  && <AttendanceHistory />}
        {activeTab === 'leaves'   && <LeaveManager />}
      </main>

      {/* Logout confirm */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full animate-slide-up shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center text-white font-black">
                {initials}
              </div>
              <div>
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-5">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 btn-secondary py-3">Cancel</button>
              <button onClick={logout} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 active:scale-95 transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
