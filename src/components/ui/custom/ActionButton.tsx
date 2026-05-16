import * as React from 'react';
import { Button } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<typeof Button>;

interface ActionButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function ActionButton({
  isLoading = false,
  loadingText = 'Đang xử lý...',
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? loadingText : children}
    </Button>
  );
}
