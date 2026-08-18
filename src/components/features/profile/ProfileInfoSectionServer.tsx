import { getProfileAction } from '@/actions/v1/profile/get-profile';
import { listProvinces } from '@/actions/v1/provinces';
import ProfileHeaderCard from '@/components/features/profile/ProfileHeaderCard';
import ProfileInfoSection from '@/components/features/profile/ProfileInfoSection';
import type { SessionInfo } from '@/types/auth';
import type { IUserProfile } from '@/types/actions/profile';

export default async function ProfileInfoSectionServer({ session }: { session: SessionInfo }) {
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

  return (
    <>
      <ProfileHeaderCard profile={resolvedProfile} />
      <ProfileInfoSection profile={resolvedProfile} provinces={provinces} />
    </>
  );
}
