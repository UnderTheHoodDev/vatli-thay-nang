// Quyết định cách hiển thị tài liệu inline. Ưu tiên phần mở rộng tên file vì
// mimeType lưu từ browser (File.type) không đáng tin (có thể rỗng / octet-stream).

export type ViewerKind = 'pdf' | 'office' | 'image' | 'download';

const EXT_KIND: Record<string, ViewerKind> = {
  pdf: 'pdf',
  doc: 'office',
  docx: 'office',
  xls: 'office',
  xlsx: 'office',
  ppt: 'office',
  pptx: 'office',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  // svg cố tình KHÔNG cho render inline (tránh XSS qua <img>/inline) → download
};

export function getExtension(fileName: string): string {
  if (!fileName.includes('.')) return '';
  return fileName.split('.').pop()!.toLowerCase();
}

export function buildOfficeEmbedUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

export function mapToViewer(fileName: string, mimeType: string): ViewerKind {
  const ext = getExtension(fileName);
  if (ext && EXT_KIND[ext]) return EXT_KIND[ext];

  // Fallback theo mimeType
  const m = (mimeType || '').toLowerCase();
  if (m === 'application/pdf') return 'pdf';
  if (/wordprocessingml|presentationml|spreadsheetml|msword|ms-excel|ms-powerpoint/.test(m)) {
    return 'office';
  }
  if (m.startsWith('image/') && !m.includes('svg')) return 'image';
  return 'download';
}
