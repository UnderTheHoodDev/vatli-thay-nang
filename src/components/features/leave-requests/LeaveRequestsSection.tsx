'use client';

import { useMemo, useState } from 'react';
import { FileX2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import ColumnFilterHead, {
  type ColumnFilterOption,
} from '@/components/app/table-filters/ColumnFilterHead';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { LeaveRequestListRow } from '@/types/actions/leave-requests';
import type { ListMeta } from '@/types/auth';

const LEAVE_TYPE_OPTIONS: ColumnFilterOption[] = [
  { value: 'FULL_SESSION', label: 'Cả buổi' },
  { value: 'EARLY_LEAVE', label: 'Rời sớm' },
];

interface Props {
  data: LeaveRequestListRow[];
  meta: ListMeta;
}

export default function LeaveRequestsSection({ data, meta }: Props) {
  // Lọc thuần client-side (data đã tải hết) — không cần debounce hay URL sync.
  const [q, setQ] = useState('');
  const [leaveType, setLeaveType] = useState<string>(ALL_VALUE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter((r) => {
      const matchQ =
        !needle ||
        (r.student.fullName ?? '').toLowerCase().includes(needle) ||
        r.student.email.toLowerCase().includes(needle);
      const matchType = leaveType === ALL_VALUE || r.leaveType === leaveType;
      return matchQ && matchType;
    });
  }, [data, q, leaveType]);

  // Đổi bộ lọc thì về trang 1 — tránh đứng ở trang không còn dữ liệu.
  const handleQChange = (v: string) => {
    setQ(v);
    setPage(1);
  };
  const handleLeaveTypeChange = (v: string) => {
    setLeaveType(v);
    setPage(1);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page, pageSize],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Danh sách xin nghỉ</CardTitle>
          <Badge variant="secondary">{meta.total}</Badge>
        </div>
        <CardDescription>
          Danh sách yêu cầu xin nghỉ của học sinh trong buổi học này
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-4 sm:pb-6">
        <TableSearchInput
          value={q}
          onChange={handleQChange}
          placeholder="Tìm theo họ tên hoặc email…"
        />

        {data.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title="Chưa có yêu cầu xin nghỉ"
            description="Chưa có học sinh nào gửi yêu cầu xin nghỉ cho buổi học này"
          />
        ) : (
          <>
            <div className="border-divider rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-40">Họ tên</TableHead>
                    <TableHead className="min-w-45">Email</TableHead>
                    <TableHead className="min-w-50">Lý do</TableHead>
                    <ColumnFilterHead
                      label="Loại nghỉ"
                      className="min-w-32.5"
                      value={leaveType}
                      options={LEAVE_TYPE_OPTIONS}
                      onChange={handleLeaveTypeChange}
                    />
                    <TableHead className="min-w-37.5">Thời gian gửi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-center">
                        Không tìm thấy học sinh phù hợp
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-foreground font-medium">
                          {row.student.fullName ?? row.student.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.student.email}
                        </TableCell>
                        <TableCell className="text-foreground text-sm">{row.reason}</TableCell>
                        <TableCell>
                          {row.leaveType === 'EARLY_LEAVE' ? (
                            <Badge variant="outline">Rời sớm</Badge>
                          ) : (
                            <Badge variant="secondary">Cả buổi</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(row.submittedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span>Hiển thị</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => handlePageSizeChange(Number(v))}
                >
                  <SelectTrigger className="w-24 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>/ {filteredRows.length} yêu cầu</span>
              </div>
              <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
