'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataPagination from '@/components/app/DataPagination';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import ClassStudentsSearchForm, { type ClassStudentSearchValues } from './ClassStudentsSearchForm';
import ClassStudentsTable from './ClassStudentsTable';
import AddStudentsDialog from './AddStudentsDialog';
import type { ListMeta } from '@/types/auth';
import type { ClassStudentListRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  search: ClassStudentSearchValues;
  rows: ClassStudentListRow[];
  meta: ListMeta;
  onSearchChange: (next: ClassStudentSearchValues) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function ClassStudentsTab({
  classId,
  search,
  rows,
  meta,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: Props) {
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
          <ClassStudentsSearchForm initial={search} onSearch={onSearchChange} />
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Học sinh trong lớp</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có học sinh nào trong lớp'
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
            <AddStudentsDialog classId={classId} />
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <ClassStudentsTable classId={classId} rows={rows} />
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
    </div>
  );
}
