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
  BookOpen,
  ChevronRight,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface NavSubItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  section?: string;
  children?: NavSubItem[];
}

export const ADMIN_NAV: NavItem[] = [
  {
    label: 'Tài khoản',
    icon: Users,
    section: 'Quản lý',
    children: [
      { label: 'Người dùng', href: '/admin/accounts' },
      { label: 'Học sinh', href: '/admin/accounts/students' },
    ],
  },
  {
    label: 'Giảng dạy',
    icon: School,
    section: 'Quản lý',
    children: [
      { label: 'Lớp học', href: '/admin/classes' },
      { label: 'Buổi học', href: '/admin/classes/class-sessions' },
    ],
  },
  {
    label: 'Chương trình học',
    icon: BookOpen,
    section: 'Quản lý',
    children: [
      { label: 'Khóa học', href: '/admin/courses' },
      { label: 'Danh mục', href: '/admin/courses/categories' },
    ],
  },
  { label: 'Thông tin cá nhân', href: '/admin/profile', icon: UserRound, section: 'Tài khoản' },
];

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Học tập' },
  { label: 'Lớp học', href: '/dashboard/classes', icon: School, section: 'Học tập' },
  { label: 'Khóa học', href: '/dashboard/courses', icon: BookOpen, section: 'Học tập' },
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

function getActiveState(
  pathname: string,
  items: NavItem[],
): { activeHref: string | null; openGroups: Set<string> } {
  let activeHref: string | null = null;
  const openGroups = new Set<string>();

  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + '/')) {
          if (!activeHref || child.href.length > activeHref.length) {
            activeHref = child.href;
          }
          openGroups.add(item.label);
        }
      }
    } else if (item.href) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        if (!activeHref || item.href.length > activeHref.length) {
          activeHref = item.href;
        }
      }
    }
  }

  return { activeHref, openGroups };
}

export default function AppSidebar({ title, items }: Props) {
  const pathname = usePathname();
  const groups = groupBySection(items);
  const { activeHref, openGroups } = getActiveState(pathname, items);

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
                  {items.map((item) => {
                    if (item.children) {
                      const isOpen = openGroups.has(item.label);
                      return (
                        <Collapsible
                          key={item.label}
                          defaultOpen={isOpen}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                                <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.children.map((child) => {
                                  const active = child.href === activeHref;
                                  return (
                                    <SidebarMenuSubItem key={child.href}>
                                      <SidebarMenuSubButton asChild isActive={active}>
                                        <Link href={child.href}>{child.label}</Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    const active = item.href === activeHref;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                          <Link href={item.href!}>
                            <item.icon />
                            <span>{item.label}</span>
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
