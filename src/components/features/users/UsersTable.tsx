'use client';

import { useTransition } from 'react';
import { Mail, Power, ShieldOff, Users as UsersIcon } from 'lucide-react';
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
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import { setUserStatusAction } from '@/actions/v1/users/set-user-status';
import type { Gender, Role, UserRow, UserStatus } from '@/types/auth';

const SKELETON_COLUMNS = [
  'w-8',
  'w-48',
  'w-32',
  'w-12',
  'w-20',
  'w-20',
  'w-28',
  'w-24',
  'w-14',
  'w-28',
  'w-20',
  'w-32',
];

function formatBirthday(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function genderBadge(g: Gender | null) {
  if (!g) return <span className="text-muted-foreground">—</span>;
  if (g === 'MALE') return <Badge>Nam</Badge>;
  if (g === 'FEMALE') return <Badge variant="warning">Nữ</Badge>;
  return <Badge variant="secondary">Khác</Badge>;
}

function roleBadge(r: Role) {
  return r === 'ADMIN' ? <Badge>Admin</Badge> : <Badge variant="secondary">Học sinh</Badge>;
}

function statusBadge(s: UserStatus) {
  if (s === 'ACTIVATED') return <Badge variant="success">Kích hoạt</Badge>;
  if (s === 'DISABLED') return <Badge variant="destructive">Vô hiệu hóa</Badge>;
  return <Badge variant="secondary">Chưa kích hoạt</Badge>;
}

interface Props {
  rows: UserRow[];
  loading?: boolean;
}

export default function UsersTable({ rows, loading }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggleStatus(id: number, current: UserStatus) {
    let next: UserStatus;
    let successMessage: string;
    if (current === 'ACTIVATED') {
      next = 'DISABLED';
      successMessage = 'Đã vô hiệu hóa tài khoản';
    } else if (current === 'DISABLED') {
      next = 'ACTIVATED';
      successMessage = 'Đã kích hoạt lại tài khoản';
    } else {
      next = 'ACTIVATED';
      successMessage = 'Đã gửi mail kích hoạt';
    }
    startTransition(async () => {
      const res = await setUserStatusAction(id, next);
      handleActionResult(res.errors, undefined, successMessage);
    });
  }

  if (!loading && rows.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Không tìm thấy người dùng"
        description="Thay đổi bộ lọc hoặc tạo người dùng mới để bắt đầu."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-14">ID</TableHead>
            <TableHead className="min-w-45">Email</TableHead>
            <TableHead className="min-w-35">Họ và tên</TableHead>
            <TableHead>Giới tính</TableHead>
            <TableHead className="min-w-22.5">Ngày sinh</TableHead>
            <TableHead>Tỉnh</TableHead>
            <TableHead className="min-w-30">Trường</TableHead>
            <TableHead>SĐT phụ huynh</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead className="min-w-30">Lớp</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="min-w-37.5 text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton columnWidths={SKELETON_COLUMNS} />
          ) : (
            rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-muted-foreground">{u.id}</TableCell>
                <TableCell className="text-foreground font-medium">{u.email}</TableCell>
                <TableCell>{u.fullName ?? '—'}</TableCell>
                <TableCell>{genderBadge(u.gender)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatBirthday(u.birthday)}</TableCell>
                <TableCell>{u.province ?? '—'}</TableCell>
                <TableCell>{u.schoolName ?? '—'}</TableCell>
                <TableCell>{u.parentPhonenumber ?? '—'}</TableCell>
                <TableCell>{roleBadge(u.role)}</TableCell>
                <TableCell>
                  {u.classes && u.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.classes.map((c) => (
                        <Badge key={c.id} variant="outline" className="font-mono text-xs">
                          {c.code}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{statusBadge(u.status)}</TableCell>
                <TableCell className="text-right">
                  {u.status === 'ACTIVATED' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="cursor-pointer"
                      disabled={pending}
                      onClick={() => handleToggleStatus(u.id, u.status)}
                    >
                      <ShieldOff /> Vô hiệu hóa
                    </Button>
                  ) : u.status === 'DISABLED' ? (
                    <Button
                      size="sm"
                      variant="success"
                      className="cursor-pointer"
                      disabled={pending}
                      onClick={() => handleToggleStatus(u.id, u.status)}
                    >
                      <Power /> Kích hoạt lại
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      className="cursor-pointer"
                      disabled={pending}
                      onClick={() => handleToggleStatus(u.id, u.status)}
                    >
                      <Mail /> Gửi mail kích hoạt
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
  );
}
