import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AppSidebar, { ADMIN_NAV } from '@/components/app/AppSidebar';
import AppTopbar from '@/components/app/AppTopbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (!session.hasChangedPassword) redirect('/auth/change-password');
  if (session.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="flex min-h-screen bg-light-bg">
      <AppSidebar title="VLTN Admin" items={ADMIN_NAV} />
      <div className="flex flex-1 flex-col">
        <AppTopbar email={session.email} role={session.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
