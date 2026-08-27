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
import { useIsTeachingAssistant } from '@/components/app/RoleProvider';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import ClassStudentsTable, {
  type ClassStudentsGroupFilter,
  type ClassStudentsStatusFilter,
} from './ClassStudentsTable';
import AddStudentsDialog from './AddStudentsDialog';
import type { ClassAttendanceStudentRow } from '@/types/actions/attendance';
import type { ListMeta } from '@/types/auth';
import type { ClassGroupRow, ClassStudentListRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  /** Tìm gộp (OR): email, họ tên — debounce ở hook phía trên. */
  q: string;
  statusFilter: ClassStudentsStatusFilter;
  groupFilter: ClassStudentsGroupFilter;
  groups: ClassGroupRow[];
  rows: ClassStudentListRow[];
  attendanceStats: ClassAttendanceStudentRow[];
  meta: ListMeta;
  loading?: boolean;
  onQChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function ClassStudentsTab({
  classId,
  q,
  statusFilter,
  groupFilter,
  groups,
  rows,
  attendanceStats,
  meta,
  loading,
  onQChange,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const isTA = useIsTeachingAssistant();
  const { page, pageSize, total } = meta;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActiveFilter =
    !!q.trim() || statusFilter.value !== ALL_VALUE || groupFilter.value !== ALL_VALUE;

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex flex-col items-stretch gap-3 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Học sinh trong lớp</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {loading
                ? 'Đang tải...'
                : total === 0
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
            {!isTA && <AddStudentsDialog classId={classId} />}
          </div>
        </div>

        {/* Ô search gộp gõ-là-lọc — thay form Tìm kiếm email/họ tên tách rời cũ. */}
        <TableSearchInput
          value={q}
          onChange={onQChange}
          placeholder="Tìm theo email hoặc họ tên…"
          isPending={loading}
        />
      </CardHeader>
      <CardContent className="px-3 pb-0">
        <ClassStudentsTable
          classId={classId}
          rows={rows}
          groups={groups}
          attendanceStats={attendanceStats}
          loading={loading}
          statusFilter={statusFilter}
          groupFilter={groupFilter}
          hasActiveFilter={hasActiveFilter}
        />
      </CardContent>
      {totalPages > 1 && (
        <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
          <div className="text-muted-foreground text-sm whitespace-nowrap">
            Trang {page} / {totalPages}
          </div>
          <DataPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </Card>
  );
}
