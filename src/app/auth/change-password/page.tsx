import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import AuthSplitLayout from '@/components/features/auth/AuthSplitLayout';
import ChangePasswordForm from '@/components/features/auth/ChangePasswordForm';

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');
  if (session.hasPassword) {
    redirect(session.role !== 'STUDENT' ? '/admin/profile' : '/dashboard/profile');
  }

  return (
    <AuthSplitLayout>
      <ChangePasswordForm role={session.role} />
    </AuthSplitLayout>
  );
}
