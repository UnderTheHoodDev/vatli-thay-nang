import ProfileInfoSection from './ProfileInfoSection';
import ChangePasswordSection from './ChangePasswordSection';
import type { IUserProfile } from '@/types/actions/profile';
import type { Province } from '@/types/auth';

interface Props {
  profile: IUserProfile;
  provinces: Province[];
}

export default function ProfilePageClient({ profile, provinces }: Props) {
  return (
    <div className="space-y-6">
      <ProfileInfoSection profile={profile} provinces={provinces} />
      <ChangePasswordSection role={profile.role} />
    </div>
  );
}
