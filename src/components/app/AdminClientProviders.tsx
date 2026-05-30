'use client';

import UploadManagerProvider from '@/components/features/courses/UploadManagerProvider';
import UploadTray from '@/components/features/courses/UploadTray';

/** Provider client cho khu vực /admin/* — quản lý upload video nền + khay nổi. */
export default function AdminClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UploadManagerProvider>
      {children}
      <UploadTray />
    </UploadManagerProvider>
  );
}
