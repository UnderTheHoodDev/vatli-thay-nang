import { use, useEffect } from 'react';
import { toast } from 'sonner';

export function handleActionErrors(errors: string[]) {
  errors.forEach((message) => toast.error(message));
}

/**
 * Resolves a streamed server-action promise inside a Suspense boundary and
 * toasts its `errors` as a side effect. Use inside a `use(promise)`-based
 * section component instead of hand-rolling the same `use()` + error-toast
 * `useEffect` pair.
 */
export function useResolved<T extends { errors: string[] }>(promise: Promise<T>): T {
  const result = use(promise);
  useEffect(() => {
    handleActionErrors(result.errors);
  }, [result.errors]);
  return result;
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
