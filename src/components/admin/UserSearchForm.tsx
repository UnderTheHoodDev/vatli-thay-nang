'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ALL_VALUE, GENDER_OPTIONS, ROLE_OPTIONS, STATUS_OPTIONS } from '@/lib/constants';
import type { Province } from '@/types/auth';
import type { ListUsersParams } from '@/lib/api/users';

export interface UserSearchValues {
  email: string;
  fullName: string;
  gender: string;
  provinceId: string;
  schoolName: string;
  parentPhonenumber: string;
  role: string;
  status: string;
}

export const EMPTY_SEARCH: UserSearchValues = {
  email: '',
  fullName: '',
  gender: ALL_VALUE,
  provinceId: ALL_VALUE,
  schoolName: '',
  parentPhonenumber: '',
  role: ALL_VALUE,
  status: ALL_VALUE,
};

export function toApiParams(v: UserSearchValues): Omit<ListUsersParams, 'page' | 'pageSize'> {
  return {
    email: v.email || undefined,
    fullName: v.fullName || undefined,
    gender: v.gender !== ALL_VALUE ? v.gender : undefined,
    provinceId: v.provinceId !== ALL_VALUE ? Number(v.provinceId) : undefined,
    schoolName: v.schoolName || undefined,
    parentPhonenumber: v.parentPhonenumber || undefined,
    role: v.role !== ALL_VALUE ? v.role : undefined,
    status: v.status !== ALL_VALUE ? v.status : undefined,
  };
}

interface Props {
  provinces: Province[];
  onSearch: (values: UserSearchValues) => void;
}

export default function UserSearchForm({ provinces, onSearch }: Props) {
  const [values, setValues] = useState<UserSearchValues>(EMPTY_SEARCH);
  const [provinceOpen, setProvinceOpen] = useState(false);

  function update<K extends keyof UserSearchValues>(key: K, value: UserSearchValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(values);
  }

  function reset() {
    setValues(EMPTY_SEARCH);
    onSearch(EMPTY_SEARCH);
  }

  const provinceLabel =
    values.provinceId === ALL_VALUE
      ? 'Tất cả'
      : (provinces.find((p) => String(p.id) === values.provinceId)?.name ?? 'Chọn tỉnh');

  return (
    <form
      onSubmit={submit}
      className="border-divider grid grid-cols-1 gap-4 rounded-lg border bg-white p-4 md:grid-cols-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="example@vltn.vn"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input
          id="fullName"
          value={values.fullName}
          onChange={(e) => update('fullName', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Giới tính</Label>
        <Select value={values.gender} onValueChange={(v) => update('gender', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
            {GENDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Tỉnh</Label>
        <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" className="w-full justify-between font-normal">
              <span className="truncate">{provinceLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Tìm tỉnh..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy tỉnh</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      update('provinceId', ALL_VALUE);
                      setProvinceOpen(false);
                    }}
                  >
                    Tất cả
                  </CommandItem>
                  {provinces.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        update('provinceId', String(p.id));
                        setProvinceOpen(false);
                      }}
                    >
                      {p.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="schoolName">Trường</Label>
        <Input
          id="schoolName"
          value={values.schoolName}
          onChange={(e) => update('schoolName', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="parentPhone">SĐT phụ huynh</Label>
        <Input
          id="parentPhone"
          value={values.parentPhonenumber}
          onChange={(e) => update('parentPhonenumber', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Vai trò</Label>
        <Select value={values.role} onValueChange={(v) => update('role', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
            {ROLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Trạng thái</Label>
        <Select value={values.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 md:col-span-4">
        <Button type="button" variant="outline" onClick={reset}>
          <X /> Xoá
        </Button>
        <Button type="submit">
          <Search /> Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
