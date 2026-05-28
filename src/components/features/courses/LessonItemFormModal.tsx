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
import { handleActionResult } from '@/lib/actions';
import { createLessonItemAction } from '@/actions/v1/lesson-items/create-lesson-item';
import { updateLessonItemAction } from '@/actions/v1/lesson-items/update-lesson-item';
import DocumentUploader, { type DocumentValue } from './DocumentUploader';
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
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonItemType>('VIDEO');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [document, setDocument] = useState<DocumentValue | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? '');
    setType(initialData?.type ?? 'VIDEO');
    setVideoUrl(initialData?.videoUrl ?? '');
    setDurationSeconds(
      initialData?.durationSeconds != null ? String(initialData.durationSeconds) : '',
    );
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
    setSubmitted(false);
  }, [open, initialData]);

  const titleError = submitted && !title.trim() ? 'Vui lòng nhập tên mục' : '';
  const docError =
    submitted && type === 'DOCUMENT' && !document?.url
      ? 'Vui lòng tải lên tài liệu'
      : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!title.trim()) return;
    if (type === 'DOCUMENT' && !document?.url) return;

    const basePayload = {
      title: title.trim(),
      videoUrl: type === 'VIDEO' && videoUrl.trim() ? videoUrl.trim() : undefined,
      durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
      fileUrl: type === 'DOCUMENT' ? document?.url : undefined,
      fileStorageKey: type === 'DOCUMENT' ? document?.storageKey : undefined,
      fileName: type === 'DOCUMENT' ? document?.fileName : undefined,
      fileSize: type === 'DOCUMENT' ? document?.fileSize : undefined,
      mimeType: type === 'DOCUMENT' ? document?.mimeType : undefined,
    };

    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await createLessonItemAction(lessonId, courseId, {
          ...basePayload,
          type,
        });
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Tạo mục bài học thành công',
        );
      } else if (initialData) {
        const res = await updateLessonItemAction(initialData.id, courseId, basePayload);
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Cập nhật mục bài học thành công',
        );
      }
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
            {mode === 'create' ? 'Thêm nội dung mới vào bài học.' : 'Cập nhật nội dung mục bài học.'}
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
            <>
              <div className="space-y-1.5">
                <Label htmlFor="item-video-url">URL video</Label>
                <Input
                  id="item-video-url"
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-duration">Thời lượng (giây)</Label>
                <Input
                  id="item-duration"
                  type="number"
                  min={0}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                />
              </div>
            </>
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
