'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, FileText, Loader2, Trash2, Upload, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleActionErrors } from '@/lib/actions';
import { formatBytes } from '@/lib/format';
import { getUploadUrlAction } from '@/actions/v1/storage/get-upload-url';
import { BUNNY_STATUS_META } from '@/types/course-management';
import type { BunnyVideoStatus, LessonItemType } from '@/types/course-management';

export const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export interface DocumentValue {
  url?: string;
  storageKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

interface Props {
  /** File video đã chọn (sẽ upload qua TUS sau khi submit). */
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  /** Tài liệu PDF đã upload (upload ngay khi chọn). */
  document: DocumentValue | null;
  onDocumentChange: (value: DocumentValue | null) => void;
  disabled?: boolean;
  /** Edit mode: khoá loại tệp chấp nhận theo loại mục hiện có — không đổi được type khi sửa. */
  lockedType?: LessonItemType | null;
  /** Edit mode video: trạng thái video hiện có khi chưa chọn file mới. */
  existingVideoStatus?: BunnyVideoStatus | null;
}

export default function LessonContentUploader({
  videoFile,
  onVideoFileChange,
  document,
  onDocumentChange,
  disabled,
  lockedType,
  existingVideoStatus,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const accept =
    lockedType === 'VIDEO'
      ? 'video/*'
      : lockedType === 'DOCUMENT'
        ? '.pdf,application/pdf'
        : '.pdf,application/pdf,video/*';

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isVideo = file.type.startsWith('video/');

    if (!isPdf && !isVideo) {
      handleActionErrors(['Chỉ hỗ trợ tệp PDF hoặc video']);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (lockedType === 'VIDEO' && !isVideo) {
      handleActionErrors(['Mục này chỉ chấp nhận video']);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (lockedType === 'DOCUMENT' && !isPdf) {
      handleActionErrors(['Mục này chỉ chấp nhận tệp PDF']);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (isVideo) {
      if (file.size > MAX_VIDEO_SIZE) {
        handleActionErrors(['Video quá lớn (tối đa 5GB)']);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      onDocumentChange(null);
      onVideoFileChange(file);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await getUploadUrlAction({
        folder: 'lesson-documents',
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        fileSize: file.size,
      });
      if (res.errors.length || !res.data) {
        handleActionErrors(res.errors.length ? res.errors : ['Không lấy được URL upload']);
        return;
      }
      await axios.put(res.data.url, file, {
        headers: { 'Content-Type': file.type || 'application/pdf' },
      });
      onVideoFileChange(null);
      onDocumentChange({
        url: res.data.publicUrl,
        storageKey: res.data.storageKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
      });
    } catch {
      handleActionErrors(['Tải lên tài liệu thất bại']);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={handleSelect}
      disabled={disabled || uploading}
    />
  );

  if (videoFile) {
    return (
      <div className="space-y-2">
        {hiddenInput}
        <div className="border-divider flex items-center gap-3 rounded-lg border p-3">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
            <Video className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{videoFile.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(videoFile.size)} · sẽ tải lên nền sau khi lưu
            </p>
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            title="Bỏ chọn"
            className="text-destructive hover:text-destructive cursor-pointer"
            onClick={() => onVideoFileChange(null)}
            disabled={disabled}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    );
  }

  const hasExistingVideo = !!existingVideoStatus;
  if (hasExistingVideo) {
    return (
      <div className="space-y-2">
        {hiddenInput}
        <div className="border-divider flex items-center gap-3 rounded-lg border p-3">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
            <Video className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">Video hiện tại</p>
            <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              {existingVideoStatus === 'FINISHED' ? (
                <>
                  <CheckCircle2 className="size-3 text-emerald-600" /> Sẵn sàng
                </>
              ) : (
                BUNNY_STATUS_META[existingVideoStatus]?.label
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
      </div>
    );
  }

  if (document?.url) {
    return (
      <div className="space-y-2">
        {hiddenInput}
        <div className="border-divider flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border p-3">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-foreground truncate text-sm font-medium"
              title={document.fileName ?? 'Tài liệu'}
            >
              {document.fileName ?? 'Tài liệu'}
            </p>
            <p className="text-muted-foreground text-xs">
              {document.mimeType ?? ''}
              {document.fileSize ? ` · ${formatBytes(document.fileSize)}` : ''}
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
              onClick={() => onDocumentChange(null)}
              disabled={disabled || uploading}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hiddenInput}
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="cursor-pointer"
      >
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {uploading
          ? 'Đang tải lên...'
          : lockedType === 'VIDEO'
            ? 'Chọn video (tối đa 5GB)'
            : lockedType === 'DOCUMENT'
              ? 'Tải tài liệu lên (PDF)'
              : 'Chọn tệp (PDF hoặc video, tối đa 5GB)'}
      </Button>
    </div>
  );
}
