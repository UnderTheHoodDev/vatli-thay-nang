import { redirect } from 'next/navigation';
import { getProfileAction } from '@/actions/v1/profile/get-profile';
import { listProvinces } from '@/actions/v1/provinces';
import ProfilePageClient from '@/components/features/profile/ProfilePageClient';

export default async function DashboardProfilePage() {
  const [profile, provinces] = await Promise.all([
    getProfileAction(),
    listProvinces(),
  ]);

  if (!profile) redirect('/auth/login');

  return <ProfilePageClient profile={profile} provinces={provinces} />;
}
