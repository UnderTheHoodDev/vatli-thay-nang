import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AppSidebar, { DASHBOARD_NAV } from '@/components/app/AppSidebar';
import AppTopbar from '@/components/app/AppTopbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (!session.hasChangedPassword) redirect('/auth/change-password');

  return (
    <div className="bg-light-bg flex min-h-screen">
      <AppSidebar title="VLTN" items={DASHBOARD_NAV} />
      <div className="flex flex-1 flex-col">
        <AppTopbar email={session.email} role={session.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
