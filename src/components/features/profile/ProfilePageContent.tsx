import { Suspense } from 'react';
import PageHeader from '@/components/app/PageHeader';
import ProfileInfoSectionServer from '@/components/features/profile/ProfileInfoSectionServer';
import ProfileSkeleton from '@/components/features/profile/ProfileSkeleton';
import ChangePasswordSection from '@/components/features/profile/ChangePasswordSection';
import type { SessionInfo } from '@/types/auth';

/** Nội dung chung cho /admin/profile và /dashboard/profile — chỉ khác nhau ở
 * layout bọc ngoài (admin/dashboard shell), nên gộp về đây thay vì 2 bản y hệt. */
export default function ProfilePageContent({ session }: { session: SessionInfo }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Thông tin cá nhân"
        description="Quản lý thông tin tài khoản và bảo mật của bạn."
      />

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileInfoSectionServer session={session} />
      </Suspense>

      <ChangePasswordSection role={session.role} />
    </div>
  );
}
