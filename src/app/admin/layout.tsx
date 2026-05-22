import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AppSidebar, { ADMIN_NAV } from '@/components/app/AppSidebar';
import AppTopbar from '@/components/app/AppTopbar';
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
        <AppSidebar title="VLTN Admin" items={ADMIN_NAV} userEmail={session.email} />
        <SidebarInset className="bg-muted/40">
          <AppTopbar email={session.email} role={session.role} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
