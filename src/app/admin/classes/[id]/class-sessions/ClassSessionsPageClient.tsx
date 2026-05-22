'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
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
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionResult } from '@/lib/actions';
import { deleteClassSessionAction } from '@/actions/v1/class-sessions/delete-class-session';
import ClassSessionFormModal from '@/components/features/class-sessions/ClassSessionFormModal';
import type { ListMeta } from '@/types/auth';
import type { ClassSessionListRow } from '@/types/actions/class-management';
import type { ClassSessionStatus } from '@/types/class-management';

const STATUS_MAP: Record<ClassSessionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
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
  className: string;
  classCode: string;
  rows: ClassSessionListRow[];
  meta: ListMeta;
  errors: string[];
  page: number;
  pageSize: number;
}

export default function ClassSessionsPageClient({
  classId,
  className,
  classCode,
  rows,
  meta,
  errors,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSessionListRow | null>(null);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  const updateUrl = useCallback(
    (next: { page?: number; pageSize?: number }) => {
      const sp = new URLSearchParams();
      const nextPage = next.page ?? page;
      const nextPageSize = next.pageSize ?? pageSize;
      if (nextPage !== 1) sp.set('page', String(nextPage));
      if (nextPageSize !== 20) sp.set('pageSize', String(nextPageSize));
      const query = sp.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, page, pageSize],
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xoá buổi học này?')) return;
    const result = await deleteClassSessionAction(id, classId);
    handleActionResult(result.errors, () => router.refresh(), 'Xoá buổi học thành công');
  };

  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href={`/admin/classes/${classId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <h1 className="font-paytone text-purple text-2xl">Buổi học - {className}</h1>
        <p className="text-sm text-gray-500">
          Mã lớp: <span className="font-mono">{classCode}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          {total} buổi học: {start} ~ {end}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hiển thị</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => updateUrl({ pageSize: Number(v), page: 1 })}
          >
            <SelectTrigger className="w-24">
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
          <Button onClick={() => setCreateOpen(true)}>Tạo buổi học</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Bắt đầu</TableHead>
            <TableHead>Kết thúc</TableHead>
            <TableHead>Link meeting</TableHead>
            <TableHead className="w-32">Trạng thái</TableHead>
            <TableHead className="w-28 text-center">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                Không có buổi học nào
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const statusInfo = STATUS_MAP[row.status];
              return (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.startTime)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.endTime)}</TableCell>
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
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Sửa"
                        onClick={() => setEditingSession(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {row.status !== 'IN_PROGRESS' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xoá"
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

      <div className="flex items-center justify-end gap-3 pt-2">
        <div className="text-sm text-gray-500">
          Trang {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => updateUrl({ page: Math.max(1, page - 1) })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => updateUrl({ page: page + 1 })}
        >
          <ChevronRight />
        </Button>
      </div>

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
