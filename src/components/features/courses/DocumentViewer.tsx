'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { buildOfficeEmbedUrl, mapToViewer, type ViewerKind } from '@/lib/document-viewer';

interface Props {
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize?: number | null;
  title?: string;
  locked?: boolean;
  /** true = lấp đầy khung cha thay vì cao cố định (modal xem gần full màn hình). */
  fill?: boolean;
}

const OFFICE_TIMEOUT_MS = 15_000;

function formatBytes(n?: number | null): string {
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

export default function DocumentViewer({
  fileUrl,
  fileName,
  mimeType,
  fileSize,
  title,
  locked,
  fill = false,
}: Props) {
  const isLocked = locked || !fileUrl;
  const [loading, setLoading] = useState(true);
  const [officeTimedOut, setOfficeTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kind: ViewerKind = isLocked ? 'download' : mapToViewer(fileName ?? '', mimeType ?? '');

  // Reset loading + timeout khi đổi file
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLoading(true);
    setOfficeTimedOut(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLocked && kind === 'office') {
      timerRef.current = setTimeout(() => setOfficeTimedOut(true), OFFICE_TIMEOUT_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fileUrl, kind, isLocked]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLocked) {
    return (
      <div className="bg-muted flex min-h-[40vh] items-center justify-center rounded-lg">
        <div className="text-muted-foreground space-y-2 text-center">
          <Lock className="mx-auto size-10" />
          <p className="text-sm font-medium">Bạn cần ghi danh khóa học để xem tài liệu này</p>
        </div>
      </div>
    );
  }

  const url = fileUrl!;

  const actionBar = (
    <div className="border-divider flex items-center gap-3 border-b px-3 py-2">
      <FileText className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">
          {title ?? fileName ?? 'Tài liệu'}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {fileName ?? ''}
          {fileSize ? ` · ${formatBytes(fileSize)}` : ''}
        </p>
      </div>
      <Button asChild size="sm" variant="ghost" className="cursor-pointer">
        <a href={url} target="_blank" rel="noreferrer noopener">
          <ExternalLink /> Mở tab mới
        </a>
      </Button>
      <Button asChild size="sm" variant="outline" className="cursor-pointer">
        <a href={url} target="_blank" rel="noreferrer noopener" download>
          <Download /> Tải về
        </a>
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        'border-divider overflow-hidden rounded-lg border',
        fill && 'flex h-full flex-col',
      )}
    >
      {actionBar}
      <div
        className={cn(
          'bg-card relative',
          fill ? 'min-h-0 flex-1' : 'h-[60vh] md:h-[75vh]',
        )}
      >
        {loading && kind !== 'download' && kind !== 'image' && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        )}

        {kind === 'pdf' && (
          <object
            key={url}
            data={url}
            type="application/pdf"
            className="h-full w-full"
            onLoad={() => setLoading(false)}
          >
            <iframe
              src={url}
              title={title ?? fileName ?? 'PDF'}
              className="h-full w-full border-0"
              onLoad={() => setLoading(false)}
            />
          </object>
        )}

        {kind === 'office' && (
          <>
            <iframe
              key={url}
              src={buildOfficeEmbedUrl(url)}
              title={title ?? fileName ?? 'Tài liệu'}
              className="h-full w-full border-0"
              onLoad={() => setLoading(false)}
            />
            {officeTimedOut && (
              <div className="bg-background/95 absolute inset-x-0 bottom-0 border-t px-3 py-2 text-center text-xs">
                <span className="text-muted-foreground">
                  Bản xem trước tải chậm hoặc không khả dụng.{' '}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  download
                  className="text-purple font-medium underline"
                >
                  Tải về để xem
                </a>
              </div>
            )}
          </>
        )}

        {kind === 'image' && (
          <div className="flex h-full w-full items-center justify-center overflow-auto p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName ?? title ?? 'Hình ảnh'}
              className="max-h-full w-auto object-contain"
            />
          </div>
        )}

        {kind === 'download' && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-muted-foreground space-y-2 text-center">
              <FileText className="mx-auto size-10" />
              <p className="text-sm">Định dạng này không xem trước trực tiếp được.</p>
              <Button asChild size="sm" variant="outline" className={cn('cursor-pointer')}>
                <a href={url} target="_blank" rel="noreferrer noopener" download>
                  <Download /> Tải về để xem
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
