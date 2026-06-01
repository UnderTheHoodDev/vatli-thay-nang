'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileX2, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { handleActionResult } from '@/lib/actions';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { acknowledgeLeaveRequestAction } from '@/actions/v1/leave-requests/acknowledge-leave-request';
import type { LeaveRequestListRow } from '@/types/actions/leave-requests';
import type { ListMeta } from '@/types/auth';

interface Props {
  data: LeaveRequestListRow[];
  meta: ListMeta;
}

export default function LeaveRequestsSection({ data, meta }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedEmail, setAppliedEmail] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const filteredRows = useMemo(() => {
    const name = appliedName.trim().toLowerCase();
    const email = appliedEmail.trim().toLowerCase();
    return data.filter((r) => {
      const matchName =
        !name ||
        (r.student.fullName ?? '').toLowerCase().includes(name) ||
        r.student.email.toLowerCase().includes(name);
      const matchEmail = !email || r.student.email.toLowerCase().includes(email);
      return matchName && matchEmail;
    });
  }, [data, appliedName, appliedEmail]);

  const handleSearch = () => {
    setAppliedName(nameInput);
    setAppliedEmail(emailInput);
    setPage(1);
  };

  const handleClear = () => {
    setNameInput('');
    setEmailInput('');
    setAppliedName('');
    setAppliedEmail('');
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const isFiltering = !!appliedName || !!appliedEmail;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page, pageSize],
  );

  const handleAcknowledge = async (leaveRequestId: number) => {
    setLoadingId(leaveRequestId);
    try {
      const result = await acknowledgeLeaveRequestAction(leaveRequestId);
      handleActionResult(result.errors, () => router.refresh(), 'Xác nhận xin nghỉ thành công');
    } finally {
      setLoadingId(null);
    }
  };

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
      <CardContent className="space-y-4 pb-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-45 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Họ tên..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8"
            />
          </div>
          <div className="relative min-w-45 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Email..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8"
            />
          </div>
          <Button variant="default" onClick={handleSearch}>
            <Search className="size-4" />
            Tìm kiếm
          </Button>
          {isFiltering && (
            <Button variant="ghost" onClick={handleClear}>
              <X className="size-4" />
              Xoá bộ lọc
            </Button>
          )}
        </div>

        {data.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title="Chưa có yêu cầu xin nghỉ"
            description="Chưa có học sinh nào gửi yêu cầu xin nghỉ cho buổi học này"
          />
        ) : (
          <>
            <div className="border-divider overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-40">Họ tên</TableHead>
                    <TableHead className="min-w-45">Email</TableHead>
                    <TableHead className="min-w-50">Lý do</TableHead>
                    <TableHead className="min-w-32.5">Loại nghỉ</TableHead>
                    <TableHead className="min-w-37.5">Thời gian gửi</TableHead>
                    <TableHead className="w-28 text-center">Trạng thái</TableHead>
                    <TableHead className="w-28 text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground text-center">
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
                        <TableCell className="text-center">
                          {row.status === 'ACKNOWLEDGED' ? (
                            <Badge variant="success">Đã duyệt</Badge>
                          ) : (
                            <Badge variant="warning">Chờ duyệt</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.status === 'SUBMITTED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="cursor-pointer"
                              disabled={loadingId === row.id}
                              onClick={() => handleAcknowledge(row.id)}
                            >
                              {loadingId === row.id ? 'Đang xử lý...' : 'Xác nhận'}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
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
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border-input bg-background rounded-md border px-2 py-1 text-sm focus:outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
