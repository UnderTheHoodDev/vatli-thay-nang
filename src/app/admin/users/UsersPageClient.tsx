'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/app/PageHeader';
import StatsCard from '@/components/app/StatsCard';
import DataPagination from '@/components/app/DataPagination';
import UserSearchForm, { type UserSearchValues } from '@/components/features/users/UserSearchForm';
import UsersTable from '@/components/features/users/UsersTable';
import CreateUserDialog from '@/components/features/users/CreateUserDialog';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { ListMeta, Province, UserRow } from '@/types/auth';
import type { UsersListStats } from '@/types/actions/users';

export interface UrlState extends UserSearchValues {
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  rows: UserRow[];
  meta: ListMeta;
  stats: UsersListStats;
  provinces: Province[];
}

const SEARCH_KEYS: (keyof UserSearchValues)[] = [
  'email',
  'fullName',
  'gender',
  'provinceId',
  'schoolName',
  'parentPhonenumber',
  'role',
  'status',
];

function buildUrlParams(state: UrlState): URLSearchParams {
  const sp = new URLSearchParams();
  for (const key of SEARCH_KEYS) {
    const v = state[key];
    if (v && v !== ALL_VALUE && v !== '') sp.set(key, v);
  }
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

export default function UsersPageClient({ urlState, rows, meta, stats, provinces }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const params = buildUrlParams({ ...urlState, ...next });
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  const { page, pageSize } = urlState;
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Thêm, kích hoạt và quản lý tài khoản học sinh, quản trị viên."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard label="Tổng người dùng" value={stats.total} icon={Users} tone="primary" />
        <StatsCard label="Đã kích hoạt" value={stats.activated} icon={UserCheck} tone="success" />
        <StatsCard label="Chờ kích hoạt" value={stats.unactivated} icon={UserX} tone="warning" />
        <StatsCard label="Quản trị viên" value={stats.admins} icon={ShieldCheck} tone="muted" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <UserSearchForm
            provinces={provinces}
            initial={urlState}
            onSearch={(v) => updateUrl({ ...v, page: 1 })}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Danh sách người dùng</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có người dùng nào'
                : `Hiển thị ${start}–${end} trên tổng ${total} người dùng`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => updateUrl({ pageSize: Number(v), page: 1 })}
            >
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
            <CreateUserDialog />
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <UsersTable rows={rows} loading={isPending} />
        </CardContent>
        {totalPages > 1 && (
          <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              Trang {page} / {totalPages}
            </div>
            <DataPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => updateUrl({ page: p })}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
