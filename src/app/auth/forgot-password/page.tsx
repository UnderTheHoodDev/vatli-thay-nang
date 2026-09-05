import AuthSplitLayout from '@/components/features/auth/AuthSplitLayout';
import ForgotPasswordForm from '@/components/features/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
