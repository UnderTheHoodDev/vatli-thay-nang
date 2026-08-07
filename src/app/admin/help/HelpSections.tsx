'use client';

import { useState } from 'react';
import {
  Users,
  School,
  LayoutDashboard,
  Wallet,
  BookOpen,
  GraduationCap,
  UserRound,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'nguoi-dung', label: 'Người dùng', icon: Users },
  { id: 'lop-hoc', label: 'Lớp học', icon: School },
  { id: 'buoi-hoc', label: 'Buổi học', icon: LayoutDashboard },
  { id: 'hoc-phi', label: 'Học phí', icon: Wallet },
  { id: 'khoa-hoc', label: 'Khóa học', icon: BookOpen },
  { id: 'danh-muc', label: 'Danh mục khóa học', icon: GraduationCap },
  { id: 'ho-so', label: 'Thông tin cá nhân', icon: UserRound },
];

export interface HelpSectionData {
  id: string;
  content: React.ReactNode;
}

interface Props {
  sections: HelpSectionData[];
}

/**
 * Chỉ render content của MỘT mục đang chọn — 7 mục gộp lại có tới 38 ảnh, render
 * hết cùng lúc (dù ảnh lazy-load) vẫn nặng DOM/hydration hơn nhiều so với 1 mục.
 */
export default function HelpSections({ sections }: Props) {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);

  function handleSelect(id: string) {
    setActiveId(id);
    history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <nav className="hidden lg:sticky lg:top-20 lg:block lg:h-fit lg:w-56 lg:shrink-0">
        <p className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wide uppercase">
          Mục lục
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleSelect(item.id)}
                className={
                  item.id === activeId
                    ? 'bg-primary/10 text-primary flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors'
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Chọn nhanh trên mobile — sidebar mục lục chỉ hiện ở màn lớn (lg:) */}
      <div className="flex flex-wrap gap-1.5 lg:hidden">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={
              item.id === activeId
                ? 'bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium'
                : 'bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1">{active.content}</div>
    </div>
  );
}
