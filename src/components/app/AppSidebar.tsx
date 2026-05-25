'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LucideIcon,
  Users,
  LayoutDashboard,
  UserRound,
  School,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section?: string;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Người dùng', href: '/admin/users', icon: Users, section: 'Quản lý' },
  { label: 'Lớp học', href: '/admin/classes', icon: School, section: 'Quản lý' },
  { label: 'Thông tin cá nhân', href: '/admin/profile', icon: UserRound, section: 'Tài khoản' },
];

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Học tập' },
  { label: 'Buổi học', href: '/dashboard/class-sessions', icon: CalendarDays, section: 'Học tập' },
  { label: 'Thông tin cá nhân', href: '/dashboard/profile', icon: UserRound, section: 'Tài khoản' },
];

interface Props {
  title: string;
  items: NavItem[];
}

function groupBySection(items: NavItem[]): Array<{ section: string; items: NavItem[] }> {
  const groups = new Map<string, NavItem[]>();
  for (const item of items) {
    const key = item.section ?? 'Menu';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups, ([section, items]) => ({ section, items }));
}

export default function AppSidebar({ title, items }: Props) {
  const pathname = usePathname();
  const groups = groupBySection(items);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b p-0 group-data-[collapsible=icon]:p-0">
        <Link
          href="/"
          className="text-sidebar-foreground hover:bg-sidebar-accent flex h-12 items-center gap-2 px-4 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label={title}
        >
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <GraduationCap className="size-4" />
          </span>
          <span className="font-paytone truncate text-base group-data-[collapsible=icon]:hidden">
            {title}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map(({ section, items }, idx) => (
          <Fragment key={section}>
            {idx > 0 && <SidebarSeparator className="bg-sidebar-border" />}
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                {section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={label}>
                          <Link href={href}>
                            <Icon />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </Fragment>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
