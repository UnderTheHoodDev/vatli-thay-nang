'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FileText, GripVertical, Loader2, Trash2, Upload } from 'lucide-react';
import { getUploadUrlAction } from '@/actions/v1/storage/get-upload-url';
import { Button } from '@/components/ui/button';
import { handleActionErrors } from '@/lib/actions';
import { cn } from '@/lib/utils';
import type { IGetUploadUrlPayload } from '@/types/actions/course-management';
import type { StorageFolder } from '@/types/course-management';
import type { TestFilePayload } from '@/types/tests';

interface Props {
  folder: Extract<StorageFolder, 'test-attachments' | 'test-submissions'>;
  /** BẮT BUỘC khi folder = test-submissions: BE cần biết bài nào để gate ghi danh + phase. */
  testId?: number;
  value: TestFilePayload[];
  onChange: (files: TestFilePayload[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  /** Báo ra ngoài khi đang tải: form cha phải khoá nút Lưu, không thì bài lưu thiếu file. */
  onBusyChange?: (busy: boolean) => void;
}

const MAX_FILES = 30;
const MAX_SIZE = 20 * 1024 * 1024;

// Khớp whitelist BE (storage.constants.ts). SVG bị loại ở cả hai phía: là active
// content, render inline được thì chạy được script.
const ACCEPT: Record<Props['folder'], string> = {
  'test-attachments': 'image/*,application/pdf',
  'test-submissions': 'image/*,application/pdf,text/plain',
};

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

/** BE từ chối svg và octet-stream ở DTO → chỉ gửi mimeType khi chắc chắn hợp lệ. */
function safeMimeType(file: File): string | undefined {
  const t = file.type;
  if (!t || t === 'application/octet-stream' || t.includes('svg')) return undefined;
  return t;
}

export default function TestFileUploader({
  folder,
  testId,
  value,
  onChange,
  disabled,
  maxFiles = MAX_FILES,
  onBusyChange,
}: Props) {
  const [uploading, setUploading] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Danh sách mới nhất, để callback bất đồng bộ không nối vào state đã cũ.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  async function handlePick(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);

    if (value.length + files.length > maxFiles) {
      handleActionErrors([`Tối đa ${maxFiles} tệp`]);
      return;
    }

    setUploading((n) => n + files.length);
    const uploaded: TestFilePayload[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        handleActionErrors([`"${file.name}": tệp quá lớn (tối đa ${formatBytes(MAX_SIZE)})`]);
        setUploading((n) => n - 1);
        continue;
      }

      // mimeType gửi khi XIN URL khác với khi LƯU: BE tự suy ra Content-Type từ đuôi
      // file nếu browser trả rỗng, nhưng DTO lưu bài thì từ chối octet-stream.
      const presign = await getUploadUrlAction({
        folder,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        ...(folder === 'test-submissions' ? { testId: testId! } : {}),
      } as IGetUploadUrlPayload);

      if (!presign.data) {
        handleActionErrors(
          presign.errors.length ? presign.errors : [`Tải "${file.name}" thất bại`],
        );
        setUploading((n) => n - 1);
        continue;
      }

      try {
        const res = await fetch(presign.data.url, {
          method: 'PUT',
          body: file,
          // PHẢI dùng đúng Content-Type mà BE đã ký. Nó nằm trong chữ ký, và BE tự suy
          // ra từ đuôi file khi browser trả File.type rỗng — gửi lại giá trị của mình
          // là chữ ký sai, R2 từ chối và học sinh không nộp được bài.
          headers: { 'Content-Type': presign.data.contentType },
        });
        if (!res.ok) throw new Error(String(res.status));

        uploaded.push({
          // KHÔNG gửi fileUrl — BE tự dựng từ storageKey.
          fileStorageKey: presign.data.storageKey,
          fileName: file.name,
          fileSize: file.size,
          mimeType: safeMimeType(file),
          order: 0, // đánh lại theo vị trí thật ở dưới
        });
      } catch {
        handleActionErrors([`Tải "${file.name}" lên thất bại`]);
      } finally {
        setUploading((n) => n - 1);
      }
    }

    // Nối vào danh sách MỚI NHẤT (valueRef) chứ không phải `value` chụp lúc bắt đầu:
    // upload là bất đồng bộ, người dùng có thể đã xoá/thêm file trong lúc chờ.
    if (uploaded.length) {
      const next = [...valueRef.current, ...uploaded].map((f, i) => ({ ...f, order: i }));
      onChange(next);
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(index: number) {
    const next = value.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
    onChange(next);
  }

  /** Đề nhiều trang ảnh phải đọc đúng thứ tự — `order` gửi lên BE là vị trí trong mảng. */
  function move(from: number, to: number) {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.map((f, i) => ({ ...f, order: i })));
  }

  function handleGripKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    // Kéo-thả chuột thì bàn phím chịu — mũi tên trên tay cầm là lối đi tương đương.
    e.preventDefault();
    move(index, e.key === 'ArrowUp' ? index - 1 : index + 1);
  }

  const busy = uploading > 0;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT[folder]}
        className="hidden"
        onChange={(e) => void handlePick(e.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        disabled={disabled || busy || value.length >= maxFiles}
        onClick={() => inputRef.current?.click()}
        className="w-full cursor-pointer"
      >
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? `Đang tải lên (${uploading})…` : 'Chọn tệp (ảnh, PDF)'}
      </Button>

      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((f, i) => (
            <li
              key={f.fileStorageKey}
              draggable={!disabled && !busy}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                'border-divider flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                dragIndex === i && 'opacity-50',
              )}
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled || busy}
                onKeyDown={(e) => handleGripKeyDown(e, i)}
                className="size-7 shrink-0 cursor-grab active:cursor-grabbing"
                aria-label={`Đổi thứ tự ${f.fileName} (dùng phím mũi tên lên/xuống)`}
              >
                <GripVertical className="size-4" />
              </Button>
              <span className="text-muted-foreground w-4 shrink-0 text-xs">{i + 1}</span>
              <FileText className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatBytes(f.fileSize)}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled || busy}
                onClick={() => remove(i)}
                className="size-7 cursor-pointer"
                aria-label={`Xoá ${f.fileName}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground text-xs">
        Tối đa {maxFiles} tệp, mỗi tệp {formatBytes(MAX_SIZE)}. Ảnh hoặc PDF
        {folder === 'test-submissions' ? ', hoặc .txt' : ''}.
      </p>
    </div>
  );
}
