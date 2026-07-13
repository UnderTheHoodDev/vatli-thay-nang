'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTestAction } from '@/actions/v1/tests/create-test';
import { getTest } from '@/actions/v1/tests/get-test';
import { updateTestAction } from '@/actions/v1/tests/update-test';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { handleActionErrors, handleActionResult } from '@/lib/actions';
import type { TestFilePayload } from '@/types/tests';
import TestFileUploader from './TestFileUploader';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  /** Có testId = sửa, không có = tạo mới. */
  testId?: number;
  onSaved?: () => void;
}

/** BE nhận ISO 8601; input datetime-local cho ra 'YYYY-MM-DDTHH:mm' theo giờ máy. */
function toIso(local: string): string {
  return new Date(local).toISOString();
}

/** Ngược lại: ISO → giá trị cho input datetime-local (theo giờ địa phương). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TestFormModal({ open, onOpenChange, courseId, testId, onSaved }: Props) {
  const router = useRouter();
  const isEdit = testId !== undefined;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // File chưa lên xong mà bấm Lưu thì bài lưu thiếu đề, còn file đã lên thành rác trên R2.
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [attachments, setAttachments] = useState<TestFilePayload[]>([]);

  // Nạp dữ liệu bài đang sửa. fileStorageKey chỉ có trong response của admin — thiếu
  // nó thì PATCH sẽ hiểu là "bỏ hết đề cũ" và xoá sạch file trên R2.
  //
  // Không reset form ở đây: component được remount bằng key từ phía cha (xem
  // CourseTestsSection), nên state đã sạch sẵn — reset đồng bộ trong effect chỉ tạo
  // thêm một vòng render thừa.
  useEffect(() => {
    if (!open || !isEdit) return;

    let cancelled = false;
    void getTest(testId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.data) {
        handleActionErrors(res.errors);
        onOpenChange(false);
        return;
      }
      const t = res.data;
      setTitle(t.title);
      setDescription(t.description ?? '');
      setStartTime(toLocalInput(t.startTime));
      setEndTime(toLocalInput(t.endTime));
      setMaxScore(String(t.maxScore));
      setAttachments(
        t.attachments.map((a) => ({
          fileStorageKey: a.fileStorageKey!,
          fileName: a.fileName,
          fileSize: a.fileSize ?? undefined,
          mimeType: a.mimeType ?? undefined,
          order: a.order,
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit, testId, onOpenChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const score = Number(maxScore);
    if (!title.trim()) return handleActionErrors(['Chưa nhập tên bài kiểm tra']);
    if (!startTime || !endTime) return handleActionErrors(['Chưa chọn thời gian làm bài']);
    if (new Date(endTime) <= new Date(startTime)) {
      return handleActionErrors(['Thời gian kết thúc phải sau thời gian bắt đầu']);
    }
    if (!Number.isFinite(score) || score <= 0) {
      return handleActionErrors(['Điểm tối đa phải lớn hơn 0']);
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: toIso(startTime),
      endTime: toIso(endTime),
      maxScore: score,
      attachments,
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await updateTestAction(courseId, testId, payload)
        : await createTestAction(courseId, payload);

      handleActionResult(
        res.errors,
        () => {
          onOpenChange(false);
          onSaved?.();
          router.refresh();
        },
        isEdit ? 'Đã cập nhật bài kiểm tra' : 'Đã tạo bài kiểm tra',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && !uploadingFiles && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa bài kiểm tra' : 'Tạo bài kiểm tra'}</DialogTitle>
          <DialogDescription>
            Học sinh chỉ xem được đề trong khoảng thời gian làm bài. Hết giờ là khoá nộp.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Đang tải…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-title">Tên bài kiểm tra</Label>
              <Input
                id="test-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kiểm tra 15 phút — Chương 1"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-desc">Mô tả / hướng dẫn (tuỳ chọn)</Label>
              <Textarea
                id="test-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Làm ra giấy rồi chụp ảnh nộp lại."
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Học sinh chỉ đọc được mô tả sau khi bài bắt đầu — viết đề vào đây cũng an toàn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test-start">Bắt đầu</Label>
                <Input
                  id="test-start"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-end">Kết thúc</Label>
                <Input
                  id="test-end"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-max">Điểm tối đa</Label>
              <Input
                id="test-max"
                type="number"
                step="0.01"
                min="0.01"
                max="999.99"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label>Đề bài (ảnh / PDF)</Label>
              <TestFileUploader
                folder="test-attachments"
                value={attachments}
                onChange={setAttachments}
                disabled={saving}
                onBusyChange={setUploadingFiles}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                // Đóng giữa chừng thì file đang tải xong sẽ thành object mồ côi trên R2,
                // và người dùng tưởng đã huỷ trong khi tệp vẫn nằm đó.
                disabled={saving || uploadingFiles}
                className="cursor-pointer"
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={saving || uploadingFiles} className="cursor-pointer">
                {uploadingFiles
                  ? 'Đang tải tệp lên…'
                  : saving
                    ? 'Đang lưu…'
                    : isEdit
                      ? 'Lưu thay đổi'
                      : 'Tạo bài kiểm tra'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
