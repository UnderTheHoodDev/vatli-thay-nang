'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImagePreviewDialog } from '@/components/ui/custom';
import { handleActionErrors } from '@/lib/actions';
import { getUploadUrlAction } from '@/actions/v1/storage/get-upload-url';
import type { StorageFolder } from '@/types/course-management';

export interface ThumbnailValue {
  url?: string;
  storageKey?: string;
}

interface Props {
  value: ThumbnailValue | null;
  onChange: (value: ThumbnailValue | null) => void;
  /** Không nhận 'test-submissions': folder đó bắt buộc kèm testId (xem IGetUploadUrlPayload). */
  folder?: Exclude<StorageFolder, 'test-submissions'>;
  disabled?: boolean;
}

export default function ThumbnailUploader({
  value,
  onChange,
  folder = 'course-thumbnails',
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
        headers: { 'Content-Type': res.data.contentType },
      });
      onChange({ url: res.data.publicUrl, storageKey: res.data.storageKey });
    } catch {
      handleActionErrors(['Tải lên ảnh thất bại']);
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
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      {value?.url ? (
        <div className="border-divider relative inline-block overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="block cursor-pointer"
            title="Xem ảnh đầy đủ"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt="thumbnail"
              className="h-40 w-64 object-cover transition-opacity hover:opacity-80"
            />
          </button>
          <div className="bg-background/80 absolute top-2 right-2 flex gap-1 rounded-md p-1 backdrop-blur">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              title="Đổi ảnh"
              className="cursor-pointer"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <ImagePlus />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              title="Xoá ảnh"
              className="text-destructive hover:text-destructive cursor-pointer"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
            >
              <Trash2 />
            </Button>
          </div>
          <ImagePreviewDialog
            imageUrl={previewOpen ? (value.url ?? null) : null}
            alt="Ảnh xem trước"
            onClose={() => setPreviewOpen(false)}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="cursor-pointer"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
        </Button>
      )}
    </div>
  );
}
