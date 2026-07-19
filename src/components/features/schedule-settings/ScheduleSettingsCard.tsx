'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton, ImagePreviewDialog } from '@/components/ui/custom';
import { handleActionResult } from '@/lib/actions';
import { updateScheduleSettingsAction } from '@/actions/v1/schedule-settings/update-schedule-settings';
import ThumbnailUploader, {
  type ThumbnailValue,
} from '@/components/features/courses/ThumbnailUploader';
import type { IScheduleSettings } from '@/types/actions/schedule-settings';

interface Props {
  settings: IScheduleSettings | null;
}

function toThumbnail(settings: IScheduleSettings | null): ThumbnailValue | null {
  if (!settings) return null;
  return { url: settings.imageUrl, storageKey: settings.imageStorageKey };
}

export default function ScheduleSettingsCard({ settings }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [yearFrom, setYearFrom] = useState(String(settings?.academicYearFrom ?? ''));
  const [yearTo, setYearTo] = useState(String(settings?.academicYearTo ?? ''));
  const [image, setImage] = useState<ThumbnailValue | null>(toThumbnail(settings));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setYearFrom(String(settings?.academicYearFrom ?? ''));
    setYearTo(String(settings?.academicYearTo ?? ''));
    setImage(toThumbnail(settings));
    setSubmitted(false);
  }, [open, settings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const yearFromNum = Number(yearFrom);
  const yearToNum = Number(yearTo);
  const yearFromError =
    submitted && (!yearFrom.trim() || Number.isNaN(yearFromNum)) ? 'Vui lòng nhập năm bắt đầu' : '';
  const yearToError =
    submitted && (!yearTo.trim() || Number.isNaN(yearToNum))
      ? 'Vui lòng nhập năm kết thúc'
      : submitted && yearToNum <= yearFromNum
        ? 'Năm kết thúc phải sau năm bắt đầu'
        : '';
  const imageError = submitted && !image?.url ? 'Vui lòng tải ảnh lịch học' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (
      !yearFrom.trim() ||
      !yearTo.trim() ||
      Number.isNaN(yearFromNum) ||
      Number.isNaN(yearToNum) ||
      yearToNum <= yearFromNum ||
      !image?.url ||
      !image.storageKey
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateScheduleSettingsAction({
        academicYearFrom: yearFromNum,
        academicYearTo: yearToNum,
        imageUrl: image.url,
        imageStorageKey: image.storageKey,
      });
      handleActionResult(
        res.errors,
        () => {
          setOpen(false);
          router.refresh();
        },
        'Cập nhật lịch học thành công',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle>Lịch học trên trang chủ</CardTitle>
          <Button variant="outline" onClick={() => setOpen(true)} className="cursor-pointer">
            <Pencil /> Chỉnh sửa
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 pb-6 sm:flex-row sm:items-center">
          {settings?.imageUrl ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="border-divider h-32 w-32 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
              title="Xem ảnh đầy đủ"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.imageUrl}
                alt="Lịch học các lớp"
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="text-muted-foreground flex h-32 w-32 items-center justify-center rounded-lg border border-dashed text-center text-xs">
              Chưa có ảnh
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-sm">Năm học hiện tại</p>
            <p className="text-foreground text-2xl font-semibold">
              {settings
                ? `${settings.academicYearFrom}-${settings.academicYearTo}`
                : 'Chưa cấu hình'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!submitting) setOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lịch học</DialogTitle>
            <DialogDescription>
              Cập nhật năm học và ảnh lịch học hiển thị ở landing page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="schedule-year-from">
                  Năm bắt đầu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="schedule-year-from"
                  type="number"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  aria-invalid={!!yearFromError}
                />
                {yearFromError && <p className="text-destructive text-xs">{yearFromError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schedule-year-to">
                  Năm kết thúc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="schedule-year-to"
                  type="number"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  aria-invalid={!!yearToError}
                />
                {yearToError && <p className="text-destructive text-xs">{yearToError}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Ảnh lịch học <span className="text-destructive">*</span>
              </Label>
              <ThumbnailUploader
                value={image}
                onChange={setImage}
                folder="schedule-images"
                disabled={submitting}
              />
              {imageError && <p className="text-destructive text-xs">{imageError}</p>}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="cursor-pointer"
              >
                Huỷ
              </Button>
              <ActionButton
                type="submit"
                isLoading={submitting}
                loadingText="Đang lưu..."
                className="cursor-pointer"
              >
                Lưu thay đổi
              </ActionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImagePreviewDialog
        imageUrl={previewOpen ? (settings?.imageUrl ?? null) : null}
        alt="Lịch học các lớp"
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
