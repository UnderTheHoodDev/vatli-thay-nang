import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/server/session';
import ProfilePageContent from '@/components/features/profile/ProfilePageContent';

export default async function DashboardProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');

  return <ProfilePageContent session={session} />;
}
