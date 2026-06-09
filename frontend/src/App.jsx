import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login        from './pages/Login';
import StaffHub     from './pages/StaffHub';
import AdminMatrix  from './pages/AdminMatrix';
import ClientPortal from './pages/ClientPortal';

const ADMIN_ROLES  = ['Super Admin', 'Admin', 'Manager', 'SMM', 'Meta Ads Manager'];
const STAFF_ROLES  = ['Staff'];
const CLIENT_ROLES = ['Client'];

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (CLIENT_ROLES.includes(user.role)) {
    return (
      <Routes>
        <Route path="/my-portal" element={<ClientPortal />} />
        <Route path="*"          element={<Navigate to="/my-portal" replace />} />
      </Routes>
    );
  }

  if (ADMIN_ROLES.includes(user.role)) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminMatrix />} />
        <Route path="*"        element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/staff/*" element={<StaffHub />} />
      <Route path="*"        element={<Navigate to="/staff" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
