import { toast } from 'sonner';

export function handleActionErrors(errors: string[]) {
  errors.forEach((message) => toast.error(message));
}

export function handleActionSuccess(message: string) {
  toast.success(message);
}

export function handleActionResult(
  errors: string[],
  onSuccess?: () => void,
  successMessage?: string,
) {
  if (errors.length) {
    handleActionErrors(errors);
    return false;
  }
  if (successMessage) {
    handleActionSuccess(successMessage);
  }
  onSuccess?.();
  return true;
}
