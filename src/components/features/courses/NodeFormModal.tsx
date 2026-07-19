'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FileText, Film, Loader2, Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult, handleActionErrors } from '@/lib/actions';
import { createCourseNodeAction } from '@/actions/v1/course-nodes/create-course-node';
import { updateCourseNodeAction } from '@/actions/v1/course-nodes/update-course-node';
import { getBunnyTusUploadAction } from '@/actions/v1/bunny/get-tus-upload';
import { getUploadUrlAction } from '@/actions/v1/storage/get-upload-url';
import { useUploadManager } from './UploadManagerProvider';
import { detectFileKind } from '@/lib/file-kind';
import { COURSE_FILE_KIND_LABEL } from '@/types/course-management';
import type { CourseFileKind, CourseNodeTree } from '@/types/course-management';

export type NodeFormMode = 'create-folder' | 'create-file' | 'edit';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  mode: NodeFormMode;
  /** Folder cha khi tạo mới (null = gốc khóa học). */
  parentId?: number | null;
  /** Node đang sửa (mode='edit'). */
  node?: CourseNodeTree;
}

interface DocValue {
  url: string;
  storageKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_DOC_SIZE = 100 * 1024 * 1024; // 100MB

function stripExt(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
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

export default function NodeFormModal({
  open,
  onOpenChange,
  courseId,
  mode,
  parentId = null,
  node,
}: Props) {
  const router = useRouter();
  const { enqueue } = useUploadManager();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isFolder = mode === 'create-folder' || (mode === 'edit' && node?.type === 'FOLDER');
  const editFileKind: CourseFileKind | null =
    mode === 'edit' && node?.type === 'FILE' ? node.fileKind : null;

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<CourseFileKind | null>(null);
  const [docValue, setDocValue] = useState<DocValue | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setTitle(node?.title ?? '');
    setFile(null);
    setKind(null);
    setDocValue(null);
    setDocUploading(false);
    setSubmitted(false);
  }, [open, node]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const hasExistingFile = mode === 'edit' && node?.type === 'FILE';

  const titleError = submitted && !title.trim() ? 'Vui lòng nhập tên' : '';
  const fileError =
    submitted && mode === 'create-file' && !file ? 'Vui lòng chọn tệp để tải lên' : '';

  async function uploadDocument(f: File): Promise<DocValue | null> {
    const res = await getUploadUrlAction({
      folder: 'lesson-documents',
      fileName: f.name,
      mimeType: f.type || 'application/octet-stream',
      fileSize: f.size,
    });
    if (res.errors.length || !res.data) {
      handleActionErrors(res.errors.length ? res.errors : ['Không lấy được URL tải lên']);
      return null;
    }
    await axios.put(res.data.url, f, {
      headers: { 'Content-Type': res.data.contentType },
    });
    return {
      url: res.data.publicUrl,
      storageKey: res.data.storageKey,
      fileName: f.name,
      fileSize: f.size,
      mimeType: f.type || 'application/octet-stream',
    };
  }

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!f) return;

    const detected = detectFileKind(f);

    // Khi sửa tệp: không cho đổi loại (video↔tài liệu). Đổi loại = xoá & tạo mới.
    if (editFileKind && detected !== editFileKind) {
      handleActionErrors([
        `Tệp thay thế phải cùng loại (${COURSE_FILE_KIND_LABEL[editFileKind]}). Để đổi loại, hãy xoá và tạo mới.`,
      ]);
      return;
    }

    const limit = detected === 'VIDEO' ? MAX_VIDEO_SIZE : MAX_DOC_SIZE;
    if (f.size > limit) {
      handleActionErrors([
        detected === 'VIDEO' ? 'Video quá lớn (tối đa 5GB)' : 'Tài liệu quá lớn (tối đa 100MB)',
      ]);
      return;
    }

    setFile(f);
    setKind(detected);
    setDocValue(null);
    if (!title.trim()) setTitle(stripExt(f.name));

    // Tài liệu upload ngay lên R2 (có thể chờ vài giây); video hoãn tới submit (TUS nền).
    if (detected === 'DOCUMENT') {
      setDocUploading(true);
      try {
        const val = await uploadDocument(f);
        setDocValue(val);
      } finally {
        setDocUploading(false);
      }
    }
  }

  const close = () => {
    onOpenChange(false);
    router.refresh();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!title.trim()) return;

    setLoading(true);
    try {
      // ===== FOLDER =====
      if (isFolder) {
        if (mode === 'edit' && node) {
          const res = await updateCourseNodeAction(node.id, courseId, { title: title.trim() });
          handleActionResult(res.errors, close, 'Cập nhật thành công');
        } else {
          const res = await createCourseNodeAction(courseId, {
            parentId: parentId ?? undefined,
            type: 'FOLDER',
            title: title.trim(),
          });
          handleActionResult(res.errors, close, 'Tạo thư mục thành công');
        }
        return;
      }

      // ===== FILE — CREATE =====
      if (mode === 'create-file') {
        if (!file || !kind) return;

        if (kind === 'VIDEO') {
          const tus = await getBunnyTusUploadAction({ title: title.trim() });
          if (tus.errors.length || !tus.data) {
            handleActionErrors(tus.errors.length ? tus.errors : ['Không tạo được phiên upload']);
            return;
          }
          const { videoId, libraryId, signature, expire, tusEndpoint } = tus.data;
          const res = await createCourseNodeAction(courseId, {
            parentId: parentId ?? undefined,
            type: 'FILE',
            fileKind: 'VIDEO',
            title: title.trim(),
            bunnyVideoId: videoId,
            bunnyLibraryId: libraryId,
          });
          if (res.errors.length || !res.data) {
            handleActionErrors(res.errors.length ? res.errors : ['Tạo video thất bại']);
            return;
          }
          enqueue(file, {
            nodeId: res.data.id,
            courseId,
            videoId,
            libraryId,
            signature,
            expire,
            tusEndpoint,
          });
          close();
          return;
        }

        // DOCUMENT
        if (docUploading) {
          handleActionErrors(['Tài liệu đang tải lên, vui lòng đợi.']);
          return;
        }
        if (!docValue) {
          handleActionErrors(['Tải lên tài liệu chưa hoàn tất.']);
          return;
        }
        const res = await createCourseNodeAction(courseId, {
          parentId: parentId ?? undefined,
          type: 'FILE',
          fileKind: 'DOCUMENT',
          title: title.trim(),
          fileUrl: docValue.url,
          fileStorageKey: docValue.storageKey,
          fileName: docValue.fileName,
          fileSize: docValue.fileSize,
          mimeType: docValue.mimeType,
        });
        handleActionResult(res.errors, close, 'Tạo tài liệu thành công');
        return;
      }

      // ===== FILE — EDIT =====
      if (mode === 'edit' && node) {
        // Chỉ đổi tên (không chọn tệp mới)
        if (!file) {
          const res = await updateCourseNodeAction(node.id, courseId, { title: title.trim() });
          handleActionResult(res.errors, close, 'Cập nhật thành công');
          return;
        }

        if (kind === 'VIDEO') {
          const tus = await getBunnyTusUploadAction({ title: title.trim() });
          if (tus.errors.length || !tus.data) {
            handleActionErrors(tus.errors.length ? tus.errors : ['Không tạo được phiên upload']);
            return;
          }
          const { videoId, libraryId, signature, expire, tusEndpoint } = tus.data;
          const res = await updateCourseNodeAction(node.id, courseId, {
            title: title.trim(),
            bunnyVideoId: videoId,
            bunnyLibraryId: libraryId,
          });
          if (res.errors.length) {
            handleActionErrors(res.errors);
            return;
          }
          enqueue(file, {
            nodeId: node.id,
            courseId,
            videoId,
            libraryId,
            signature,
            expire,
            tusEndpoint,
          });
          close();
          return;
        }

        // DOCUMENT replace
        if (docUploading) {
          handleActionErrors(['Tài liệu đang tải lên, vui lòng đợi.']);
          return;
        }
        if (!docValue) {
          handleActionErrors(['Tải lên tài liệu chưa hoàn tất.']);
          return;
        }
        const res = await updateCourseNodeAction(node.id, courseId, {
          title: title.trim(),
          fileUrl: docValue.url,
          fileStorageKey: docValue.storageKey,
          fileName: docValue.fileName,
          fileSize: docValue.fileSize,
          mimeType: docValue.mimeType,
        });
        handleActionResult(res.errors, close, 'Cập nhật thành công');
      }
    } finally {
      setLoading(false);
    }
  }

  const dialogTitle = isFolder
    ? mode === 'edit'
      ? 'Đổi tên thư mục'
      : 'Tạo thư mục'
    : mode === 'edit'
      ? 'Chỉnh sửa tệp'
      : 'Thêm tệp';

  const showFilePicker = mode === 'create-file' || hasExistingFile;

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isFolder
              ? 'Thư mục có thể chứa thư mục con hoặc tệp (video / tài liệu).'
              : 'Tải lên video hoặc tài liệu — hệ thống tự nhận diện loại tệp.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="node-title">
              Tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="node-title"
              placeholder={isFolder ? 'VD: Chương 1 — Động học' : 'VD: Bài giảng buổi 1'}
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!titleError}
            />
            {titleError && <p className="text-destructive text-xs">{titleError}</p>}
          </div>

          {showFilePicker && (
            <div className="space-y-1.5">
              <Label>
                {mode === 'create-file' ? (
                  <>
                    Tệp <span className="text-destructive">*</span>
                  </>
                ) : (
                  'Thay tệp (tuỳ chọn)'
                )}
              </Label>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handlePick}
                disabled={loading}
              />

              {file ? (
                <div className="border-divider flex items-center gap-3 rounded-lg border p-3">
                  <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
                    {kind === 'VIDEO' ? (
                      <Film className="size-5" />
                    ) : (
                      <FileText className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                      {formatBytes(file.size)}
                      {kind && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {COURSE_FILE_KIND_LABEL[kind]}
                        </Badge>
                      )}
                      {kind === 'VIDEO'
                        ? '· tải lên nền sau khi lưu'
                        : docUploading
                          ? '· đang tải lên...'
                          : docValue
                            ? '· đã tải lên'
                            : ''}
                    </p>
                  </div>
                  {docUploading ? (
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  ) : (
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      title="Bỏ chọn"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => {
                        setFile(null);
                        setKind(null);
                        setDocValue(null);
                      }}
                      disabled={loading}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                  className="cursor-pointer"
                >
                  <Upload />
                  {hasExistingFile ? 'Chọn tệp mới' : 'Chọn tệp (video hoặc tài liệu)'}
                </Button>
              )}
              {fileError && <p className="text-destructive text-xs">{fileError}</p>}
              {hasExistingFile && !file && (
                <p className="text-muted-foreground text-xs">
                  Để nguyên nếu chỉ muốn đổi tên. Không thể đổi giữa video và tài liệu.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <ActionButton
              type="submit"
              isLoading={loading}
              loadingText="Đang lưu..."
              disabled={docUploading}
              className="cursor-pointer"
            >
              {mode === 'edit' ? 'Lưu thay đổi' : isFolder ? 'Tạo thư mục' : 'Thêm tệp'}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
