'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as tus from 'tus-js-client';
import { markUploadedAction } from '@/actions/v1/course-nodes/mark-uploaded';

const MAX_CONCURRENT = 3;
const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB (bội số 256KB theo yêu cầu bunny)

export type UploadPhase = 'queued' | 'uploading' | 'paused' | 'error' | 'done';

export interface UploadTask {
  id: string;
  nodeId: number;
  courseId: number;
  videoId: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0..100
  phase: UploadPhase;
  error?: string;
}

export interface EnqueueArgs {
  nodeId: number;
  courseId: number;
  videoId: string;
  libraryId: number;
  signature: string;
  expire: number;
  tusEndpoint: string;
}

interface UploadManagerValue {
  tasks: UploadTask[];
  enqueue: (file: File, args: EnqueueArgs) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  cancel: (id: string) => Promise<void>;
  retry: (id: string) => void;
  /** Có upload nào cho nodeId này đang chạy không (để tree biết). */
  hasActive: (nodeId: number) => boolean;
}

const UploadManagerContext = createContext<UploadManagerValue | null>(null);

export function useUploadManager(): UploadManagerValue {
  const ctx = useContext(UploadManagerContext);
  if (!ctx) {
    throw new Error('useUploadManager phải dùng trong UploadManagerProvider');
  }
  return ctx;
}

async function markUploadedWithRetry(
  nodeId: number,
  courseId: number,
  attempts = 3,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const res = await markUploadedAction(nodeId, courseId);
    if (!res.errors.length) return;
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
}

export default function UploadManagerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  // Refs không-render: tus instance, File, và metadata để pump hàng đợi.
  const uploadsRef = useRef<Map<string, tus.Upload>>(new Map());
  const filesRef = useRef<Map<string, File>>(new Map());
  const argsRef = useRef<Map<string, EnqueueArgs>>(new Map());

  const patchTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const refreshIfOn = useCallback(
    (courseId: number) => {
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.includes(`/admin/courses/${courseId}`)
      ) {
        router.refresh();
      }
    },
    [router],
  );

  // Bắt đầu thực sự upload 1 task (tạo tus.Upload).
  const startTask = useCallback(
    (taskId: string) => {
      // Idempotent: chống double-start (pump có thể chạy updater 2 lần ở StrictMode).
      if (uploadsRef.current.has(taskId)) return;
      const file = filesRef.current.get(taskId);
      const args = argsRef.current.get(taskId);
      if (!file || !args) return;

      const upload = new tus.Upload(file, {
        endpoint: args.tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: CHUNK_SIZE,
        removeFingerprintOnSuccess: true,
        metadata: {
          filetype: file.type || 'video/mp4',
          title: file.name,
        },
        headers: {
          AuthorizationSignature: args.signature,
          AuthorizationExpire: String(args.expire),
          LibraryId: String(args.libraryId),
          VideoId: args.videoId,
        },
        onProgress: (sent, total) => {
          patchTask(taskId, {
            progress: total ? Math.round((sent / total) * 100) : 0,
            phase: 'uploading',
          });
        },
        onError: (err) => {
          patchTask(taskId, { phase: 'error', error: err.message });
          pumpRef.current();
        },
        onSuccess: async () => {
          patchTask(taskId, { phase: 'done', progress: 100 });
          await markUploadedWithRetry(args.nodeId, args.courseId);
          refreshIfOn(args.courseId);
          // tự dọn task done sau vài giây
          setTimeout(() => removeTaskRef.current(taskId), 4000);
          pumpRef.current();
        },
      });

      uploadsRef.current.set(taskId, upload);
      patchTask(taskId, { phase: 'uploading' });
      // Resume nếu có upload dở trùng fingerprint (cùng file).
      upload
        .findPreviousUploads()
        .then((prev) => {
          if (prev.length > 0) upload.resumeFromPreviousUpload(prev[0]);
          upload.start();
        })
        .catch(() => upload.start());
    },
    [patchTask, refreshIfOn],
  );

  // Hàng đợi: chạy tối đa MAX_CONCURRENT task 'uploading'.
  const pump = useCallback(() => {
    setTasks((prev) => {
      const active = prev.filter((t) => t.phase === 'uploading').length;
      let slots = MAX_CONCURRENT - active;
      if (slots <= 0) return prev;
      for (const t of prev) {
        if (slots <= 0) break;
        if (t.phase === 'queued') {
          slots--;
          // start ngoài setState để tránh side-effect trong updater
          queueMicrotask(() => startTask(t.id));
        }
      }
      return prev;
    });
  }, [startTask]);

  const removeTask = useCallback((id: string) => {
    uploadsRef.current.delete(id);
    filesRef.current.delete(id);
    argsRef.current.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Refs tới hàm mới nhất (tránh stale trong callback tus).
  const pumpRef = useRef(pump);
  const removeTaskRef = useRef(removeTask);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- "latest closure" ref pattern; required for stale-free tus callbacks
    pumpRef.current = pump;
    // eslint-disable-next-line react-hooks/immutability -- "latest closure" ref pattern; required for stale-free tus callbacks
    removeTaskRef.current = removeTask;
  }, [pump, removeTask]);

  const enqueue = useCallback((file: File, args: EnqueueArgs) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    filesRef.current.set(id, file);
    argsRef.current.set(id, args);
    setTasks((prev) => [
      ...prev,
      {
        id,
        nodeId: args.nodeId,
        courseId: args.courseId,
        videoId: args.videoId,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        phase: 'queued',
      },
    ]);
    queueMicrotask(() => pumpRef.current());
  }, []);

  const pause = useCallback(
    (id: string) => {
      uploadsRef.current.get(id)?.abort();
      patchTask(id, { phase: 'paused' });
      pumpRef.current();
    },
    [patchTask],
  );

  const resume = useCallback(
    (id: string) => {
      const upload = uploadsRef.current.get(id);
      if (upload) {
        patchTask(id, { phase: 'uploading' });
        upload.start();
      } else {
        // chưa có instance (vd reload) → start lại từ file nếu còn
        patchTask(id, { phase: 'queued' });
        pumpRef.current();
      }
    },
    [patchTask],
  );

  const retry = useCallback(
    (id: string) => {
      patchTask(id, { phase: 'queued', error: undefined, progress: 0 });
      pumpRef.current();
    },
    [patchTask],
  );

  const cancel = useCallback(
    async (id: string) => {
      const upload = uploadsRef.current.get(id);
      try {
        await upload?.abort(true); // true = xoá fingerprint localStorage
      } catch {
        /* noop */
      }
      removeTask(id);
    },
    [removeTask],
  );

  const hasActive = useCallback(
    (nodeId: number) =>
      tasks.some(
        (t) =>
          t.nodeId === nodeId &&
          (t.phase === 'uploading' || t.phase === 'queued' || t.phase === 'paused'),
      ),
    [tasks],
  );

  // Cảnh báo khi rời trang lúc còn upload.
  useEffect(() => {
    const hasUploading = tasks.some((t) => t.phase === 'uploading' || t.phase === 'queued');
    if (!hasUploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [tasks]);

  return (
    <UploadManagerContext.Provider
      value={{ tasks, enqueue, pause, resume, cancel, retry, hasActive }}
    >
      {children}
    </UploadManagerContext.Provider>
  );
}
