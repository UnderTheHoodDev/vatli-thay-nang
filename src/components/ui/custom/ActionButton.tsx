import * as React from 'react';
import { Loader2 } from 'lucide-react';
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
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" /> {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
