import { redirect } from 'next/navigation';
import LoginForm from '@/components/features/auth/LoginForm';
import { getCurrentSession } from '@/lib/server/session';

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect(session.role === 'ADMIN' ? '/admin/accounts' : '/dashboard');
  }
  return <LoginForm />;
}
