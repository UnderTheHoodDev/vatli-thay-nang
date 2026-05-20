'use client';

import { useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionResult } from '@/lib/actions';
import { deleteClassAction } from '@/actions/v1/classes/delete-class';
import ClassFormModal from '@/components/features/classes/ClassFormModal';
import type { ListMeta } from '@/types/auth';
import type { ClassRow } from '@/types/class-management';

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

export default function ClassesPageClient({ urlState, rows, meta }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);

  const [searchName, setSearchName] = useState(urlState.name);
  const [searchCode, setSearchCode] = useState(urlState.code);
  const [searchStatus, setSearchStatus] = useState(urlState.status);

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const params = buildUrlParams({ ...urlState, ...next });
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, urlState],
  );

  const handleSearch = () => {
    updateUrl({ name: searchName, code: searchCode, status: searchStatus, page: 1 });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xoá lớp này?')) return;
    const result = await deleteClassAction(id);
    handleActionResult(result.errors, () => router.refresh(), 'Xoá lớp thành công');
  };

  const { page, pageSize } = urlState;
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-paytone text-purple text-2xl">Quản lý lớp học</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Tên lớp</label>
          <Input
            placeholder="Tìm theo tên lớp..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Mã lớp</label>
          <Input
            placeholder="Tìm theo mã lớp..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="w-48">
          <label className="mb-1 block text-sm font-medium">Trạng thái</label>
          <Select value={searchStatus} onValueChange={setSearchStatus}>
            <SelectTrigger>
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
        <Button onClick={handleSearch}>Tìm kiếm</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          {total} lớp học: {start} ~ {end}
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
          <Button onClick={() => setCreateOpen(true)}>Tạo lớp</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Tên lớp</TableHead>
            <TableHead>Mã lớp</TableHead>
            <TableHead className="w-28 text-center">Số học sinh</TableHead>
            <TableHead className="w-36">Trạng thái</TableHead>
            <TableHead className="w-32 text-center">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                Không có lớp học nào
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.code}</TableCell>
                <TableCell className="text-center">{row.studentCount ?? 0}</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {row.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Xem chi tiết"
                      onClick={() => router.push(`/admin/classes/${row.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sửa"
                      onClick={() => setEditingClass(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {row.status === 'CLOSED' && (
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
            ))
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

      <ClassFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      {editingClass && (
        <ClassFormModal
          open={!!editingClass}
          onOpenChange={(open) => { if (!open) setEditingClass(null); }}
          mode="edit"
          initialData={editingClass}
        />
      )}
    </div>
  );
}
