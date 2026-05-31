'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult, handleActionErrors } from '@/lib/actions';
import { createLessonItemAction } from '@/actions/v1/lesson-items/create-lesson-item';
import { updateLessonItemAction } from '@/actions/v1/lesson-items/update-lesson-item';
import { getBunnyTusUploadAction } from '@/actions/v1/bunny/get-tus-upload';
import DocumentUploader, { type DocumentValue } from './DocumentUploader';
import VideoUploader from './VideoUploader';
import { useUploadManager } from './UploadManagerProvider';
import type { LessonItemTree, LessonItemType } from '@/types/course-management';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  courseId: number;
  lessonId: number;
  initialData?: LessonItemTree;
}

export default function LessonItemFormModal({
  open,
  onOpenChange,
  mode,
  courseId,
  lessonId,
  initialData,
}: Props) {
  const router = useRouter();
  const { enqueue } = useUploadManager();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonItemType>('VIDEO');
  const [document, setDocument] = useState<DocumentValue | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasExistingVideo = mode === 'edit' && !!initialData?.bunnyVideoId;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? '');
    setType(initialData?.type ?? 'VIDEO');
    setDocument(
      initialData?.fileUrl
        ? {
            url: initialData.fileUrl,
            storageKey: initialData.fileStorageKey ?? undefined,
            fileName: initialData.fileName ?? undefined,
            fileSize: initialData.fileSize ?? undefined,
            mimeType: initialData.mimeType ?? undefined,
          }
        : null,
    );
    setVideoFile(null);
    setSubmitted(false);
  }, [open, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const titleError = submitted && !title.trim() ? 'Vui lòng nhập tên mục' : '';
  const docError =
    submitted && type === 'DOCUMENT' && !document?.url ? 'Vui lòng tải lên tài liệu' : '';
  // Video bắt buộc khi tạo mới; khi edit nếu đã có video thì không bắt buộc chọn lại.
  const videoError =
    submitted && type === 'VIDEO' && !videoFile && !hasExistingVideo
      ? 'Vui lòng chọn video bài giảng'
      : '';

  const close = () => {
    onOpenChange(false);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!title.trim()) return;
    if (type === 'DOCUMENT' && !document?.url) return;
    if (type === 'VIDEO' && !videoFile && !hasExistingVideo) return;

    setLoading(true);
    try {
      if (type === 'DOCUMENT') {
        const payload = {
          title: title.trim(),
          type: 'DOCUMENT' as const,
          fileUrl: document?.url,
          fileStorageKey: document?.storageKey,
          fileName: document?.fileName,
          fileSize: document?.fileSize,
          mimeType: document?.mimeType,
        };
        const res =
          mode === 'create'
            ? await createLessonItemAction(lessonId, courseId, payload)
            : await updateLessonItemAction(initialData!.id, courseId, payload);
        handleActionResult(
          res.errors,
          close,
          mode === 'create' ? 'Tạo mục bài học thành công' : 'Cập nhật thành công',
        );
        return;
      }

      // ===== VIDEO =====
      // Trường hợp edit chỉ đổi tiêu đề (không chọn video mới)
      if (!videoFile) {
        const res = await updateLessonItemAction(initialData!.id, courseId, {
          title: title.trim(),
        });
        handleActionResult(res.errors, close, 'Cập nhật thành công');
        return;
      }

      // Chọn video mới → tạo phiên TUS, lưu item (status UPLOADING), enqueue upload nền
      const tus = await getBunnyTusUploadAction({ title: title.trim() });
      if (tus.errors.length || !tus.data) {
        handleActionErrors(tus.errors.length ? tus.errors : ['Không tạo được phiên upload']);
        return;
      }
      const { videoId, libraryId, signature, expire, tusEndpoint } = tus.data;

      let lessonItemId: number;
      if (mode === 'create') {
        const res = await createLessonItemAction(lessonId, courseId, {
          title: title.trim(),
          type: 'VIDEO',
          bunnyVideoId: videoId,
          bunnyLibraryId: libraryId,
        });
        if (res.errors.length || !res.data) {
          handleActionErrors(res.errors.length ? res.errors : ['Tạo mục bài học thất bại']);
          return;
        }
        lessonItemId = res.data.id;
      } else {
        const res = await updateLessonItemAction(initialData!.id, courseId, {
          title: title.trim(),
          bunnyVideoId: videoId,
          bunnyLibraryId: libraryId,
        });
        if (res.errors.length) {
          handleActionErrors(res.errors);
          return;
        }
        lessonItemId = initialData!.id;
      }

      enqueue(videoFile, {
        lessonItemId,
        courseId,
        videoId,
        libraryId,
        signature,
        expire,
        tusEndpoint,
      });
      close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tạo mục bài học' : 'Chỉnh sửa mục bài học'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Thêm nội dung mới vào bài học.'
              : 'Cập nhật nội dung mục bài học.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-title">
              Tên mục <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item-title"
              placeholder="VD: Video bài giảng"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!titleError}
            />
            {titleError && <p className="text-destructive text-xs">{titleError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Loại nội dung</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as LessonItemType)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="DOCUMENT">Tài liệu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'VIDEO' ? (
            <div className="space-y-1.5">
              <Label>
                Video bài giảng {!hasExistingVideo && <span className="text-destructive">*</span>}
              </Label>
              <VideoUploader
                file={videoFile}
                onFileChange={setVideoFile}
                disabled={loading}
                existingStatus={hasExistingVideo ? initialData!.bunnyStatus : null}
              />
              {videoError && <p className="text-destructive text-xs">{videoError}</p>}
              <p className="text-muted-foreground text-xs">
                Sau khi lưu, video tải lên nền (xem ở khay góc phải). Thời lượng tự cập nhật khi xử
                lý xong.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>
                Tài liệu <span className="text-destructive">*</span>
              </Label>
              <DocumentUploader value={document} onChange={setDocument} disabled={loading} />
              {docError && <p className="text-destructive text-xs">{docError}</p>}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <ActionButton
              type="submit"
              isLoading={loading}
              loadingText="Đang lưu..."
              className="cursor-pointer"
            >
              {mode === 'create' ? 'Tạo mục' : 'Lưu thay đổi'}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
