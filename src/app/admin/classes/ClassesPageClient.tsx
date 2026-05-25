'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  Pencil,
  Plus,
  Search,
  School,
  Trash2,
  Users as UsersIcon,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import PageHeader from '@/components/app/PageHeader';
import StatsCard from '@/components/app/StatsCard';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionResult } from '@/lib/actions';
import { deleteClassAction } from '@/actions/v1/classes/delete-class';
import ClassFormModal from '@/components/features/classes/ClassFormModal';
import type { ListMeta } from '@/types/auth';
import type { ClassRow } from '@/types/class-management';
import type { ClassesListStats } from '@/types/actions/class-management';

export interface UrlState {
  name: string;
  code: string;
  status: string;
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  rows: ClassRow[];
  meta: ListMeta;
  stats: ClassesListStats;
  errors: string[];
}

const CLASS_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'CLOSED', label: 'Đã đóng' },
] as const;

function buildUrlParams(state: UrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.name) sp.set('name', state.name);
  if (state.code) sp.set('code', state.code);
  if (state.status && state.status !== ALL_VALUE) sp.set('status', state.status);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

const SKELETON_COLUMNS = ['w-8', 'w-48', 'w-24', 'w-10', 'w-28', 'w-20'];

export default function ClassesPageClient({ urlState, rows, meta, stats, errors }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
    }
  }, [errors]);

  const [searchName, setSearchName] = useState(urlState.name);
  const [searchCode, setSearchCode] = useState(urlState.code);
  const [searchStatus, setSearchStatus] = useState(urlState.status);

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const params = buildUrlParams({ ...urlState, ...next });
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  const handleSearch = () => {
    updateUrl({ name: searchName, code: searchCode, status: searchStatus, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchName('');
    setSearchCode('');
    setSearchStatus(ALL_VALUE);
    updateUrl({ name: '', code: '', status: ALL_VALUE, page: 1 });
  };

  const confirmDelete = async () => {
    if (!deletingClass) return;
    setDeleting(true);
    try {
      const result = await deleteClassAction(deletingClass.id);
      const ok = handleActionResult(result.errors, () => router.refresh(), 'Xoá lớp thành công');
      if (ok) setDeletingClass(null);
    } finally {
      setDeleting(false);
    }
  };

  const { page, pageSize } = urlState;
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý lớp học"
        description="Tạo, theo dõi và quản lý các lớp học vật lí của bạn."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard label="Tổng số lớp" value={stats.total} icon={School} tone="primary" />
        <StatsCard label="Đang hoạt động" value={stats.active} icon={CheckCircle2} tone="success" />
        <StatsCard label="Đã đóng" value={stats.closed} icon={Lock} tone="muted" />
        <StatsCard
          label="Tổng học sinh"
          value={stats.totalStudents}
          icon={UsersIcon}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="search-name">Tên lớp</Label>
              <Input
                id="search-name"
                placeholder="Tìm theo tên lớp..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-code">Mã lớp</Label>
              <Input
                id="search-code"
                placeholder="Tìm theo mã lớp..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
                  {CLASS_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row md:col-span-3 lg:col-span-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="cursor-pointer"
              >
                <X /> Xoá bộ lọc
              </Button>
              <Button onClick={handleSearch} className="cursor-pointer">
                <Search /> Tìm kiếm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Danh sách lớp học</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có lớp học nào'
                : `Hiển thị ${start}–${end} trên tổng ${total} lớp`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => updateUrl({ pageSize: Number(v), page: 1 })}
            >
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
              <Plus /> Tạo lớp
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          {!isPending && rows.length === 0 ? (
            <EmptyState
              icon={School}
              title="Không có lớp học nào"
              description="Tạo lớp đầu tiên để bắt đầu quản lý học sinh và bài học."
              action={
                <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
                  <Plus /> Tạo lớp mới
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Mã lớp</TableHead>
                  <TableHead className="w-32 text-center">Số học sinh</TableHead>
                  <TableHead className="w-36">Trạng thái</TableHead>
                  <TableHead className="w-32 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableSkeleton columnWidths={SKELETON_COLUMNS} />
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => router.push(`/admin/classes/${row.id}`)}
                      className="hover:bg-muted cursor-pointer transition-colors"
                    >
                      <TableCell className="text-muted-foreground">{row.id}</TableCell>
                      <TableCell className="text-foreground font-medium">{row.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                          {row.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {row.studentCount ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {row.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Sửa"
                            className="cursor-pointer"
                            onClick={() => setEditingClass(row)}
                          >
                            <Pencil />
                          </Button>
                          {row.status === 'CLOSED' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Xoá"
                              className="text-destructive hover:text-destructive cursor-pointer"
                              onClick={() => setDeletingClass(row)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              Trang {page} / {totalPages}
            </div>
            <DataPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => updateUrl({ page: p })}
            />
          </div>
        )}
      </Card>

      <ClassFormModal open={createOpen} onOpenChange={setCreateOpen} mode="create" />

      {editingClass && (
        <ClassFormModal
          open={!!editingClass}
          onOpenChange={(open) => {
            if (!open) setEditingClass(null);
          }}
          mode="edit"
          initialData={editingClass}
        />
      )}

      <AlertDialog
        open={!!deletingClass}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingClass(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá lớp học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá lớp{' '}
              <span className="text-foreground font-medium">{deletingClass?.name}</span>? Thao tác
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? 'Đang xoá...' : 'Xoá lớp'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
