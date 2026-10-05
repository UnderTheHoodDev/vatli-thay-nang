'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { buildOfficeEmbedUrl, mapToViewer, type ViewerKind } from '@/lib/document-viewer';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TestFile } from '@/types/tests';

interface Props {
  files: TestFile[];
  /** Hiện khi chưa tới giờ mở đề / học sinh chưa nộp gì. */
  emptyHint?: string;
  /**
   * 'slider': toàn ảnh thì chỉ hiện 1 ảnh, chuyển bằng mũi tên / thumbnail / phím ←→.
   * Mặc định 'scroll': cuộn dọc cả tập.
   */
  variant?: 'scroll' | 'slider';
}

/**
 * Kích thước modal chấm bài: rộng 80% (sàn 960px để còn đủ 2 cột), cao 100% - 20px. Ảnh phóng to
 * mở từ slider dùng chung hằng này để hai lớp khớp nhau. Ghi đè lên size="full" nên chỉ đụng w/h/max-h
 * (cùng nhóm tailwind-merge); max-w 96vw của size="full" giữ nguyên làm trần.
 */
export const GRADING_MODAL_SIZE =
  'h-[calc(100dvh-20px)] max-h-[calc(100dvh-20px)] w-[max(80vw,min(96vw,960px))]';

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

/**
 * Xem nhiều file đề bài / bài làm. DocumentViewer chỉ nhận 1 file, mà đề bài và bài
 * làm thường là nhiều ảnh chụp.
 *
 * - Toàn ảnh: cuộn dọc như đọc một tập, kèm dải thumbnail nhảy nhanh, click để phóng to.
 * - 1 PDF: nhúng thẳng.
 * - Trộn nhiều loại: danh sách card, ảnh render inline, còn lại có nút xem/tải.
 */
export default function TestAttachmentViewer({ files, emptyHint, variant = 'scroll' }: Props) {
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

  if (variant === 'slider' && allImages) {
    return (
      <>
        <ImageSlider
          items={items}
          keysEnabled={lightboxIndex === null}
          onZoom={(f) => setLightboxIndex(images.indexOf(f))}
        />
        <Lightbox
          items={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
          fitGradingModal
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {items.length} tệp{items.length > 1 ? ' · cuộn để xem lần lượt' : ''}
        </p>
        <DownloadButton items={items} />
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
                  className="border-divider hover:border-purple relative size-16 shrink-0 cursor-pointer overflow-hidden rounded border"
                  aria-label={`Trang ${i + 1}`}
                >
                  {/* next/image cần khai remotePatterns cho host R2 — repo chưa có, và
                      không component nào khác dùng. Dùng img thẳng như DocumentViewer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.fileUrl} alt="" loading="lazy" className="size-full object-cover" />
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
                aria-label={`Phóng to ${f.fileName}`}
                className="border-divider block w-full cursor-zoom-in overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.fileUrl}
                  alt={f.fileName}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-auto w-full"
                />
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
                  <img
                    src={f.fileUrl}
                    alt={f.fileName}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-auto w-full rounded"
                  />
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

function DownloadButton({ items }: { items: ViewFile[] }) {
  if (items.length === 1) {
    return (
      <Button asChild size="sm" variant="outline" className="cursor-pointer">
        <a href={items[0].fileUrl} target="_blank" rel="noreferrer noopener" download>
          <Download /> Tải về
        </a>
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="outline"
      className="cursor-pointer"
      onClick={() => downloadAll(items)}
    >
      <Download /> Tải tất cả
    </Button>
  );
}

/**
 * Chấm bài: mỗi lần 1 ảnh, rộng hết khung và cuộn dọc TRONG khung nếu ảnh cao — chữ viết
 * tay cần đọc ở độ rộng thật, thu cả ảnh vào khung thì không đọc được (còn có click để
 * phóng to). Mũi tên nằm ngoài phần cuộn nên không trôi theo ảnh.
 */
function ImageSlider({
  items,
  keysEnabled,
  onZoom,
}: {
  items: ViewFile[];
  /** Tắt khi lightbox đang mở — nó tự duyệt ảnh bằng ←→, không để hai bên cùng ăn phím. */
  keysEnabled: boolean;
  onZoom: (file: ViewFile) => void;
}) {
  const [index, setIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  const current = Math.min(index, count - 1);
  const file = items[current];

  useEffect(() => {
    if (!keysEnabled || count < 2) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // Đang gõ điểm / nhận xét thì ←→ là di con trỏ, không phải chuyển ảnh.
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      setIndex((i) => Math.max(0, Math.min(count - 1, i + (e.key === 'ArrowLeft' ? -1 : 1))));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keysEnabled, count]);

  // Nạp trước ảnh kề bên để bấm sang là hiện ngay.
  useEffect(() => {
    [current - 1, current + 1].forEach((i) => {
      if (items[i]) new Image().src = items[i].fileUrl;
    });
  }, [current, items]);

  // Giữ thumbnail đang chọn trong tầm nhìn của dải cuộn ngang (không đụng tới ancestor khác).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[current] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const s = strip.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    if (t.left < s.left) strip.scrollLeft -= s.left - t.left;
    else if (t.right > s.right) strip.scrollLeft += t.right - s.right;
  }, [current]);

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      {/* before: phủ nốt khe padding phía trên khi dính, không thì ảnh lộ ra giữa dải và mép cuộn. */}
      <div className="bg-background before:bg-background sticky top-0 z-10 shrink-0 space-y-3 pb-1 before:absolute before:inset-x-0 before:-top-4 before:h-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {count} tệp{count > 1 ? ` · ảnh ${current + 1}/${count}` : ''}
          </p>
          <DownloadButton items={items} />
        </div>
        {count > 1 && (
          <div ref={stripRef} className="flex gap-2 overflow-x-auto pb-1">
            {items.map((f, i) => (
              <button
                key={`${f.fileUrl}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Trang ${i + 1}`}
                aria-current={i === current}
                className={cn(
                  'relative size-16 shrink-0 cursor-pointer overflow-hidden rounded border-2',
                  i === current ? 'border-purple' : 'border-divider hover:border-purple/60',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.fileUrl} alt="" loading="lazy" className="size-full object-cover" />
                <span className="bg-background/80 absolute right-0 bottom-0 px-1 text-[10px]">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-[60vh] lg:h-auto lg:min-h-0 lg:flex-1">
        <div
          key={current}
          className="border-divider absolute inset-0 overflow-y-auto rounded-lg border"
        >
          <button
            type="button"
            onClick={() => onZoom(file)}
            aria-label={`Phóng to ${file.fileName}`}
            className="block w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.fileUrl} alt={file.fileName} className="h-auto w-full" />
          </button>
        </div>
        {count > 1 && (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Ảnh trước"
              disabled={current === 0}
              onClick={() => setIndex(current - 1)}
              className="bg-background/85 hover:bg-background absolute top-1/2 left-2 -translate-y-1/2 cursor-pointer rounded-full shadow-md"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Ảnh sau"
              disabled={current === count - 1}
              onClick={() => setIndex(current + 1)}
              className="bg-background/85 hover:bg-background absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-full shadow-md"
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onChange,
  fitGradingModal,
}: {
  items: ViewFile[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
  /** Cùng kích thước với modal chấm bài chứa slider. */
  fitGradingModal?: boolean;
}) {
  // Duyệt ảnh bằng mũi tên bàn phím — Escape đã có sẵn từ Dialog (radix đóng khi nhấn
  // Escape). Đặt TRƯỚC early-return để không phá thứ tự hook giữa các lần render.
  useEffect(() => {
    if (index === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && index! > 0) onChange(index! - 1);
      if (e.key === 'ArrowRight' && index! < items.length - 1) onChange(index! + 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, items.length, onChange]);

  // items đổi (đổi bài, xoá file) khi lightbox đang mở → index cũ có thể trỏ ra ngoài.
  if (index === null || index < 0 || index >= items.length) return null;
  const file = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        size={fitGradingModal ? 'full' : 'default'}
        className={cn(
          'bg-background/95 p-0',
          // minmax(0,1fr): ép hàng grid đúng bằng chiều cao hộp, không thì khung trong lớn theo ảnh
          // (min-height: auto) và size="full" (overflow-hidden) cắt mất phần ảnh tràn.
          fitGradingModal
            ? cn(GRADING_MODAL_SIZE, 'grid-rows-[minmax(0,1fr)] border-0')
            : 'h-[90vh] max-w-[95vw] sm:max-w-[95vw]',
        )}
      >
        <DialogTitle className="sr-only">{file.fileName}</DialogTitle>
        <div
          className={cn('relative h-full', !fitGradingModal && 'flex items-center justify-center')}
        >
          {fitGradingModal ? (
            // Chấm bài: ảnh rộng hết khung, cuộn dọc TRONG khung để đọc chữ viết tay ở độ rộng thật;
            // ảnh thấp hơn khung thì căn giữa. Nút/caption nằm ngoài phần cuộn nên không trôi theo ảnh.
            <div key={index} className="absolute inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.fileUrl} alt={file.fileName} className="block h-auto w-full" />
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="max-h-full max-w-full object-contain"
            />
          )}

          <DialogClose className="bg-background text-foreground hover:bg-accent focus:ring-ring absolute top-4 right-4 flex size-8 cursor-pointer items-center justify-center rounded-full border shadow-md transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
            <X className="size-3.5" />
            <span className="sr-only">Đóng</span>
          </DialogClose>

          {hasPrev && (
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onChange(index - 1)}
              className={cn(
                'absolute left-3 cursor-pointer',
                fitGradingModal && 'top-1/2 -translate-y-1/2',
              )}
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
              className={cn(
                'absolute cursor-pointer',
                // right-5: chừa chỗ cho thanh cuộn dọc của ảnh.
                fitGradingModal ? 'top-1/2 right-5 -translate-y-1/2' : 'right-3',
              )}
              aria-label="Ảnh sau"
            >
              <ChevronRight />
            </Button>
          )}

          <p className="bg-background/80 absolute bottom-3 left-2 rounded px-2 py-1 text-xs">
            {index + 1} / {items.length} · {file.fileName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
