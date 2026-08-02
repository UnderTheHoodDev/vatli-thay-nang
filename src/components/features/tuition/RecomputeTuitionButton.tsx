'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { handleActionErrors } from '@/lib/actions';
import { recomputeTuitionAction } from '@/actions/v1/tuition/recompute-tuition';

interface Props {
  classId: number;
  year: number;
  month: number;
  disabled?: boolean;
  /** Cho phép trang cha chặn khi còn dòng chưa lưu. */
  onRequest: (run: () => void) => void;
}

export default function RecomputeTuitionButton({
  classId,
  year,
  month,
  disabled,
  onRequest,
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await recomputeTuitionAction({ classId, year, month });
      if (res.errors.length) {
        handleActionErrors(res.errors);
        return;
      }
      setConfirming(false);
      const d = res.data;
      const detail = d
        ? ` (${d.updated} cập nhật, ${d.created} tạo mới, ${d.skipped} bỏ qua vì đã sửa tay${
            d.removed ? `, ${d.removed} dòng thừa đã dọn` : ''
          })`
        : '';
      toast.success(`Đã tính lại học phí${detail}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="cursor-pointer"
        disabled={disabled || loading}
        onClick={() => onRequest(() => setConfirming(true))}
      >
        <RefreshCw /> Tính lại
      </Button>

      <AlertDialog open={confirming} onOpenChange={(o) => !o && !loading && setConfirming(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tính lại học phí tháng {month}/{year}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Số <strong>phải đóng</strong> của từng học sinh sẽ được tính lại theo học phí các buổi
              học hiện có trong tháng. Các dòng đã <strong>sửa tay</strong> được giữ nguyên. Số đã
              đóng, ngày đóng và ghi chú không bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              className="cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              {loading ? 'Đang tính…' : 'Tính lại'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
