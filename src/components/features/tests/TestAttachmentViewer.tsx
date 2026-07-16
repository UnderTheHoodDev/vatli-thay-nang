'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { buildOfficeEmbedUrl, mapToViewer, type ViewerKind } from '@/lib/document-viewer';
import { cn } from '@/lib/utils';
import type { TestFile } from '@/types/tests';

interface Props {
  files: TestFile[];
  /** Hiện khi chưa tới giờ mở đề / học sinh chưa nộp gì. */
  emptyHint?: string;
}

interface ViewFile extends TestFile {
  kind: ViewerKind;
}

/** Tải từng tệp một: R2 không zip hộ, mà mở 30 tab thì trình duyệt chặn. */
function downloadAll(items: ViewFile[]) {
  items.forEach((f, i) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = f.fileUrl;
      a.download = f.fileName;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, i * 300);
  });
}

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

/**
 * Xem nhiều file đề bài / bài làm. DocumentViewer chỉ nhận 1 file, mà đề bài và bài
 * làm thường là nhiều ảnh chụp.
 *
 * - Toàn ảnh: cuộn dọc như đọc một tập, kèm dải thumbnail nhảy nhanh, click để phóng to.
 * - 1 PDF: nhúng thẳng.
 * - Trộn nhiều loại: danh sách card, ảnh render inline, còn lại có nút xem/tải.
 */
export default function TestAttachmentViewer({ files, emptyHint }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items: ViewFile[] = useMemo(
    () =>
      [...files]
        .sort((a, b) => a.order - b.order)
        .map((f) => ({ ...f, kind: mapToViewer(f.fileName, f.mimeType ?? '') })),
    [files],
  );

  // Lightbox CHỈ duyệt ảnh: nếu cho nó index theo `items`, bấm next từ ảnh cuối sẽ
  // rơi vào PDF và render PDF bằng <img>.
  const images = items.filter((f) => f.kind === 'image');
  const allImages = items.length > 0 && images.length === items.length;
  const singlePdf = items.length === 1 && items[0].kind === 'pdf';

  if (items.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex min-h-[30vh] items-center justify-center rounded-lg text-sm">
        {emptyHint ?? 'Chưa có tệp nào'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {items.length} tệp{items.length > 1 ? ' · cuộn để xem lần lượt' : ''}
        </p>
        {items.length === 1 ? (
          <Button asChild size="sm" variant="outline" className="cursor-pointer">
            <a href={items[0].fileUrl} target="_blank" rel="noreferrer noopener" download>
              <Download /> Tải về
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => downloadAll(items)}
          >
            <Download /> Tải tất cả
          </Button>
        )}
      </div>

      {singlePdf && (
        <div className="border-divider bg-card h-[70vh] overflow-hidden rounded-lg border">
          <object data={items[0].fileUrl} type="application/pdf" className="h-full w-full">
            <iframe
              src={items[0].fileUrl}
              title={items[0].fileName}
              className="h-full w-full border-0"
            />
          </object>
        </div>
      )}

      {allImages && (
        <div className="space-y-3">
          {items.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map((f, i) => (
                <button
                  key={`${f.fileUrl}-${i}`}
                  type="button"
                  onClick={() => document.getElementById(`test-page-${i}`)?.scrollIntoView()}
                  className="border-divider hover:border-purple relative size-16 shrink-0 overflow-hidden rounded border"
                  aria-label={`Trang ${i + 1}`}
                >
                  {/* next/image cần khai remotePatterns cho host R2 — repo chưa có, và
                      không component nào khác dùng. Dùng img thẳng như DocumentViewer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.fileUrl} alt="" className="size-full object-cover" />
                  <span className="bg-background/80 absolute right-0 bottom-0 px-1 text-[10px]">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {items.map((f, i) => (
              <button
                key={`${f.fileUrl}-${i}`}
                id={`test-page-${i}`}
                type="button"
                onClick={() => setLightboxIndex(images.indexOf(f))}
                className="border-divider block w-full cursor-zoom-in overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.fileUrl} alt={f.fileName} className="h-auto w-full" />
              </button>
            ))}
          </div>
        </div>
      )}

      {!allImages && !singlePdf && (
        <div className="space-y-2">
          {items.map((f, i) => (
            <div key={`${f.fileUrl}-${i}`} className="border-divider rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.fileName}</p>
                  <p className="text-muted-foreground text-xs">{formatBytes(f.fileSize)}</p>
                </div>
                {f.kind === 'image' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => setLightboxIndex(images.indexOf(f))}
                  >
                    Phóng to
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="ghost" className="cursor-pointer">
                    <a href={f.fileUrl} target="_blank" rel="noreferrer noopener">
                      <ExternalLink /> Xem
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <a href={f.fileUrl} target="_blank" rel="noreferrer noopener" download>
                    <Download /> Tải về
                  </a>
                </Button>
              </div>

              {f.kind === 'image' && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(images.indexOf(f))}
                  className="mt-3 block w-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.fileUrl} alt={f.fileName} className="h-auto w-full rounded" />
                </button>
              )}

              {f.kind === 'pdf' && (
                <div className="bg-card mt-3 h-[50vh] overflow-hidden rounded border">
                  <object data={f.fileUrl} type="application/pdf" className="h-full w-full">
                    <iframe src={f.fileUrl} title={f.fileName} className="h-full w-full border-0" />
                  </object>
                </div>
              )}

              {f.kind === 'office' && (
                <div className="bg-card mt-3 h-[50vh] overflow-hidden rounded border">
                  <iframe
                    src={buildOfficeEmbedUrl(f.fileUrl)}
                    title={f.fileName}
                    className="h-full w-full border-0"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Lightbox
        items={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: ViewFile[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  // items đổi (đổi bài, xoá file) khi lightbox đang mở → index cũ có thể trỏ ra ngoài.
  if (index === null || index < 0 || index >= items.length) return null;
  const file = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="bg-background/95 h-[90vh] max-w-[95vw] p-0 sm:max-w-[95vw]"
      >
        <DialogTitle className="sr-only">{file.fileName}</DialogTitle>
        <div className="relative flex h-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.fileUrl}
            alt={file.fileName}
            className="max-h-full max-w-full object-contain"
          />

          {hasPrev && (
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onChange(index - 1)}
              className="absolute left-3 cursor-pointer"
              aria-label="Ảnh trước"
            >
              <ChevronLeft />
            </Button>
          )}
          {hasNext && (
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onChange(index + 1)}
              className={cn('absolute right-3 cursor-pointer')}
              aria-label="Ảnh sau"
            >
              <ChevronRight />
            </Button>
          )}

          <p className="bg-background/80 absolute bottom-3 rounded px-2 py-1 text-xs">
            {index + 1} / {items.length} · {file.fileName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
