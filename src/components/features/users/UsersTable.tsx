'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Mail, Power, RotateCw, ShieldOff, Users as UsersIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { handleActionResult } from '@/lib/actions';
import { formatDate, formatDateTime } from '@/lib/format';
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
import DeleteUserButton from './DeleteUserButton';
import EditUserDialog from './EditUserDialog';
import { setUserStatusAction } from '@/actions/v1/users/set-user-status';
import type { Gender, Province, Role, UserRow, UserStatus } from '@/types/auth';

const SKELETON_COLUMNS = [
  'w-4',
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
  'w-32',
];

// Bảng này được stream qua Suspense — vẫn là SSR, nên ngày sinh dựng theo giờ máy sẽ
// lệch 1 ngày giữa server (UTC) và trình duyệt VN (UTC+7). Dùng helper đã ghim múi giờ.
function formatBirthday(value: string | null): string {
  return formatDate(value, '—');
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

function activationEmailCell(sentAt: string | null) {
  if (!sentAt) {
    return <span className="text-muted-foreground">Chưa gửi</span>;
  }
  return (
    <span className="text-muted-foreground text-sm whitespace-nowrap">
      Đã gửi lúc {formatDateTime(sentAt)}
    </span>
  );
}

interface ActivationAction {
  icon: typeof ShieldOff;
  label: string;
  variant: 'destructive' | 'success' | 'outline' | 'default';
  sentBefore: boolean;
  disabled?: boolean;
  title?: string;
}

// activationTokenValid đến từ BE (kiểm tra Redis trực tiếp — nguồn sự thật
// duy nhất) chứ không đoán bằng activationEmailSentAt + TTL ở FE.
function activationAction(u: UserRow): ActivationAction {
  if (u.status === 'ACTIVATED') {
    return { icon: ShieldOff, label: 'Vô hiệu hóa', variant: 'destructive', sentBefore: false };
  }
  if (u.status === 'DISABLED') {
    return { icon: Power, label: 'Kích hoạt lại', variant: 'success', sentBefore: false };
  }
  if (u.activationEmailSentAt) {
    if (u.activationTokenValid) {
      return {
        icon: Check,
        label: 'Đã gửi',
        variant: 'outline',
        sentBefore: true,
        disabled: true,
        title: `Đã gửi lúc ${formatDateTime(u.activationEmailSentAt)}`,
      };
    }
    return {
      icon: RotateCw,
      label: 'Gửi lại',
      variant: 'outline',
      sentBefore: true,
      title: `Đã gửi lúc ${formatDateTime(u.activationEmailSentAt)}`,
    };
  }
  return { icon: Mail, label: 'Gửi mail kích hoạt', variant: 'default', sentBefore: false };
}

interface Props {
  rows: UserRow[];
  provinces: Province[];
  loading?: boolean;
  selectedIds?: Set<number>;
  onToggleRow?: (id: number, checked: boolean) => void;
  onToggleAll?: (ids: number[], checked: boolean) => void;
}

export default function UsersTable({
  rows,
  provinces,
  loading,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const selectable = !loading && !!selectedIds && !!onToggleRow && !!onToggleAll;
  const rowIds = rows.map((u) => u.id);
  const allSelected = selectable && rowIds.length > 0 && rowIds.every((id) => selectedIds!.has(id));
  const someSelected = selectable && rowIds.some((id) => selectedIds!.has(id));

  function handleToggleStatus(id: number, current: UserStatus, sentBefore = false) {
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
      successMessage = sentBefore ? 'Đã gửi lại mail kích hoạt' : 'Đã gửi mail kích hoạt';
    }
    startTransition(async () => {
      const res = await setUserStatusAction(id, next);
      handleActionResult(res.errors, () => router.refresh(), successMessage);
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
          <TableHead className="w-10">
            {selectable && (
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => onToggleAll!(rowIds, checked === true)}
                aria-label="Chọn tất cả"
              />
            )}
          </TableHead>
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
          <TableHead className="min-w-40">Mail kích hoạt</TableHead>
          <TableHead className="min-w-37.5 text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeleton columnWidths={SKELETON_COLUMNS} />
        ) : (
          rows.map((u) => {
            const action = activationAction(u);
            const Icon = action.icon;
            return (
              <TableRow key={u.id}>
                <TableCell>
                  {selectable && (
                    <Checkbox
                      checked={selectedIds!.has(u.id)}
                      onCheckedChange={(checked) => onToggleRow!(u.id, checked === true)}
                      aria-label={`Chọn ${u.email}`}
                    />
                  )}
                </TableCell>
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
                <TableCell>{activationEmailCell(u.activationEmailSentAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant={action.variant}
                      className={action.disabled ? '' : 'cursor-pointer'}
                      disabled={pending || action.disabled}
                      title={action.title}
                      onClick={() => handleToggleStatus(u.id, u.status, action.sentBefore)}
                    >
                      <Icon /> {action.label}
                    </Button>
                    <EditUserDialog user={u} provinces={provinces} />
                    <DeleteUserButton userId={u.id} email={u.email} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
