'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  /** Bôi đỏ viền như `error` nhưng không hiện text — dùng khi nhiều ô dùng chung 1 lỗi. */
  invalid?: boolean;
  className?: string;
}

export function FormTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  invalid = false,
  className,
}: FormTextFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const errorId = `${id}-error`;
  const isPassword = type === 'password';

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={isPassword && revealed ? 'text' : type}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error || invalid}
          aria-describedby={error ? errorId : undefined}
          className={isPassword ? 'pr-10' : undefined}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            disabled={disabled}
            aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={revealed}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
