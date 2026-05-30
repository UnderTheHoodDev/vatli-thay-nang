'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUploadManager } from './UploadManagerProvider';

function formatBytes(n: number): string {
  if (!n || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function UploadTray() {
  const { tasks, pause, resume, cancel, retry } = useUploadManager();
  const [collapsed, setCollapsed] = useState(false);

  if (tasks.length === 0) return null;

  const activeCount = tasks.filter(
    (t) => t.phase === 'uploading' || t.phase === 'queued',
  ).length;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div className="border-divider bg-background overflow-hidden rounded-lg border shadow-lg">
        <div className="bg-muted/40 flex items-center gap-2 px-3 py-2">
          <Upload className="text-muted-foreground size-4" />
          <span className="text-foreground flex-1 text-sm font-medium">
            {activeCount > 0
              ? `Đang tải lên ${activeCount} video`
              : 'Tải lên hoàn tất'}
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {collapsed ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>

        {!collapsed && (
          <ul className="divide-divider max-h-80 divide-y overflow-y-auto">
            {tasks.map((t) => (
              <li key={t.id} className="space-y-1.5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-foreground min-w-0 flex-1 truncate text-sm">
                    {t.fileName}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatBytes(t.fileSize)}
                  </span>
                </div>

                <div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full transition-all',
                      t.phase === 'error' ? 'bg-destructive' : 'bg-purple',
                    )}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    {t.phase === 'uploading' && (
                      <>
                        <Loader2 className="size-3 animate-spin" /> {t.progress}%
                      </>
                    )}
                    {t.phase === 'queued' && <>Đang chờ...</>}
                    {t.phase === 'paused' && <>Tạm dừng · {t.progress}%</>}
                    {t.phase === 'done' && (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="size-3" /> Hoàn tất
                      </span>
                    )}
                    {t.phase === 'error' && (
                      <span className="text-destructive">Lỗi tải lên</span>
                    )}
                  </span>

                  <div className="flex items-center gap-0.5">
                    {t.phase === 'uploading' && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="cursor-pointer"
                        title="Tạm dừng"
                        onClick={() => pause(t.id)}
                      >
                        <Pause />
                      </Button>
                    )}
                    {t.phase === 'paused' && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="cursor-pointer"
                        title="Tiếp tục"
                        onClick={() => resume(t.id)}
                      >
                        <Play />
                      </Button>
                    )}
                    {t.phase === 'error' && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="cursor-pointer"
                        title="Thử lại"
                        onClick={() => retry(t.id)}
                      >
                        <RotateCcw />
                      </Button>
                    )}
                    {t.phase !== 'done' && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        title="Huỷ (xoá mục)"
                        onClick={() => void cancel(t.id)}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
