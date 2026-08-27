'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult } from '@/lib/actions';
import { createClassGroupAction } from '@/actions/v1/classes/create-class-group';
import { updateClassGroupAction } from '@/actions/v1/classes/update-class-group';
import { cn } from '@/lib/utils';
import { CLASS_GROUP_COLOR_OPTIONS } from '@/types/class-management';
import type { ClassGroupColor } from '@/types/class-management';
import type { ClassGroupRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData: ClassGroupRow | null;
  /** Màu các nhóm khác trong lớp đã dùng — gợi ý màu đầu tiên chưa dùng khi tạo mới. */
  usedColors: ClassGroupColor[];
}

export default function ClassGroupFormModal({
  classId,
  open,
  onOpenChange,
  mode,
  initialData,
  usedColors,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name ?? '');
  const [color, setColor] = useState<ClassGroupColor>(
    () =>
      initialData?.color ??
      CLASS_GROUP_COLOR_OPTIONS.find((o) => !usedColors.includes(o.value))?.value ??
      CLASS_GROUP_COLOR_OPTIONS[0].value,
  );
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? 'Vui lòng nhập tên nhóm' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;

    setLoading(true);
    try {
      const result =
        mode === 'create'
          ? await createClassGroupAction(classId, { name: name.trim(), color })
          : await updateClassGroupAction(classId, initialData!.id, {
              name: name.trim(),
              color,
            });
      handleActionResult(
        result.errors,
        () => {
          onOpenChange(false);
          router.refresh();
        },
        mode === 'create' ? 'Tạo nhóm thành công' : 'Cập nhật nhóm thành công',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tạo nhóm' : 'Chỉnh sửa nhóm'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Đặt tên và chọn màu để dễ phân biệt nhóm này với các nhóm khác trong lớp.'
              : 'Cập nhật tên hoặc màu của nhóm.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">
              Tên nhóm <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder="VD: Nhóm nâng cao"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError}
            />
            {nameError && <p className="text-destructive text-xs">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Màu</Label>
            <div className="grid grid-cols-4 gap-2">
              {CLASS_GROUP_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  aria-label={opt.label}
                  aria-pressed={color === opt.value}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors',
                    color === opt.value
                      ? 'border-purple'
                      : 'hover:border-input-border border-transparent',
                  )}
                >
                  <span className="size-6 rounded-full" style={{ backgroundColor: opt.text }} />
                  <span className="text-foreground text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
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
              {mode === 'create' ? 'Tạo nhóm' : 'Lưu thay đổi'}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
