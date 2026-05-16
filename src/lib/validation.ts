export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const VN_PHONE_REGEX = /^(0|\+84)\d{9,10}$/;
export const FULL_NAME_MAX_LENGTH = 100;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Vui lòng nhập email',
  EMAIL_INVALID: 'Email không hợp lệ',
  PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu',
  PASSWORD_INVALID: 'Mật khẩu cần ≥8 ký tự, có 1 chữ hoa và 1 chữ số',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
  EMAIL_PASSWORD_REQUIRED: 'Vui lòng nhập email và mật khẩu',
  CURRENT_PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu hiện tại',
  PASSWORD_SAME_AS_CURRENT: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  FULL_NAME_REQUIRED: 'Vui lòng nhập họ và tên',
  FULL_NAME_TOO_LONG: `Họ và tên không được vượt quá ${100} ký tự`,
  PHONE_INVALID: 'Số điện thoại không hợp lệ',
  PROVINCE_REQUIRED: 'Vui lòng chọn tỉnh',
  GENDER_REQUIRED: 'Vui lòng chọn giới tính',
  SCHOOL_REQUIRED: 'Vui lòng nhập tên trường',
} as const;
