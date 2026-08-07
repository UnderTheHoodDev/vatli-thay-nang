'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { ClassRow } from '@/types/class-management';

interface Props {
  classes: ClassRow[];
  value?: number;
  disabled?: boolean;
  onChange: (classId?: number) => void;
}

export default function TuitionClassFilterSelect({ classes, value, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = classes.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className="border-input-border hover:text-foreground w-full cursor-pointer justify-between bg-white font-normal hover:bg-white sm:w-72"
        >
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-mono text-xs">{selected.code}</span>
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Tất cả các lớp</span>
          )}
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Tìm lớp..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy lớp nào</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn('mr-2 size-4 shrink-0', !value ? 'opacity-100' : 'opacity-0')}
                />
                Tất cả các lớp
              </CommandItem>
              {classes.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.code} ${c.name}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4 shrink-0',
                      value === c.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-mono text-xs">{c.code}</span>
                    <span className="text-muted-foreground truncate">{c.name}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
