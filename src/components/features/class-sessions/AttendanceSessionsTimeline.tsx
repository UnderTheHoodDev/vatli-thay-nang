'use client';

import { useState } from 'react';
import { CheckCircle2, Radio, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { handleActionResult } from '@/lib/actions';
import { formatDateTimeShort } from '@/lib/format';
import { closeAttendanceAction } from '@/actions/v1/attendance/close-attendance';
import type { AttendanceSessionListRow } from '@/types/actions/attendance';

interface Props {
  sessions: AttendanceSessionListRow[];
  onChanged: () => void;
}

export default function AttendanceSessionsTimeline({ sessions, onChanged }: Props) {
  const [closingId, setClosingId] = useState<number | null>(null);
  const now = new Date();

  const handleClose = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn đóng phiên điểm danh này?')) return;
    setClosingId(id);
    try {
      const result = await closeAttendanceAction(id);
      handleActionResult(result.errors, onChanged, 'Đã đóng phiên điểm danh');
    } finally {
      setClosingId(null);
    }
  };

  return (
    <ol className="border-divider relative space-y-3 border-l pl-5">
      {sessions.map((s) => {
        const closedAt = new Date(s.closedAt);
        const isActive = s.status === 'ACTIVE' && closedAt > now;
        return (
          <li key={s.id} className="relative">
            <span
              className={
                'absolute top-1 -left-[1.625rem] flex size-4 items-center justify-center rounded-full ' +
                (isActive ? 'bg-purple text-white' : 'bg-muted text-muted-foreground')
              }
            >
              {isActive ? (
                <Radio className="size-2.5 animate-pulse" />
              ) : s.status === 'CLOSED' ? (
                <CheckCircle2 className="size-2.5" />
              ) : (
                <XCircle className="size-2.5" />
              )}
            </span>
            <div className="bg-card border-divider flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">Phiên #{s.id}</span>
                  {isActive ? (
                    <Badge variant="success">Đang mở</Badge>
                  ) : (
                    <Badge variant="secondary">Đã đóng</Badge>
                  )}
                  <span className="text-muted-foreground text-xs">{s.durationMinutes} phút</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  Mở: {formatDateTimeShort(s.openedAt)} · Đóng: {formatDateTimeShort(s.closedAt)}
                </div>
              </div>
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={closingId === s.id}
                  onClick={() => handleClose(s.id)}
                >
                  {closingId === s.id ? 'Đang đóng...' : 'Đóng phiên'}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
