'use client';

import UploadManagerProvider from '@/components/features/courses/UploadManagerProvider';
import UploadTray from '@/components/features/courses/UploadTray';

/**
 * Provider client cho toàn app (đặt ở root layout) → upload video/tài liệu chạy nền
 * sống xuyên MỌI điều hướng client-side, kể cả khi rời khỏi /admin. Chỉ reload cả
 * trang / đóng tab mới mất. Khay `UploadTray` tự ẩn khi không có task.
 */
export default function UploadProviders({ children }: { children: React.ReactNode }) {
  return (
    <UploadManagerProvider>
      {children}
      <UploadTray />
    </UploadManagerProvider>
  );
}
