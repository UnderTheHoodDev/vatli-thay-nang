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

interface Props {
  provinces: Province[];
  initial: UserSearchValues;
  onSearch: (values: UserSearchValues) => void;
}

export default function UserSearchForm({ provinces, initial, onSearch }: Props) {
  const [values, setValues] = useState<UserSearchValues>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [provinceOpen, setProvinceOpen] = useState(false);

  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setValues(initial);
  }

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
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          placeholder="Nguyễn Văn A"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Giới tính</Label>
        <Select value={values.gender} onValueChange={(v) => update('gender', v)}>
          <SelectTrigger className="cursor-pointer">
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
            <Button
              variant="outline"
              type="button"
              className="w-full cursor-pointer justify-between font-normal"
            >
              <span className="truncate">{provinceLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
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
          placeholder="THPT ..."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="parentPhone">SĐT phụ huynh</Label>
        <Input
          id="parentPhone"
          value={values.parentPhonenumber}
          onChange={(e) => update('parentPhonenumber', e.target.value)}
          placeholder="0xxxxxxxxx"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Vai trò</Label>
        <Select value={values.role} onValueChange={(v) => update('role', v)}>
          <SelectTrigger className="cursor-pointer">
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
          <SelectTrigger className="cursor-pointer">
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
      <div className="flex flex-col justify-end gap-2 sm:flex-row md:col-span-2 lg:col-span-4">
        <Button type="button" variant="outline" onClick={reset} className="cursor-pointer">
          <X /> Xoá bộ lọc
        </Button>
        <Button type="submit" className="cursor-pointer">
          <Search /> Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
