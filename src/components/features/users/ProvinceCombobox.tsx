'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Province } from '@/types/auth';

interface Props {
  value: string;
  onChange: (value: string) => void;
  provinces: Province[];
  disabled?: boolean;
  /** Chỉ dùng cho form lọc (có lựa chọn "Tất cả") — bỏ qua với form nhập liệu. */
  allOption?: { value: string; label: string };
}

export default function ProvinceCombobox({ value, onChange, provinces, disabled, allOption }: Props) {
  const [open, setOpen] = useState(false);

  const label =
    allOption && value === allOption.value
      ? allOption.label
      : (provinces.find((p) => String(p.id) === value)?.name ?? 'Chọn tỉnh');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className="border-input-border hover:text-foreground w-full cursor-pointer justify-between bg-white px-3 font-normal hover:bg-white"
          disabled={disabled}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Tìm tỉnh..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy tỉnh</CommandEmpty>
            <CommandGroup>
              {allOption && (
                <CommandItem
                  onSelect={() => {
                    onChange(allOption.value);
                    setOpen(false);
                  }}
                >
                  {allOption.label}
                </CommandItem>
              )}
              {provinces.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onChange(String(p.id));
                    setOpen(false);
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
  );
}
