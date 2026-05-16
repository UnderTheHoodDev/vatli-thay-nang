'use client';

import { useTransition } from 'react';
import { Mail, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { handleActionResult } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { setUserStatusAction } from '@/actions/v1/users/set-user-status';
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
}

export default function UsersTable({ rows }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggleStatus(id: number, current: UserStatus) {
    const next: UserStatus = current === 'ACTIVATED' ? 'UNACTIVATED' : 'ACTIVATED';
    startTransition(async () => {
      try {
        const res = await setUserStatusAction(id, next);
        const successMessage =
          next === 'ACTIVATED'
            ? 'Gửi mail kích hoạt thành công'
            : 'Vô hiệu hoá tài khoản thành công';
        handleActionResult(res.errors, undefined, successMessage);
      } finally {
      }
    });
  }

  return (
    <div className="border-divider rounded-lg border bg-white">
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-12 text-center text-gray-400">
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
                      disabled={pending}
                      onClick={() => handleToggleStatus(u.id, u.status)}
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
