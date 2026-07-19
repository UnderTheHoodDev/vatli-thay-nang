'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { handleActionResult } from '@/lib/actions';
import { formatDateTimeShort } from '@/lib/format';
import { manualAttendanceAction } from '@/actions/v1/attendance/manual-attendance';
import type {
  AttendanceSessionListRow,
  AttendanceSummaryStudent,
  IManualAttendancePayload,
} from '@/types/actions/attendance';
import type { ManualEditAction } from '@/types/class-management';

export type ManualDialogMode = 'mark' | 'remove' | 'note' | 'acknowledgeLeave';

interface ModeConfig {
  action: ManualEditAction;
  title: string;
  description: string;
  success: string;
  requiresSession: boolean;
}

const MODE_CONFIG: Record<ManualDialogMode, ModeConfig> = {
  mark: {
    action: 'MARK_ATTENDED',
    title: 'Đánh dấu có mặt',
    description: 'Đánh dấu học sinh có mặt cho phiên điểm danh được chọn.',
    success: 'Đã đánh dấu có mặt',
    requiresSession: true,
  },
  remove: {
    action: 'REMOVE_ATTENDANCE',
    title: 'Huỷ điểm danh',
    description: 'Huỷ điểm danh của học sinh trong phiên được chọn.',
    success: 'Đã huỷ điểm danh',
    requiresSession: true,
  },
  note: {
    action: 'ADD_NOTE',
    title: 'Thêm ghi chú',
    description: 'Thêm/cập nhật ghi chú cho lượt điểm danh hiện có.',
    success: 'Đã cập nhật ghi chú',
    requiresSession: true,
  },
  acknowledgeLeave: {
    action: 'ACKNOWLEDGE_LEAVE',
    title: 'Xác nhận xin nghỉ',
    description: 'Xác nhận yêu cầu xin nghỉ của học sinh.',
    success: 'Đã xác nhận xin nghỉ',
    requiresSession: false,
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ManualDialogMode;
  classSessionId: number;
  student: AttendanceSummaryStudent;
  attendanceSessions: AttendanceSessionListRow[];
  onSuccess: () => void;
}

export default function ManualAttendanceDialog({
  open,
  onOpenChange,
  mode,
  classSessionId,
  student,
  attendanceSessions,
  onSuccess,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{MODE_CONFIG[mode].title}</DialogTitle>
        </DialogHeader>
        {open && (
          <ManualForm
            mode={mode}
            classSessionId={classSessionId}
            student={student}
            attendanceSessions={attendanceSessions}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FormProps {
  mode: ManualDialogMode;
  classSessionId: number;
  student: AttendanceSummaryStudent;
  attendanceSessions: AttendanceSessionListRow[];
  onCancel: () => void;
  onSuccess: () => void;
}

function ManualForm({
  mode,
  classSessionId,
  student,
  attendanceSessions,
  onCancel,
  onSuccess,
}: FormProps) {
  const config = MODE_CONFIG[mode];

  const sortedSessions = useMemo(
    () =>
      [...attendanceSessions].sort(
        (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      ),
    [attendanceSessions],
  );

  const initialSessionId = sortedSessions[0] ? String(sortedSessions[0].id) : '';
  const initialNote =
    mode === 'note' && sortedSessions[0]
      ? (student.attendances.find((a) => a.attendanceSessionId === sortedSessions[0].id)?.note ??
        '')
      : '';

  const [sessionId, setSessionId] = useState<string>(initialSessionId);
  const [note, setNote] = useState<string>(initialNote);
  const [loading, setLoading] = useState(false);

  const noSessionAvailable = config.requiresSession && sortedSessions.length === 0;

  const handleSubmit = async () => {
    if (noSessionAvailable) return;
    if (mode === 'note' && !note.trim()) return;

    const payload: IManualAttendancePayload = {
      studentId: student.studentId,
      action: config.action,
    };
    if (config.requiresSession && sessionId) {
      payload.attendanceSessionId = Number(sessionId);
    }
    if (note.trim()) {
      payload.note = note.trim();
    }

    setLoading(true);
    try {
      const result = await manualAttendanceAction(classSessionId, payload);
      handleActionResult(result.errors, onSuccess, config.success);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <p className="text-muted-foreground text-sm">{config.description}</p>

        <div className="bg-muted/40 rounded-md p-3 text-sm">
          <div className="text-foreground font-medium">{student.fullName ?? student.email}</div>
          {student.fullName && <div className="text-muted-foreground text-xs">{student.email}</div>}
        </div>

        {config.requiresSession && (
          <div>
            <Label>Phiên điểm danh</Label>
            {noSessionAvailable ? (
              <p className="text-sm text-red-500">
                Chưa có phiên điểm danh nào. Vui lòng bật điểm danh trước.
              </p>
            ) : (
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Chọn phiên" />
                </SelectTrigger>
                <SelectContent>
                  {sortedSessions.map((s, idx) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      Phiên #{sortedSessions.length - idx} —{' '}
                      {formatDateTimeShort(s.openedAt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="manual-note">
            Ghi chú {mode === 'note' && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="manual-note"
            rows={3}
            maxLength={500}
            placeholder="Nhập ghi chú (tối đa 500 ký tự)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Huỷ
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || noSessionAvailable || (mode === 'note' && !note.trim())}
        >
          {loading ? 'Đang lưu...' : 'Xác nhận'}
        </Button>
      </DialogFooter>
    </>
  );
}
