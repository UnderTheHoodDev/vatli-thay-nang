'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <div className="space-y-4">
      <ClassStudentsSearchForm initial={search} onSearch={onSearchChange} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          {total} học sinh: {start} ~ {end}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hiển thị</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
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
          <AddStudentsDialog classId={classId} />
        </div>
      </div>

      <ClassStudentsTable classId={classId} rows={rows} />

      <div className="flex items-center justify-end gap-3 pt-2">
        <div className="text-sm text-gray-500">
          Trang {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
