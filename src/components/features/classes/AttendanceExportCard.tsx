'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useAttendanceExport } from '@/hooks/useAttendanceExport';
import type { ClassRow } from '@/types/class-management';

interface Props {
  classes: ClassRow[];
}

export default function AttendanceExportCard({ classes }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { from, setFrom, to, setTo, format, setFormat, loading, handleExport } =
    useAttendanceExport(selectedIds);

  const selectedClasses = useMemo(
    () => classes.filter((c) => selectedIds.includes(c.id)),
    [classes, selectedIds],
  );

  function toggleClass(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tải điểm danh nhiều lớp</CardTitle>
        <p className="text-muted-foreground mt-1 text-sm">
          Xuất báo cáo tổng hợp điểm danh cho các lớp đã chọn theo khoảng thời gian.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Lớp</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full cursor-pointer justify-between font-normal"
                >
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-hidden">
                    {selectedClasses.length === 0 ? (
                      <span className="text-muted-foreground">Chọn lớp...</span>
                    ) : (
                      selectedClasses.map((c) => (
                        <Badge key={c.id} variant="secondary" className="font-mono">
                          {c.code}
                        </Badge>
                      ))
                    )}
                  </span>
                  <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Tìm lớp..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy lớp nào</CommandEmpty>
                    <CommandGroup>
                      {classes.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.code} ${c.name}`}
                          onSelect={() => toggleClass(c.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 size-4 shrink-0',
                              selectedIds.includes(c.id) ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="font-mono text-xs">{c.code}</span>
                          <span className="text-muted-foreground ml-2 truncate">{c.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="export-from">Từ ngày</Label>
            <Input
              id="export-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="export-to">Đến ngày</Label>
            <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <RadioGroup
            value={format}
            onValueChange={(v) => setFormat(v as 'csv' | 'xlsx')}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="csv" id="export-format-csv" />
              <Label htmlFor="export-format-csv" className="cursor-pointer font-normal">
                CSV
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="xlsx" id="export-format-xlsx" />
              <Label htmlFor="export-format-xlsx" className="cursor-pointer font-normal">
                Excel
              </Label>
            </div>
          </RadioGroup>
          <Button
            onClick={handleExport}
            disabled={loading || selectedIds.length === 0}
            className="cursor-pointer"
          >
            <Download /> {loading ? 'Đang xuất...' : 'Tải điểm danh'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
