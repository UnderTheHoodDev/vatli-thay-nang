'use client';

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import { Users, UserCheck, UserX, ShieldCheck, ShieldOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/app/PageHeader';
import StatsCard from '@/components/app/StatsCard';
import StatsGridSkeleton from '@/components/app/StatsGridSkeleton';
import TablePagerFooter from '@/components/app/TablePagerFooter';
import AdvancedFiltersButton from '@/components/app/table-filters/AdvancedFiltersButton';
import FilterChips, { type FilterChip } from '@/components/app/table-filters/FilterChips';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { useTableFilters } from '@/components/app/table-filters/useTableFilters';
import ProvinceCombobox from '@/components/features/users/ProvinceCombobox';
import UsersTable, { type UsersHeaderFilters } from '@/components/features/users/UsersTable';
import CreateUserDialog from '@/components/features/users/CreateUserDialog';
import BulkDeleteUsersButton from '@/components/features/users/BulkDeleteUsersButton';
import {
  ALL_VALUE,
  GENDER_OPTIONS,
  PAGE_SIZE_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/constants';
import type { Province } from '@/types/auth';
import type { IListUsersResult } from '@/types/actions/users';

export interface ClassOption {
  id: number;
  code: string;
  name: string;
}

export interface UrlState {
  /** Tìm gộp: email, họ tên, trường, SĐT phụ huynh. */
  q: string;
  gender: string;
  provinceId: string;
  role: string;
  status: string;
  classId: string;
  page: number;
  pageSize: number;
  [key: string]: string | number;
}

interface Props {
  urlState: UrlState;
  usersPromise: Promise<IListUsersResult>;
  provinces: Province[];
  classes: ClassOption[];
}

const DEFAULTS: UrlState = {
  q: '',
  gender: ALL_VALUE,
  provinceId: ALL_VALUE,
  role: ALL_VALUE,
  status: ALL_VALUE,
  classId: ALL_VALUE,
  page: 1,
  pageSize: 20,
};

const STATS_GRID = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

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
  provinces,
  isPending,
  selectedIds,
  onToggleRow,
  onToggleAll,
  headerFilters,
}: {
  promise: Promise<IListUsersResult>;
  provinces: Province[];
  isPending: boolean;
  selectedIds: Set<number>;
  onToggleRow: (id: number, checked: boolean) => void;
  onToggleAll: (ids: number[], checked: boolean) => void;
  headerFilters: UsersHeaderFilters;
}) {
  const { data: rows } = use(promise);
  return (
    <UsersTable
      rows={rows}
      provinces={provinces}
      loading={isPending}
      selectedIds={selectedIds}
      onToggleRow={onToggleRow}
      onToggleAll={onToggleAll}
      headerFilters={headerFilters}
    />
  );
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const filters = useTableFilters({ urlState, defaults: DEFAULTS });

  // Đổi trang/lọc/tìm kiếm (usersPromise đổi identity) thì bỏ chọn — tránh giữ
  // selection trỏ tới id không còn hiển thị trên trang hiện tại.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(new Set());
  }, [usersPromise]);

  const toggleRow = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: number[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const { page, pageSize } = urlState;

  // Lọc theo cột — dropdown ngay trên header bảng.
  const headerFilters: UsersHeaderFilters = {
    gender: {
      value: urlState.gender,
      options: [...GENDER_OPTIONS],
      onChange: (v) => filters.setValue('gender', v),
    },
    role: {
      value: urlState.role,
      options: [...ROLE_OPTIONS],
      onChange: (v) => filters.setValue('role', v),
    },
    status: {
      value: urlState.status,
      options: [...STATUS_OPTIONS],
      onChange: (v) => filters.setValue('status', v),
    },
    classId: {
      value: urlState.classId,
      options: classes.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` })),
      onChange: (v) => filters.setValue('classId', v),
    },
  };

  // Chip cho các lọc không nhìn thấy trực tiếp (q đã hiện trong ô search).
  const optionLabel = (opts: readonly { value: string; label: string }[], v: string) =>
    opts.find((o) => o.value === v)?.label ?? v;
  const chips: FilterChip[] = [];
  if (urlState.gender !== ALL_VALUE)
    chips.push({ key: 'gender', label: `Giới tính: ${optionLabel(GENDER_OPTIONS, urlState.gender)}` });
  if (urlState.role !== ALL_VALUE)
    chips.push({ key: 'role', label: `Vai trò: ${optionLabel(ROLE_OPTIONS, urlState.role)}` });
  if (urlState.status !== ALL_VALUE)
    chips.push({ key: 'status', label: `Trạng thái: ${optionLabel(STATUS_OPTIONS, urlState.status)}` });
  if (urlState.classId !== ALL_VALUE) {
    const cls = classes.find((c) => String(c.id) === urlState.classId);
    chips.push({ key: 'classId', label: `Lớp: ${cls ? cls.code : urlState.classId}` });
  }
  if (urlState.provinceId !== ALL_VALUE) {
    const p = provinces.find((x) => String(x.id) === urlState.provinceId);
    chips.push({ key: 'provinceId', label: `Tỉnh: ${p ? p.name : urlState.provinceId}` });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Thêm, kích hoạt và quản lý tài khoản học sinh, quản trị viên."
      />

      <Suspense fallback={<StatsGridSkeleton count={5} className={STATS_GRID} />}>
        <UsersStatsSection promise={usersPromise} />
      </Suspense>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                onValueChange={(v) => filters.setPaging({ pageSize: Number(v), page: 1 })}
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
              {selectedIds.size > 0 && (
                <BulkDeleteUsersButton
                  selectedIds={Array.from(selectedIds)}
                  onDone={() => setSelectedIds(new Set())}
                />
              )}
              <CreateUserDialog />
            </div>
          </div>

          {/* Thanh lọc: search gộp gõ-là-lọc + lọc ít dùng trong popover + chips. */}
          <div className="flex flex-wrap items-center gap-2">
            <TableSearchInput
              value={filters.value('q')}
              onChange={(v) => filters.setText('q', v)}
              placeholder="Tìm theo email, họ tên, trường, SĐT phụ huynh…"
              isPending={filters.isPending}
            />
            <AdvancedFiltersButton activeCount={urlState.provinceId !== ALL_VALUE ? 1 : 0}>
              <div className="space-y-2">
                <Label>Tỉnh</Label>
                <ProvinceCombobox
                  value={urlState.provinceId}
                  onChange={(v) => filters.setValue('provinceId', v)}
                  provinces={provinces}
                  allOption={{ value: ALL_VALUE, label: 'Tất cả' }}
                />
              </div>
            </AdvancedFiltersButton>
            <FilterChips
              chips={chips}
              onRemove={(key) => filters.setValue(key, ALL_VALUE)}
              onClearAll={filters.clearAll}
            />
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <Suspense
            fallback={
              <UsersTable rows={[]} provinces={provinces} loading headerFilters={headerFilters} />
            }
          >
            <UsersTableSection
              promise={usersPromise}
              provinces={provinces}
              isPending={filters.isPending}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              headerFilters={headerFilters}
            />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <UsersPaginationSection
            promise={usersPromise}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => filters.setPaging({ page: p })}
          />
        </Suspense>
      </Card>
    </div>
  );
}
