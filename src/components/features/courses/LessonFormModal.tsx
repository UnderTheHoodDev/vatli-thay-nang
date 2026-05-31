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
import { Textarea } from '@/components/ui/textarea';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult } from '@/lib/actions';
import { createLessonAction } from '@/actions/v1/lessons/create-lesson';
import { updateLessonAction } from '@/actions/v1/lessons/update-lesson';
import type { LessonTree } from '@/types/course-management';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  courseId: number;
  chapterId: number;
  initialData?: LessonTree;
}

export default function LessonFormModal({
  open,
  onOpenChange,
  mode,
  courseId,
  chapterId,
  initialData,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? '');
    setDescription(initialData?.description ?? '');
    setIsPreview(initialData?.isPreview ?? false);
    setSubmitted(false);
  }, [open, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const titleError = submitted && !title.trim() ? 'Vui lòng nhập tên bài học' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isPreview,
    };

    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await createLessonAction(chapterId, courseId, payload);
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Tạo bài học thành công',
        );
      } else if (initialData) {
        const res = await updateLessonAction(initialData.id, courseId, payload);
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Cập nhật bài học thành công',
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
          <DialogTitle>{mode === 'create' ? 'Tạo bài học' : 'Chỉnh sửa bài học'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Nhập thông tin bài học mới.' : 'Cập nhật thông tin bài học.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">
              Tên bài học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lesson-title"
              placeholder="VD: Bài 1: Chuyển động thẳng đều"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!titleError}
            />
            {titleError && <p className="text-destructive text-xs">{titleError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-desc">Mô tả</Label>
            <Textarea
              id="lesson-desc"
              rows={3}
              placeholder="Mô tả ngắn về bài học"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isPreview}
              onChange={(e) => setIsPreview(e.target.checked)}
              className="accent-primary size-4 cursor-pointer"
            />
            <span className="text-foreground text-sm">
              Cho phép học sinh chưa ghi danh xem bài này (preview)
            </span>
          </label>

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
              {mode === 'create' ? 'Tạo bài học' : 'Lưu thay đổi'}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
