'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileX2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/app/EmptyState';
import { handleActionResult } from '@/lib/actions';
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

  const handleAcknowledge = async (leaveRequestId: number) => {
    setLoadingId(leaveRequestId);
    try {
      const result = await acknowledgeLeaveRequestAction(leaveRequestId);
      handleActionResult(
        result.errors,
        () => {
          router.refresh();
        },
        'Xác nhận xin nghỉ thành công',
      );
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
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title="Chưa có yêu cầu xin nghỉ"
            description="Chưa có học sinh nào gửi yêu cầu xin nghỉ cho buổi học này"
          />
        ) : (
          <div className="border-divider overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[160px]">Họ tên</TableHead>
                  <TableHead className="min-w-[180px]">Email</TableHead>
                  <TableHead className="min-w-[200px]">Lý do</TableHead>
                  <TableHead className="min-w-[150px]">Thời gian gửi</TableHead>
                  <TableHead className="w-28 text-center">Trạng thái</TableHead>
                  <TableHead className="w-28 text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-foreground font-medium">
                      {row.student.fullName ?? row.student.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.student.email}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">{row.reason}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
