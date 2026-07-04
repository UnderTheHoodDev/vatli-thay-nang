'use client';

import { useState, useTransition } from 'react';
import { Search, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionResult } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import { removeCourseEnrollmentAction } from '@/actions/v1/courses/remove-course-enrollment';
import EnrollStudentsDialog from './EnrollStudentsDialog';
import type { ListMeta } from '@/types/auth';
import type { CourseEnrollmentRow } from '@/types/course-management';

export interface EnrollmentSearchValues {
  email: string;
  fullName: string;
}

const SKELETON_COLUMNS = ['w-8', 'w-48', 'w-36', 'w-24', 'w-24', 'w-28'];

interface Props {
  courseId: number;
  search: EnrollmentSearchValues;
  rows: CourseEnrollmentRow[];
  meta: ListMeta;
  loading?: boolean;
  onSearchChange: (v: EnrollmentSearchValues) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function CourseEnrollmentsTab({
  courseId,
  search,
  rows,
  meta,
  loading,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const [email, setEmail] = useState(search.email);
  const [fullName, setFullName] = useState(search.fullName);
  const [target, setTarget] = useState<CourseEnrollmentRow | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearchChange({ email: email.trim(), fullName: fullName.trim() });
  }

  function reset() {
    setEmail('');
    setFullName('');
    onSearchChange({ email: '', fullName: '' });
  }

  function confirmRevoke() {
    if (!target) return;
    const studentId = target.studentId;
    startTransition(async () => {
      const res = await removeCourseEnrollmentAction(courseId, studentId);
      const ok = handleActionResult(res.errors, undefined, 'Đã thu hồi ghi danh');
      if (ok) setTarget(null);
    });
  }

  const { page, pageSize, total } = meta;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm học sinh</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="enroll-search-email">Email</Label>
              <Input
                id="enroll-search-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@vltn.vn"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enroll-search-name">Họ và tên</Label>
              <Input
                id="enroll-search-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row md:col-span-2">
              <Button type="button" variant="outline" onClick={reset} className="cursor-pointer">
                <X /> Xoá bộ lọc
              </Button>
              <Button type="submit" className="cursor-pointer">
                <Search /> Tìm kiếm
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Học sinh đã ghi danh</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có học sinh nào ghi danh'
                : `Hiển thị ${start}–${end} trên tổng ${total} học sinh`}
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
            <EnrollStudentsDialog courseId={courseId} />
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          {!loading && rows.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Chưa có học sinh nào ghi danh"
              description='Dùng nút "Thêm học sinh" để ghi danh học sinh vào khóa học.'
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-14">ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead className="w-32">Trạng thái</TableHead>
                    <TableHead>Ngày ghi danh</TableHead>
                    <TableHead className="w-40 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton columnWidths={SKELETON_COLUMNS} />
                  ) : (
                    rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground">{e.studentId}</TableCell>
                        <TableCell className="text-foreground font-medium">{e.email}</TableCell>
                        <TableCell>{e.fullName ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={e.status === 'ACTIVE' ? 'success' : 'secondary'}>
                            {e.status === 'ACTIVE' ? 'Đang học' : 'Đã thu hồi'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(e.enrolledAt)}</TableCell>
                        <TableCell className="text-right">
                          {e.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive cursor-pointer"
                              onClick={() => setTarget(e)}
                              disabled={pending}
                            >
                              <Trash2 /> Thu hồi
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
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

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thu hồi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thu hồi ghi danh của học sinh{' '}
              <span className="text-foreground font-medium">
                {target?.fullName ?? target?.email}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRevoke();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {pending ? 'Đang xử lý...' : 'Thu hồi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
