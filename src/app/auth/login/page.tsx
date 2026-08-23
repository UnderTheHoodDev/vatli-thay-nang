import { redirect } from 'next/navigation';
import AuthSplitLayout from '@/components/features/auth/AuthSplitLayout';
import LoginForm from '@/components/features/auth/LoginForm';
import { getCurrentSession } from '@/lib/server/session';
import { roleHomePath } from '@/lib/auth/routes';

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect(roleHomePath(session.role));
  }

  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}
