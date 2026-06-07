'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleActionErrors } from '@/lib/actions';
import { getUploadUrlAction } from '@/actions/v1/storage/get-upload-url';
import type { StorageFolder } from '@/types/course-management';

export interface DocumentValue {
  url?: string;
  storageKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

interface Props {
  value: DocumentValue | null;
  onChange: (value: DocumentValue | null) => void;
  folder?: StorageFolder;
  accept?: string;
  disabled?: boolean;
}

function formatBytes(n?: number): string {
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

export default function DocumentUploader({
  value,
  onChange,
  folder = 'lesson-documents',
  accept = '.pdf,.doc,.docx,.zip,application/*',
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await getUploadUrlAction({
        folder,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });
      if (res.errors.length || !res.data) {
        handleActionErrors(res.errors.length ? res.errors : ['Không lấy được URL upload']);
        return;
      }
      await axios.put(res.data.url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      onChange({
        url: res.data.publicUrl,
        storageKey: res.data.storageKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      });
    } catch {
      handleActionErrors(['Tải lên tài liệu thất bại']);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      {value?.url ? (
        <div className="border-divider flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border p-3">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium" title={value.fileName ?? 'Tài liệu'}>
              {value.fileName ?? 'Tài liệu'}
            </p>
            <p className="text-muted-foreground text-xs">
              {value.mimeType ?? ''}
              {value.fileSize ? ` · ${formatBytes(value.fileSize)}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              title="Đổi tài liệu"
              className="cursor-pointer"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              title="Xoá tài liệu"
              className="text-destructive hover:text-destructive cursor-pointer"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="cursor-pointer"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {uploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}
        </Button>
      )}
    </div>
  );
}
