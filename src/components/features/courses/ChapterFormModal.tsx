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
import { createChapterAction } from '@/actions/v1/chapters/create-chapter';
import { updateChapterAction } from '@/actions/v1/chapters/update-chapter';
import type { ChapterTree } from '@/types/course-management';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  courseId: number;
  initialData?: ChapterTree;
}

export default function ChapterFormModal({
  open,
  onOpenChange,
  mode,
  courseId,
  initialData,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? '');
    setDescription(initialData?.description ?? '');
    setSubmitted(false);
  }, [open, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const titleError = submitted && !title.trim() ? 'Vui lòng nhập tên chương' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
    };

    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await createChapterAction(courseId, payload);
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Tạo chương thành công',
        );
      } else if (initialData) {
        const res = await updateChapterAction(initialData.id, courseId, payload);
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Cập nhật chương thành công',
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
          <DialogTitle>{mode === 'create' ? 'Tạo chương' : 'Chỉnh sửa chương'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Nhập thông tin chương mới.' : 'Cập nhật thông tin chương.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="chapter-title">
              Tên chương <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chapter-title"
              placeholder="VD: Chương 1: Động học"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!titleError}
            />
            {titleError && <p className="text-destructive text-xs">{titleError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chapter-desc">Mô tả</Label>
            <Textarea
              id="chapter-desc"
              rows={3}
              placeholder="Mô tả ngắn về chương"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

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
              {mode === 'create' ? 'Tạo chương' : 'Lưu thay đổi'}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
