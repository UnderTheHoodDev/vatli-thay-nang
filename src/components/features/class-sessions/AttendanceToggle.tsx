'use client';

import { useEffect, useRef, useState } from 'react';
import { Power, PowerOff, Radio, Timer } from 'lucide-react';
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
import { handleActionResult } from '@/lib/actions';
import { formatRemaining } from '@/lib/format';
import { closeAttendanceAction } from '@/actions/v1/attendance/close-attendance';
import OpenAttendanceDialog from './OpenAttendanceDialog';

interface Props {
  classSessionId: number;
  activeAttendanceSession: { id: number; closedAt: string } | null;
  /** Gọi lại khi trạng thái điểm danh thay đổi (bật/tắt/hết giờ) — thường là router.refresh(). */
  onChanged: () => void;
}

export default function AttendanceToggle({
  classSessionId,
  activeAttendanceSession,
  onChanged,
}: Props) {
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // null ở lần render đầu (server + hydration) để khớp SSR, set Date.now() trong effect.
  const [now, setNow] = useState<number | null>(null);

  // Ref giữ callback mới nhất — tránh phải đưa onChanged (một inline function, đổi
  // identity mỗi lần cha re-render) vào dependency array của effect bên dưới.
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  }, [onChanged]);

  const sessionId = activeAttendanceSession?.id ?? null;
  const closedAt = activeAttendanceSession?.closedAt ?? null;

  useEffect(() => {
    if (sessionId === null || closedAt === null) return;
    const closedAtMs = new Date(closedAt).getTime();
    const seed = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= closedAtMs) {
        clearInterval(timer);
        onChangedRef.current();
      }
    }, 1000);
    return () => {
      clearTimeout(seed);
      clearInterval(timer);
    };
  }, [sessionId, closedAt]);

  const handleClose = async () => {
    if (!activeAttendanceSession) return;
    setClosing(true);
    try {
      const result = await closeAttendanceAction(activeAttendanceSession.id);
      const ok = handleActionResult(result.errors, onChanged, 'Đã tắt điểm danh');
      if (ok) setCloseConfirmOpen(false);
    } finally {
      setClosing(false);
    }
  };

  if (!activeAttendanceSession) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpenDialogOpen(true)}
        >
          <Power className="size-3.5" /> Bật điểm danh
        </Button>
        <OpenAttendanceDialog
          open={openDialogOpen}
          onOpenChange={setOpenDialogOpen}
          classSessionId={classSessionId}
          onOpened={() => {
            setOpenDialogOpen(false);
            onChanged();
          }}
        />
      </>
    );
  }

  const remainingMs =
    now !== null ? new Date(activeAttendanceSession.closedAt).getTime() - now : 0;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-primary inline-flex items-center gap-1 font-mono text-xs tabular-nums">
          <Radio className="size-3.5 animate-pulse" />
          {now !== null ? formatRemaining(remainingMs) : <Timer className="size-3.5" />}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive cursor-pointer"
          onClick={() => setCloseConfirmOpen(true)}
        >
          <PowerOff className="size-3.5" /> Tắt điểm danh
        </Button>
      </div>

      <AlertDialog
        open={closeConfirmOpen}
        onOpenChange={(open) => !closing && setCloseConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tắt điểm danh?</AlertDialogTitle>
            <AlertDialogDescription>
              Học sinh sẽ không thể điểm danh buổi học này nữa sau khi tắt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleClose();
              }}
              disabled={closing}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {closing ? 'Đang tắt...' : 'Tắt điểm danh'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
