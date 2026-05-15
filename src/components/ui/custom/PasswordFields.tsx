import { FormTextField } from './FormTextField';

interface PasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  disabled?: boolean;
  showConfirmLabel?: string;
}

export function PasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
  showConfirmLabel = 'Xác nhận mật khẩu',
}: PasswordFieldsProps) {
  return (
    <>
      <FormTextField
        id="password"
        label="Mật khẩu"
        type="password"
        value={password}
        onChange={onPasswordChange}
        required
        disabled={disabled}
      />
      <FormTextField
        id="confirmPassword"
        label={showConfirmLabel}
        type="password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        required
        disabled={disabled}
      />
    </>
  );
}
