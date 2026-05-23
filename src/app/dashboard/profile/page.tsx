import { redirect } from 'next/navigation';
import { getProfileAction } from '@/actions/v1/profile/get-profile';
import { listProvinces } from '@/actions/v1/provinces';
import { getCurrentSession } from '@/lib/server/session';
import ProfilePageClient from '@/components/features/profile/ProfilePageClient';
import type { IUserProfile } from '@/types/actions/profile';

export default async function DashboardProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect('/auth/login');

  const [profile, provinces] = await Promise.all([getProfileAction(), listProvinces()]);

  const resolvedProfile: IUserProfile = profile ?? {
    id: session.userId,
    email: session.email,
    fullName: session.fullName ?? null,
    gender: null,
    provinceId: null,
    province: null,
    schoolName: null,
    parentPhonenumber: null,
    facebookLink: null,
    role: session.role,
    status: 'ACTIVATED',
  };

  return <ProfilePageClient profile={resolvedProfile} provinces={provinces} />;
}
