import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AppSidebar, { ADMIN_NAV } from '@/components/app/AppSidebar';
import AppTopbar from '@/components/app/AppTopbar';
import AdminClientProviders from '@/components/app/AdminClientProviders';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (!session.hasPassword) redirect('/auth/change-password');
  if (session.role !== 'ADMIN') redirect('/dashboard');

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <div className="font-opensans bg-muted/40 min-h-svh">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar title="VLTN Admin" items={ADMIN_NAV} />
        <SidebarInset className="min-w-0 bg-muted/40">
          <AppTopbar email={session.email} role={session.role} />
          <main className="min-w-0 flex-1 px-4 pt-3 pb-4 md:px-6 md:pt-4 md:pb-6 lg:px-8 lg:pt-5 lg:pb-8">
            <AdminClientProviders>{children}</AdminClientProviders>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
