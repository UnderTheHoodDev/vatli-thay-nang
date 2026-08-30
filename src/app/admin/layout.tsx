import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AppSidebar, { ADMIN_NAV, TEACHING_ASSISTANT_NAV } from '@/components/app/AppSidebar';
import AppTopbar from '@/components/app/AppTopbar';
import { RoleProvider } from '@/components/app/RoleProvider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (!session.hasPassword) redirect('/auth/change-password');
  if (session.role === 'STUDENT') redirect('/dashboard');

  const navItems = session.role === 'ADMIN' ? ADMIN_NAV : TEACHING_ASSISTANT_NAV;

  return (
    <RoleProvider role={session.role}>
      <div className="font-opensans bg-muted/40 min-h-svh">
        <SidebarProvider defaultOpen>
          <AppSidebar title="Lớp học Vật Lí Thầy Năng" items={navItems} />
          <SidebarInset className="bg-muted/40 min-w-0">
            <AppTopbar email={session.email} role={session.role} />
            <main className="min-w-0 flex-1 px-4 pt-3 pb-4 md:px-6 md:pt-4 md:pb-6 lg:px-8 lg:pt-5 lg:pb-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </RoleProvider>
  );
}
