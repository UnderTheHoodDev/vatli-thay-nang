'use client';

import { Suspense, use, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, UserCheck, UserX, ShieldCheck, ShieldOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/app/PageHeader';
import StatsCard from '@/components/app/StatsCard';
import StatsGridSkeleton from '@/components/app/StatsGridSkeleton';
import TablePagerFooter from '@/components/app/TablePagerFooter';
import UserSearchForm, {
  type UserSearchValues,
  type ClassOption,
} from '@/components/features/users/UserSearchForm';
import UsersTable from '@/components/features/users/UsersTable';
import CreateUserDialog from '@/components/features/users/CreateUserDialog';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { Province } from '@/types/auth';
import type { IListUsersResult } from '@/types/actions/users';

export interface UrlState extends UserSearchValues {
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  usersPromise: Promise<IListUsersResult>;
  provinces: Province[];
  classes: ClassOption[];
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
  'classId',
];

const STATS_GRID = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

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

function UsersStatsSection({ promise }: { promise: Promise<IListUsersResult> }) {
  const { stats } = use(promise);
  return (
    <div className={`grid gap-3 ${STATS_GRID}`}>
      <StatsCard label="Tổng người dùng" value={stats.total} icon={Users} tone="primary" />
      <StatsCard label="Đã kích hoạt" value={stats.activated} icon={UserCheck} tone="success" />
      <StatsCard label="Chờ kích hoạt" value={stats.unactivated} icon={UserX} tone="warning" />
      <StatsCard label="Vô hiệu hóa" value={stats.disabled} icon={ShieldOff} tone="destructive" />
      <StatsCard label="Quản trị viên" value={stats.admins} icon={ShieldCheck} tone="info" />
    </div>
  );
}

function UsersResultSummary({
  promise,
  page,
  pageSize,
}: {
  promise: Promise<IListUsersResult>;
  page: number;
  pageSize: number;
}) {
  const { meta } = use(promise);
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {total === 0
        ? 'Chưa có người dùng nào'
        : `Hiển thị ${start}–${end} trên tổng ${total} người dùng`}
    </p>
  );
}

function UsersTableSection({
  promise,
  isPending,
}: {
  promise: Promise<IListUsersResult>;
  isPending: boolean;
}) {
  const { data: rows } = use(promise);
  return <UsersTable rows={rows} loading={isPending} />;
}

function UsersPaginationSection({
  promise,
  page,
  pageSize,
  onPageChange,
}: {
  promise: Promise<IListUsersResult>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { meta } = use(promise);
  const totalPages = Math.max(1, Math.ceil(meta.total / pageSize));
  return <TablePagerFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}

export default function UsersPageClient({ urlState, usersPromise, provinces, classes }: Props) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Thêm, kích hoạt và quản lý tài khoản học sinh, quản trị viên."
      />

      <Suspense fallback={<StatsGridSkeleton count={5} className={STATS_GRID} />}>
        <UsersStatsSection promise={usersPromise} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <UserSearchForm
            provinces={provinces}
            classes={classes}
            initial={urlState}
            onSearch={(v) => updateUrl({ ...v, page: 1 })}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Danh sách người dùng</CardTitle>
            <Suspense fallback={<Skeleton className="mt-1 h-4 w-60" />}>
              <UsersResultSummary promise={usersPromise} page={page} pageSize={pageSize} />
            </Suspense>
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
          <Suspense fallback={<UsersTable rows={[]} loading />}>
            <UsersTableSection promise={usersPromise} isPending={isPending} />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <UsersPaginationSection
            promise={usersPromise}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => updateUrl({ page: p })}
          />
        </Suspense>
      </Card>
    </div>
  );
}
