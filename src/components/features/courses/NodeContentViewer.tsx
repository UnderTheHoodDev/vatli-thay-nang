'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoPlayer from './VideoPlayer';
import DocumentViewer from './DocumentViewer';
import type { CourseNodeTree } from '@/types/course-management';

interface Props {
  node: CourseNodeTree;
  /** false = admin preview (không tracking, phát từ đầu). Mặc định true. */
  track?: boolean;
}

/**
 * Hiển thị nội dung 1 tệp (video bunny hoặc tài liệu R2). Dùng chung giữa màn học
 * của học sinh (track=true) và modal xem trước của admin (track=false).
 * KHÔNG xử lý trạng thái khóa/empty — nơi gọi tự bọc ngoài.
 */
export default function NodeContentViewer({ node, track = true }: Props) {
  const router = useRouter();

  if (node.fileKind === 'VIDEO') {
    // Video chưa xử lý xong → banner + refresh thủ công.
    if (node.bunnyStatus !== 'FINISHED' || !node.videoUrl) {
      const isError = node.bunnyStatus === 'ERROR';
      return (
        <div className="bg-muted flex min-h-[45vh] flex-col items-center justify-center gap-3 rounded-lg text-center">
          <Video className="text-muted-foreground size-10" />
          <div>
            <p className="text-foreground text-sm font-medium">
              {isError ? 'Video xử lý lỗi' : 'Video đang được xử lý'}
            </p>
            <p className="text-muted-foreground text-sm">
              {isError ? 'Vui lòng liên hệ giáo viên.' : 'Quay lại sau ít phút hoặc bấm làm mới.'}
            </p>
          </div>
          {!isError && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => router.refresh()}
            >
              <RefreshCw /> Làm mới
            </Button>
          )}
        </div>
      );
    }
    return (
      <VideoPlayer
        key={node.id}
        nodeId={node.id}
        videoUrl={node.videoUrl}
        durationSeconds={node.durationSeconds}
        bunnyStatus={node.bunnyStatus}
        title={node.title}
        track={track}
      />
    );
  }

  // DOCUMENT
  return (
    <DocumentViewer
      key={node.id}
      fileUrl={node.fileUrl}
      fileName={node.fileName}
      mimeType={node.mimeType}
      fileSize={node.fileSize}
      title={node.title}
    />
  );
}
