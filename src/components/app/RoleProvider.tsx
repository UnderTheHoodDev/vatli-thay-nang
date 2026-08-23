'use client';

import { createContext, useContext } from 'react';
import type { Role } from '@/types/auth';

const RoleContext = createContext<Role | null>(null);

export function RoleProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

/** Role của user đang đăng nhập trong shell /admin hoặc /dashboard hiện tại. */
export function useRole(): Role {
  const role = useContext(RoleContext);
  if (!role) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return role;
}

/** Trợ giảng: dùng chung UI admin nhưng bị ẩn hầu hết nút tạo/sửa/xoá — xem
 * ISSUE role Trợ giảng. Không phải lớp bảo mật thật (BE đã chặn), chỉ là UX. */
export function useIsTeachingAssistant(): boolean {
  return useRole() === 'TEACHING_ASSISTANT';
}
