'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, Lock, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BUNNY_STATUS_META } from '@/types/course-management';
import type { CourseDetail, CourseNodeTree } from '@/types/course-management';

interface Props {
  course: CourseDetail;
  activeNodeId: number | null;
  isEnrolled: boolean;
  onSelect: (nodeId: number) => void;
  variant?: 'panel' | 'sheet';
}

function countFiles(nodes: CourseNodeTree[]): number {
  return nodes.reduce(
    (sum, n) => sum + (n.type === 'FILE' ? 1 : 0) + (n.children ? countFiles(n.children) : 0),
    0,
  );
}

export default function CourseContentSidebar({
  course,
  activeNodeId,
  isEnrolled,
  onSelect,
  variant = 'panel',
}: Props) {
  // Mặc định mở tất cả folder gốc.
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(course.nodes.filter((n) => n.type === 'FOLDER').map((n) => n.id)),
  );

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const fileCount = countFiles(course.nodes);

  return (
    <div
      className={cn(
        'border-divider bg-background flex h-full flex-col overflow-hidden rounded-lg border',
        variant === 'sheet' && 'border-0',
      )}
    >
      {/* Header pinned */}
      <div className="border-divider bg-muted/40 shrink-0 border-b px-4 py-3">
        <p className="text-foreground text-sm font-semibold">Nội dung khóa học</p>
        <p className="text-muted-foreground text-xs">{fileCount} bài học / tài liệu</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!isEnrolled && course.nodes.length > 0 && (
          <div className="text-muted-foreground bg-muted/30 flex items-center gap-2 px-4 py-2 text-xs">
            <Lock className="size-3.5 shrink-0" />
            <span>Bạn chưa được ghi danh — nội dung đang bị khóa.</span>
          </div>
        )}
        {course.nodes.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm italic">
            Khóa học chưa có nội dung.
          </p>
        ) : (
          <ul>
            {course.nodes.map((node) => (
              <SidebarNode
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                activeNodeId={activeNodeId}
                isEnrolled={isEnrolled}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface NodeProps {
  node: CourseNodeTree;
  depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  activeNodeId: number | null;
  isEnrolled: boolean;
  onSelect: (nodeId: number) => void;
}

function SidebarNode({
  node,
  depth,
  expanded,
  onToggle,
  activeNodeId,
  isEnrolled,
  onSelect,
}: NodeProps) {
  const pad = { paddingLeft: 12 + depth * 16 };

  if (node.type === 'FOLDER') {
    const open = expanded.has(node.id);
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          style={pad}
          className="bg-muted/20 hover:bg-muted/40 flex w-full items-center gap-2 py-2.5 pr-3 text-left transition"
        >
          {open ? (
            <ChevronDown className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          )}
          <Folder className="text-primary size-4 shrink-0" />
          <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
            {node.title}
          </span>
        </button>
        {open && node.children && (
          <ul>
            {node.children.map((child) => (
              <SidebarNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                activeNodeId={activeNodeId}
                isEnrolled={isEnrolled}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // FILE
  const isVideo = node.fileKind === 'VIDEO';
  const active = node.id === activeNodeId;
  const statusMeta =
    isVideo && node.bunnyStatus
      ? (BUNNY_STATUS_META[node.bunnyStatus] ?? BUNNY_STATUS_META.ERROR)
      : null;
  const showProcessing = isVideo && statusMeta?.pending;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: 12 + depth * 16 + 20 }}
        className={cn(
          'flex w-full items-center gap-2 py-2.5 pr-3 text-left text-sm transition',
          active ? 'bg-purple/10 text-purple font-medium' : 'hover:bg-muted text-foreground',
          !isEnrolled && 'opacity-60',
        )}
      >
        {isVideo ? (
          <PlayCircle
            className={cn('size-4 shrink-0', active ? 'text-purple' : 'text-muted-foreground')}
          />
        ) : (
          <FileText
            className={cn('size-4 shrink-0', active ? 'text-purple' : 'text-muted-foreground')}
          />
        )}
        <span className="min-w-0 flex-1 truncate">{node.title}</span>
        {showProcessing && (
          <Badge variant={statusMeta!.variant} className="px-1 py-0 text-[10px]">
            {node.bunnyStatus === 'UPLOADING'
              ? 'Tải'
              : node.bunnyStatus === 'QUEUED'
                ? 'Chờ'
                : 'Xử lý'}
          </Badge>
        )}
      </button>
    </li>
  );
}
