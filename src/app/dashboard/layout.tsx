import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AppSidebar, { DASHBOARD_NAV } from '@/components/app/AppSidebar';
import AppTopbar from '@/components/app/AppTopbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const ADMIN_HOME = '/admin/users';
const STUDENT_HOME = '/dashboard';

function homeForRole(role: string): string {
  return role === 'ADMIN' ? ADMIN_HOME : STUDENT_HOME;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (!session.hasChangedPassword) redirect('/auth/change-password');
  if (session.role !== 'STUDENT') redirect(homeForRole(session.role));

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <div className="font-opensans bg-light-bg">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar title="VLTN" items={DASHBOARD_NAV} userEmail={session.email} />
        <SidebarInset>
          <AppTopbar email={session.email} role={session.role} />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
