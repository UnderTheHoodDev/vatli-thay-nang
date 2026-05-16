export function extractErrors(data: unknown): string[] {
  if (!data) return ['Đã có lỗi xảy ra'];

  const e = data as { errors?: string[] | string };

  if (Array.isArray(e.errors)) {
    return e.errors.length ? e.errors : ['Đã có lỗi xảy ra'];
  }

  if (typeof e.errors === 'string') {
    return [e.errors];
  }

  return ['Đã có lỗi xảy ra'];
}
