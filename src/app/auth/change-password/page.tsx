import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import ChangePasswordForm from '@/components/features/auth/ChangePasswordForm';

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');

  return <ChangePasswordForm isInitialSetup={!session.hasPassword} role={session.role} />;
}
