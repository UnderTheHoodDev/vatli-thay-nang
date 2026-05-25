'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarDays, FileX2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/components/app/EmptyState';
import SubmitLeaveRequestDialog from '@/components/features/leave-requests/SubmitLeaveRequestDialog';
import type { ClassRow } from '@/types/class-management';
import type { ClassSessionListRow } from '@/types/actions/class-management';
import type { ClassSessionStatus } from '@/types/class-management';

const STATUS_MAP: Record<
  ClassSessionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  SCHEDULED: { label: 'Đã lên lịch', variant: 'outline' },
  IN_PROGRESS: { label: 'Đang diễn ra', variant: 'default' },
  COMPLETED: { label: 'Hoàn thành', variant: 'secondary' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  classes: ClassRow[];
  selectedClassId: number | null;
  sessions: ClassSessionListRow[];
  errors: string[];
}

export default function StudentClassSessionsClient({
  classes,
  selectedClassId,
  sessions,
  errors,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveSessionId, setLeaveSessionId] = useState<number | null>(null);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  const handleClassChange = (classId: string) => {
    const sp = new URLSearchParams();
    sp.set('classId', classId);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const openLeaveDialog = (sessionId: number) => {
    setLeaveSessionId(sessionId);
    setLeaveDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-paytone text-purple text-2xl">Buổi học của tôi</h1>

      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có lớp học"
          description="Bạn chưa được gán vào lớp học nào"
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Chọn lớp:</span>
            <Select
              value={selectedClassId ? String(selectedClassId) : undefined}
              onValueChange={handleClassChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Chọn lớp học" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Danh sách buổi học
              </CardTitle>
              <CardDescription>Xem các buổi học và gửi yêu cầu xin nghỉ</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <EmptyState
                  icon={FileX2}
                  title="Chưa có buổi học"
                  description="Lớp này chưa có buổi học nào"
                />
              ) : (
                <div className="border-divider overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="min-w-[200px]">Tiêu đề</TableHead>
                        <TableHead className="min-w-[150px]">Bắt đầu</TableHead>
                        <TableHead className="min-w-[150px]">Kết thúc</TableHead>
                        <TableHead className="w-32">Trạng thái</TableHead>
                        <TableHead className="w-28 text-center">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s) => {
                        const statusInfo = STATUS_MAP[s.status];
                        const canRequestLeave =
                          s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS';
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="text-foreground font-medium">{s.title}</TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatDateTime(s.startTime)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatDateTime(s.endTime)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {canRequestLeave ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="cursor-pointer"
                                  onClick={() => openLeaveDialog(s.id)}
                                >
                                  Xin nghỉ
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {leaveSessionId && (
        <SubmitLeaveRequestDialog
          open={leaveDialogOpen}
          onOpenChange={(open) => {
            setLeaveDialogOpen(open);
            if (!open) setLeaveSessionId(null);
          }}
          classSessionId={leaveSessionId}
        />
      )}
    </div>
  );
}
