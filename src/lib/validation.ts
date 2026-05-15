export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Vui lòng nhập email',
  EMAIL_INVALID: 'Email không hợp lệ',
  PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu',
  PASSWORD_INVALID: 'Mật khẩu cần ≥8 ký tự, có 1 chữ hoa và 1 chữ số',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
  EMAIL_PASSWORD_REQUIRED: 'Vui lòng nhập email và mật khẩu',
  CURRENT_PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu hiện tại',
  PASSWORD_SAME_AS_CURRENT: 'Mật khẩu mới phải khác mật khẩu hiện tại',
} as const;
