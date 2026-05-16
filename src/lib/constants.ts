export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STUDENT', label: 'Học sinh' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'ACTIVATED', label: 'Kích hoạt' },
  { value: 'UNACTIVATED', label: 'Chưa kích hoạt' },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const ALL_VALUE = '__ALL__';
