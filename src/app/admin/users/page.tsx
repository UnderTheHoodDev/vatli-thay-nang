'use client';

import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UserSearchForm, {
  EMPTY_SEARCH,
  toApiParams,
  UserSearchValues,
} from '@/components/admin/UserSearchForm';
import UsersTable from '@/components/admin/UsersTable';
import CreateUserDialog from '@/components/admin/CreateUserDialog';
import { listUsers } from '@/lib/api/users';
import { listProvinces } from '@/lib/api/provinces';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';

export default function UsersPage() {
  const [search, setSearch] = useState<UserSearchValues>(EMPTY_SEARCH);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const apiParams = useMemo(() => toApiParams(search), [search]);

  const provincesQuery = useQuery({
    queryKey: ['provinces'],
    queryFn: listProvinces,
    staleTime: 60 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ['users', apiParams, page, pageSize],
    queryFn: () => listUsers({ ...apiParams, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const total = usersQuery.data?.meta.total ?? 0;
  const rows = usersQuery.data?.data ?? [];
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-paytone text-2xl text-purple">Quản lý người dùng</h1>
      </div>

      <UserSearchForm
        provinces={provincesQuery.data ?? []}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          {total} học sinh: {start} ~ {end}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hiển thị</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-24">
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
      </div>

      <UsersTable rows={rows} isLoading={usersQuery.isLoading} />

      <div className="flex items-center justify-end gap-3 pt-2">
        <div className="text-sm text-gray-500">
          Trang {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
