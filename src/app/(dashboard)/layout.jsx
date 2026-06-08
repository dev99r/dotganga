import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen bg-surface-300 overflow-hidden">
      <Sidebar user={session} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
