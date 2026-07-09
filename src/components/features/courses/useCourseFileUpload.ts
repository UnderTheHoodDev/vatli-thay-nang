'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { handleActionErrors } from '@/lib/actions';
import { detectFileKind } from '@/lib/file-kind';
import { getBunnyTusUploadAction } from '@/actions/v1/bunny/get-tus-upload';
import { getUploadUrlAction } from '@/actions/v1/storage/get-upload-url';
import { createCourseNodeAction } from '@/actions/v1/course-nodes/create-course-node';
import { useUploadManager } from './UploadManagerProvider';

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_DOC_SIZE = 100 * 1024 * 1024; // 100MB

function stripExt(name: string): string {
  const idx = name.lastIndexOf('.');
  return (idx > 0 ? name.slice(0, idx) : name) || name;
}

/**
 * Thêm tệp kiểu Google Drive: mỗi file → tạo node NGAY (tên = tên file) rồi
 * upload nền qua UploadManager (video: bunny TUS; tài liệu: R2 PUT). KHÔNG modal,
 * không bước Save. Node hiện ngay ở trạng thái đang tải.
 */
export function useCourseFileUpload(courseId: number) {
  const router = useRouter();
  const { enqueue, enqueueDocument } = useUploadManager();

  const addFiles = useCallback(
    async (fileList: FileList | File[], parentId: number | null) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;
      let created = 0;

      // Tuần tự để order (max+1) không bị race giữa các node.
      for (const file of files) {
        const kind = detectFileKind(file);
        const title = stripExt(file.name);

        if (kind === 'VIDEO' && file.size > MAX_VIDEO_SIZE) {
          handleActionErrors([`"${file.name}": video quá lớn (tối đa 5GB)`]);
          continue;
        }
        if (kind === 'DOCUMENT' && file.size > MAX_DOC_SIZE) {
          handleActionErrors([`"${file.name}": tài liệu quá lớn (tối đa 100MB)`]);
          continue;
        }

        try {
          if (kind === 'VIDEO') {
            const tus = await getBunnyTusUploadAction({ title });
            if (tus.errors.length || !tus.data) {
              handleActionErrors(tus.errors.length ? tus.errors : [`"${file.name}": không tạo được phiên upload`]);
              continue;
            }
            const res = await createCourseNodeAction(courseId, {
              parentId: parentId ?? undefined,
              type: 'FILE',
              fileKind: 'VIDEO',
              title,
              bunnyVideoId: tus.data.videoId,
              bunnyLibraryId: tus.data.libraryId,
            });
            if (res.errors.length || !res.data) {
              handleActionErrors(res.errors.length ? res.errors : [`"${file.name}": tạo mục thất bại`]);
              continue;
            }
            enqueue(file, {
              nodeId: res.data.id,
              courseId,
              videoId: tus.data.videoId,
              libraryId: tus.data.libraryId,
              signature: tus.data.signature,
              expire: tus.data.expire,
              tusEndpoint: tus.data.tusEndpoint,
            });
            created++;
          } else {
            const contentType = file.type || 'application/octet-stream';
            const presign = await getUploadUrlAction({
              folder: 'lesson-documents',
              fileName: file.name,
              mimeType: contentType,
              fileSize: file.size,
            });
            if (presign.errors.length || !presign.data) {
              handleActionErrors(presign.errors.length ? presign.errors : [`"${file.name}": không lấy được URL tải lên`]);
              continue;
            }
            const res = await createCourseNodeAction(courseId, {
              parentId: parentId ?? undefined,
              type: 'FILE',
              fileKind: 'DOCUMENT',
              title,
              fileUrl: presign.data.publicUrl,
              fileStorageKey: presign.data.storageKey,
              fileName: file.name,
              fileSize: file.size,
              mimeType: contentType,
            });
            if (res.errors.length || !res.data) {
              handleActionErrors(res.errors.length ? res.errors : [`"${file.name}": tạo mục thất bại`]);
              continue;
            }
            enqueueDocument(file, {
              nodeId: res.data.id,
              courseId,
              putUrl: presign.data.url,
              contentType,
            });
            created++;
          }
        } catch {
          handleActionErrors([`"${file.name}": tải lên thất bại`]);
        }
      }

      if (created > 0) router.refresh();
    },
    [courseId, enqueue, enqueueDocument, router],
  );

  return { addFiles };
}
