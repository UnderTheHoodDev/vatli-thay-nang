import * as React from 'react';

// 1025 (không phải 1024): sidebar cần ở dạng SP xuyên suốt tới đúng 1024px,
// chỉ chuyển sang desktop từ 1025px — khớp với breakpoint `min-[1025px]` của
// AppSidebar (Tailwind `lg:` = min-width:1024px sẽ chuyển sớm hơn 1px so với ý muốn).
const MOBILE_BREAKPOINT = 1025;

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
