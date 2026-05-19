import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import ChangePasswordForm from '@/components/features/auth/ChangePasswordForm';

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (session.hasPassword) {
    redirect(session.role === 'ADMIN' ? '/admin/profile' : '/dashboard/profile');
  }

  return <ChangePasswordForm role={session.role} />;
}
