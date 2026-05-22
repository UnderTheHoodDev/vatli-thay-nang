import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageHeader from '@/components/app/PageHeader';
import ProfileInfoSection from './ProfileInfoSection';
import ChangePasswordSection from './ChangePasswordSection';
import { ROLE_OPTIONS } from '@/lib/constants';
import type { IUserProfile } from '@/types/actions/profile';
import type { Province } from '@/types/auth';

interface Props {
  profile: IUserProfile;
  provinces: Province[];
}

export default function ProfilePageClient({ profile, provinces }: Props) {
  const initial = (profile.fullName?.charAt(0) || profile.email.charAt(0)).toUpperCase();
  const roleLabel = ROLE_OPTIONS.find((o) => o.value === profile.role)?.label ?? profile.role;
  const isAdmin = profile.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông tin cá nhân"
        description="Quản lý thông tin tài khoản và bảo mật của bạn."
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground truncate text-lg font-semibold">
                {profile.fullName || 'Chưa cập nhật họ tên'}
              </h2>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-3" /> {roleLabel}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3" /> {roleLabel}
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
              <Mail className="size-3.5" />
              {profile.email}
            </p>
          </div>
        </CardContent>
      </Card>

      <ProfileInfoSection profile={profile} provinces={provinces} />
      <ChangePasswordSection role={profile.role} />
    </div>
  );
}
