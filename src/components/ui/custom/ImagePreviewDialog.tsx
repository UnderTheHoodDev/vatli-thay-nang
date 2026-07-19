'use client';

import { X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  alt: string;
  onClose: () => void;
}

export function ImagePreviewDialog({ imageUrl, alt, onClose }: ImagePreviewDialogProps) {
  return (
    <Dialog open={!!imageUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        className="w-auto max-w-[90vw] gap-0 border-0 bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            className="max-h-[70vh] max-w-[70vw] rounded-lg object-contain shadow-lg"
          />
        )}
        <DialogClose className="bg-background text-foreground hover:bg-accent focus:ring-ring absolute -top-4 -right-4 flex size-9 cursor-pointer items-center justify-center rounded-full border shadow-md transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
          <X className="size-4" />
          <span className="sr-only">Đóng</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
