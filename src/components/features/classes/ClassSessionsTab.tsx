'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataPagination from '@/components/app/DataPagination';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionResult } from '@/lib/actions';
import { deleteClassSessionAction } from '@/actions/v1/class-sessions/delete-class-session';
import ClassSessionFormModal from '@/components/features/class-sessions/ClassSessionFormModal';
import type { ListMeta } from '@/types/auth';
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
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  classId: number;
  rows: ClassSessionListRow[];
  meta: ListMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function ClassSessionsTab({
  classId,
  rows,
  meta,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSessionListRow | null>(null);

  const { page, pageSize, total } = meta;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xoá buổi học này?')) return;
    const result = await deleteClassSessionAction(id, classId);
    handleActionResult(result.errors, () => router.refresh(), 'Xoá buổi học thành công');
  };

  return (
    <div className="space-y-6">
      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Buổi học</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có buổi học nào'
                : `Hiển thị ${start}–${end} trên tổng ${total} buổi học`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-24 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
              Tạo buổi học
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Kết thúc</TableHead>
                <TableHead>Link meeting</TableHead>
                <TableHead className="w-32">Trạng thái</TableHead>
                <TableHead className="w-36 text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    Không có buổi học nào
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const statusInfo = STATUS_MAP[row.status];
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground">{row.id}</TableCell>
                      <TableCell className="text-foreground font-medium">{row.title}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(row.startTime)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(row.endTime)}
                      </TableCell>
                      <TableCell>
                        {row.meetingUrl ? (
                          <a
                            href={row.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple hover:underline"
                          >
                            Tham gia
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title="Xem chi tiết"
                            className="cursor-pointer"
                          >
                            <Link href={`/admin/class-sessions/${row.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Sửa"
                            className="cursor-pointer"
                            onClick={() => setEditingSession(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {row.status !== 'IN_PROGRESS' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Xoá"
                              className="cursor-pointer"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              Trang {page} / {totalPages}
            </div>
            <DataPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        )}
      </Card>

      <ClassSessionFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        classId={classId}
      />

      {editingSession && (
        <ClassSessionFormModal
          open={!!editingSession}
          onOpenChange={(open) => {
            if (!open) setEditingSession(null);
          }}
          mode="edit"
          classId={classId}
          initialData={editingSession}
        />
      )}
    </div>
  );
}
