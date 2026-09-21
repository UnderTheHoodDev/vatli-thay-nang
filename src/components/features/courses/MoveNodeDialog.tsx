'use client';

import { useMemo, useState, useTransition } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderTree, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { handleActionResult } from '@/lib/actions';
import { moveCourseNodeAction } from '@/actions/v1/course-nodes/move-course-node';
import type { CourseNodeTree } from '@/types/course-management';

const ROOT = 'root';
type Target = number | typeof ROOT;

interface Props {
  courseId: number;
  courseTitle: string;
  tree: CourseNodeTree[];
  /** null = đóng dialog. */
  node: CourseNodeTree | null;
  onClose: () => void;
  /** Gọi sau khi chuyển thành công, với thư mục đích (null = gốc khoá học). */
  onMoved: (destinationId: number | null) => void;
}

interface FolderEntry {
  folder: CourseNodeTree;
  /** Tên các thư mục tổ tiên, từ ngoài vào trong. */
  path: string[];
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function collectFolders(nodes: CourseNodeTree[], path: string[], acc: FolderEntry[]) {
  for (const n of nodes) {
    if (n.type !== 'FOLDER') continue;
    acc.push({ folder: n, path });
    collectFolders(n.children ?? [], [...path, n.title], acc);
  }
}

function collectSubtreeIds(node: CourseNodeTree, acc: Set<number>) {
  acc.add(node.id);
  for (const c of node.children ?? []) collectSubtreeIds(c, acc);
}

export default function MoveNodeDialog(props: Props) {
  return (
    <Dialog open={!!props.node} onOpenChange={(open) => !open && props.onClose()}>
      {/* key: mỗi lần mở cho node khác → state chọn/mở rộng/tìm kiếm bắt đầu lại từ đầu. */}
      {props.node && <MoveNodeDialogBody key={props.node.id} {...props} node={props.node} />}
    </Dialog>
  );
}

function MoveNodeDialogBody({
  courseId,
  courseTitle,
  tree,
  node,
  onClose,
  onMoved,
}: Props & { node: CourseNodeTree }) {
  const folders = useMemo(() => {
    const acc: FolderEntry[] = [];
    collectFolders(tree, [], acc);
    return acc;
  }, [tree]);
  const byId = useMemo(() => new Map(folders.map((e) => [e.folder.id, e])), [folders]);

  const currentParent: Target = node.parentId ?? ROOT;
  // Folder không thể chuyển vào chính nó hay thư mục con của nó (BE cũng chặn).
  const blocked = useMemo(() => {
    const ids = new Set<number>();
    if (node.type === 'FOLDER') collectSubtreeIds(node, ids);
    return ids;
  }, [node]);

  const [selected, setSelected] = useState<Target | null>(null);
  const [query, setQuery] = useState('');
  // Mở sẵn đường tới vị trí hiện tại để admin thấy ngay đang ở đâu.
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const open = new Set<number>();
    let id = node.parentId;
    while (id != null) {
      open.add(id);
      id = byId.get(id)?.folder.parentId ?? null;
    }
    return open;
  });
  const [pending, startTransition] = useTransition();

  function reasonDisabled(target: Target): string | null {
    if (target === currentParent) return 'Vị trí hiện tại';
    if (target === node.id) return 'Chính thư mục này';
    if (target !== ROOT && blocked.has(target)) return 'Nằm bên trong thư mục này';
    return null;
  }

  function nameOf(target: Target): string {
    return target === ROOT ? courseTitle : (byId.get(target)?.folder.title ?? '');
  }

  const currentPath = [
    courseTitle,
    ...(node.parentId != null
      ? [...(byId.get(node.parentId)?.path ?? []), nameOf(node.parentId)]
      : []),
  ].join(' › ');

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    if (selected === null || reasonDisabled(selected)) return;
    const destination = selected;
    startTransition(async () => {
      const res = await moveCourseNodeAction(
        node.id,
        courseId,
        // Ra gốc → bỏ trống newParentId (BE: trống = gốc; null không qua được @Min(1)).
        destination === ROOT ? {} : { newParentId: destination },
      );
      const ok = handleActionResult(
        res.errors,
        undefined,
        `Đã chuyển “${node.title}” tới “${nameOf(destination)}”`,
      );
      if (ok) {
        onMoved(destination === ROOT ? null : destination);
        onClose();
      }
    });
  }

  function optionButton(target: Target, label: string, icon: React.ReactNode, sub?: string) {
    const reason = reasonDisabled(target);
    const isSelected = selected === target;
    return (
      <button
        type="button"
        disabled={!!reason || pending}
        aria-pressed={isSelected}
        onClick={() => setSelected(target)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition',
          reason
            ? 'text-muted-foreground cursor-not-allowed opacity-60'
            : 'hover:bg-muted cursor-pointer',
          isSelected && 'bg-primary/10 text-primary ring-primary/40 font-medium ring-1',
        )}
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate">{label}</span>
          {sub && <span className="text-muted-foreground block truncate text-xs">{sub}</span>}
        </span>
        {reason && <span className="shrink-0 text-xs italic">{reason}</span>}
      </button>
    );
  }

  function renderFolders(nodes: CourseNodeTree[], depth: number): React.ReactNode {
    return nodes
      .filter((n) => n.type === 'FOLDER')
      .map((f) => {
        const subfolders = (f.children ?? []).filter((c) => c.type === 'FOLDER');
        const open = expanded.has(f.id);
        // Không mở vào bên trong thư mục đang được chuyển — mọi đích trong đó đều không hợp lệ.
        const canExpand = subfolders.length > 0 && !blocked.has(f.id);
        return (
          <li key={f.id}>
            <div className="flex items-center" style={{ paddingLeft: depth * 18 }}>
              {canExpand ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0 cursor-pointer"
                  aria-label={open ? 'Thu gọn' : 'Mở rộng'}
                  onClick={() => toggle(f.id)}
                >
                  {open ? <ChevronDown /> : <ChevronRight />}
                </Button>
              ) : (
                <span className="size-7 shrink-0" />
              )}
              {optionButton(
                f.id,
                f.title,
                depth === 0 ? (
                  <FolderTree className="text-primary size-4 shrink-0" />
                ) : (
                  <Folder className="text-muted-foreground size-4 shrink-0" />
                ),
              )}
            </div>
            {canExpand && open && <ul>{renderFolders(subfolders, depth + 1)}</ul>}
          </li>
        );
      });
  }

  const q = normalize(query.trim());
  const matches = q ? folders.filter((e) => normalize(e.folder.title).includes(q)) : [];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="pr-6 break-words">Di chuyển “{node.title}”</DialogTitle>
        <DialogDescription>Đang ở: {currentPath}</DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm thư mục theo tên…"
          className="pl-8"
          aria-label="Tìm thư mục đích"
        />
      </div>

      <div className="border-divider max-h-[45vh] min-h-40 overflow-y-auto rounded-md border p-1.5">
        {q ? (
          matches.length ? (
            <ul className="space-y-0.5">
              {matches.map((e) => (
                <li key={e.folder.id} className="flex">
                  {optionButton(
                    e.folder.id,
                    e.folder.title,
                    <Folder className="text-muted-foreground size-4 shrink-0" />,
                    [courseTitle, ...e.path].join(' › '),
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              Không có thư mục nào khớp “{query.trim()}”.
            </p>
          )
        ) : (
          <ul className="space-y-0.5">
            <li className="flex">
              {optionButton(
                ROOT,
                courseTitle,
                <FolderTree className="text-primary size-4 shrink-0" />,
                'Thư mục gốc của khoá học',
              )}
            </li>
            {renderFolders(tree, 0)}
          </ul>
        )}
      </div>

      <DialogFooter className="items-center gap-2 sm:justify-between">
        <p className="text-muted-foreground min-w-0 truncate text-sm">
          {selected === null ? (
            'Chọn thư mục đích'
          ) : (
            <>
              Chuyển tới: <span className="text-foreground font-medium">{nameOf(selected)}</span>
            </>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
            className="cursor-pointer"
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={selected === null || pending}
            className="cursor-pointer"
          >
            {pending ? 'Đang chuyển…' : 'Di chuyển'}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
