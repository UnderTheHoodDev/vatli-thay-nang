'use client';

import { useRef } from 'react';
import { CheckCircle2, Trash2, Upload, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleActionErrors } from '@/lib/actions';
import { BUNNY_STATUS_META } from '@/types/course-management';
import type { BunnyVideoStatus } from '@/types/course-management';

export const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

interface Props {
  /** File đã chọn (sẽ upload qua TUS sau khi submit). */
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  /** Edit mode: trạng thái video hiện có (nếu chưa chọn file mới). */
  existingStatus?: BunnyVideoStatus | null;
}

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

export default function VideoUploader({ file, onFileChange, disabled, existingStatus }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_VIDEO_SIZE) {
      handleActionErrors(['Video quá lớn (tối đa 5GB)']);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onFileChange(f);
    if (inputRef.current) inputRef.current.value = '';
  }

  const hasExisting = !!existingStatus && !file;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleSelect}
        disabled={disabled}
      />

      {file ? (
        <div className="border-divider flex items-center gap-3 rounded-lg border p-3">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
            <Video className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{file.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(file.size)} · sẽ tải lên nền sau khi lưu
            </p>
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            title="Bỏ chọn"
            className="text-destructive hover:text-destructive cursor-pointer"
            onClick={() => onFileChange(null)}
            disabled={disabled}
          >
            <Trash2 />
          </Button>
        </div>
      ) : hasExisting ? (
        <div className="border-divider flex items-center gap-3 rounded-lg border p-3">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
            <Video className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">Video hiện tại</p>
            <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              {existingStatus === 'FINISHED' ? (
                <>
                  <CheckCircle2 className="size-3 text-emerald-600" /> Sẵn sàng
                </>
              ) : (
                BUNNY_STATUS_META[existingStatus!]?.label
              )}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload /> Đổi video
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="cursor-pointer"
        >
          <Upload /> Chọn video (tối đa 5GB)
        </Button>
      )}
    </div>
  );
}
