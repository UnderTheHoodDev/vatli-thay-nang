'use client';

import { Wallet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import ColumnFilterHead, {
  type ColumnFilterOption,
} from '@/components/app/table-filters/ColumnFilterHead';
import TuitionRow from './TuitionRow';
import { cn } from '@/lib/utils';
import type { TuitionListRow } from '@/types/actions/tuition';

const SKELETON_COLUMNS = [
  'w-8',
  'w-40',
  'w-48',
  'w-28',
  'w-28',
  'w-24',
  'w-28',
  'w-40',
  'w-32',
  'w-16',
];

/** Lọc gắn thẳng vào header cột Trạng thái đóng học phí. */
export interface TuitionStatusFilter {
  value: string;
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
}

function TuitionTableHead({ statusFilter }: { statusFilter?: TuitionStatusFilter }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-12">STT</TableHead>
        <TableHead>Họ và tên</TableHead>
        <TableHead>Email</TableHead>
        <TableHead className="text-right">Phải đóng</TableHead>
        <TableHead className="text-right">Đã đóng</TableHead>
        {statusFilter ? (
          <ColumnFilterHead label="Trạng thái" className="w-32" {...statusFilter} />
        ) : (
          <TableHead className="w-32">Trạng thái</TableHead>
        )}
        <TableHead className="w-44">Ngày đóng</TableHead>
        <TableHead>Ghi chú</TableHead>
        <TableHead className="w-40">Sửa tay lúc</TableHead>
        <TableHead className="w-28 text-right">Lưu</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function TuitionTableFallback() {
  return (
    <Table>
      <TuitionTableHead />
      <TableBody>
        <TableSkeleton columnWidths={SKELETON_COLUMNS} />
      </TableBody>
    </Table>
  );
}

interface Props {
  classId: number;
  rows: TuitionListRow[];
  isPending: boolean;
  onRowSaved: (rowId: number) => void;
  /** Không truyền = header tĩnh (fallback/ngữ cảnh không có bộ lọc). */
  statusFilter?: TuitionStatusFilter;
  /** Đang lọc client-side — rows rỗng do lọc thì vẫn giữ header để gỡ bộ lọc được. */
  isFiltered?: boolean;
}

export default function TuitionTable({
  classId,
  rows,
  isPending,
  onRowSaved,
  statusFilter,
  isFiltered,
}: Props) {
  if (rows.length === 0 && !isFiltered) {
    return (
      <EmptyState
        icon={Wallet}
        title="Chưa có học sinh nào trong tháng này"
        description="Lớp chưa có buổi học trong tháng, hoặc chưa có học sinh nào đang theo học."
      />
    );
  }
  return (
    <div className={cn('transition-opacity', isPending && 'pointer-events-none opacity-60')}>
      <Table>
        <TuitionTableHead statusFilter={statusFilter} />
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                Không tìm thấy học sinh phù hợp với bộ lọc
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TuitionRow
                key={row.id}
                index={i + 1}
                classId={classId}
                row={row}
                onSaved={onRowSaved}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
