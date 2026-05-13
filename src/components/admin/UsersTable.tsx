'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { setUserStatus } from '@/lib/api/users';
import { extractErrors } from '@/lib/axios';
import type { Gender, Role, UserRow, UserStatus } from '@/types/auth';

function formatBirthday(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function genderBadge(g: Gender | null) {
  if (!g) return <span className="text-gray-400">-</span>;
  if (g === 'MALE') return <Badge>Nam</Badge>;
  if (g === 'FEMALE') return <Badge variant="warning">Nữ</Badge>;
  return <Badge variant="secondary">Khác</Badge>;
}

function roleBadge(r: Role) {
  return r === 'ADMIN' ? <Badge>Admin</Badge> : <Badge variant="secondary">Học sinh</Badge>;
}

function statusBadge(s: UserStatus) {
  return s === 'ACTIVATED' ? (
    <Badge variant="success">Kích hoạt</Badge>
  ) : (
    <Badge variant="destructive">Chưa kích hoạt</Badge>
  );
}

interface Props {
  rows: UserRow[];
  isLoading: boolean;
}

export default function UsersTable({ rows, isLoading }: Props) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      setUserStatus(id, status),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      extractErrors(err).forEach((m) => toast.error(m));
    },
  });

  return (
    <div className="rounded-lg border border-divider bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead>Giới tính</TableHead>
            <TableHead>Ngày sinh</TableHead>
            <TableHead>Tỉnh</TableHead>
            <TableHead>Trường</TableHead>
            <TableHead>SĐT phụ huynh</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                Đang tải...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                Không tìm thấy user nào
              </TableCell>
            </TableRow>
          ) : (
            rows.map((u) => {
              const activated = u.status === 'ACTIVATED';
              return (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{u.fullName ?? '-'}</TableCell>
                  <TableCell>{genderBadge(u.gender)}</TableCell>
                  <TableCell>{formatBirthday(u.birthday)}</TableCell>
                  <TableCell>{u.province ?? '-'}</TableCell>
                  <TableCell>{u.schoolName ?? '-'}</TableCell>
                  <TableCell>{u.parentPhonenumber ?? '-'}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>{statusBadge(u.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={activated ? 'destructive' : 'outline'}
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: u.id,
                          status: activated ? 'UNACTIVATED' : 'ACTIVATED',
                        })
                      }
                    >
                      {activated ? (
                        <>
                          <Power /> Deactivate
                        </>
                      ) : (
                        <>
                          <Mail /> Gửi mail kích hoạt
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
