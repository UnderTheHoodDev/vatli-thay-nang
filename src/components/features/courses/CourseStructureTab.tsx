'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Folder,
  FolderInput,
  FolderPlus,
  FolderTree,
  GripVertical,
  ListChecks,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EmptyState from '@/components/app/EmptyState';
import { cn } from '@/lib/utils';
import { handleActionResult, handleActionErrors } from '@/lib/actions';
import { useUploadManager } from './UploadManagerProvider';
import { getBunnyTusUploadAction } from '@/actions/v1/bunny/get-tus-upload';
import { reorderCourseNodesAction } from '@/actions/v1/course-nodes/reorder-course-nodes';
import { deleteCourseNodeAction } from '@/actions/v1/course-nodes/delete-course-node';
import { getCourseVideoStatusAction } from '@/actions/v1/courses/get-video-status';
import CourseTestsSection from '@/components/features/tests/CourseTestsSection';
import NodeFormModal, { type NodeFormMode } from './NodeFormModal';
import NodeContentViewer from './NodeContentViewer';
import MoveNodeDialog from './MoveNodeDialog';
import { FILE_KIND_STYLE, fileKindStyle } from './node-kind';
import { useCourseFileUpload } from './useCourseFileUpload';
import {
  BUNNY_STATUS_META,
  type BunnyVideoStatus,
  type CourseDetail,
  type CourseNodeTree,
} from '@/types/course-management';

interface VideoStatusInfo {
  bunnyStatus: BunnyVideoStatus;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

const POLL_INTERVAL_MS = 9000;
const PENDING_STATUSES: BunnyVideoStatus[] = ['UPLOADING', 'QUEUED', 'PROCESSING'];

function isPendingVideo(n: CourseNodeTree): boolean {
  return (
    n.type === 'FILE' &&
    n.fileKind === 'VIDEO' &&
    !!n.bunnyStatus &&
    PENDING_STATUSES.includes(n.bunnyStatus)
  );
}

// ===== recursive tree helpers =====
function hasPendingVideo(nodes: CourseNodeTree[]): boolean {
  return nodes.some((n) => isPendingVideo(n) || (n.children ? hasPendingVideo(n.children) : false));
}

function countPending(nodes: CourseNodeTree[]): number {
  return nodes.reduce(
    (sum, n) => sum + (isPendingVideo(n) ? 1 : 0) + (n.children ? countPending(n.children) : 0),
    0,
  );
}

function mergeStatus(
  nodes: CourseNodeTree[],
  statusMap: Record<number, VideoStatusInfo>,
): CourseNodeTree[] {
  if (Object.keys(statusMap).length === 0) return nodes;
  return nodes.map((n) => {
    const s = n.type === 'FILE' && n.fileKind === 'VIDEO' ? statusMap[n.id] : undefined;
    const base = s
      ? {
          ...n,
          bunnyStatus: s.bunnyStatus,
          durationSeconds: s.durationSeconds ?? n.durationSeconds,
          thumbnailUrl: s.thumbnailUrl ?? n.thumbnailUrl,
        }
      : n;
    return n.children ? { ...base, children: mergeStatus(n.children, statusMap) } : base;
  });
}

function findNode(nodes: CourseNodeTree[], id: number): CourseNodeTree | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getSiblings(nodes: CourseNodeTree[], parentId: number | null): CourseNodeTree[] {
  if (parentId === null) return nodes;
  const parent = findNode(nodes, parentId);
  return parent?.children ?? [];
}

/** Trả cây mới với `children` của folder `parentId` được thay bằng `next` (parentId null = gốc). */
function replaceChildren(
  nodes: CourseNodeTree[],
  parentId: number | null,
  next: CourseNodeTree[],
): CourseNodeTree[] {
  if (parentId === null) return next;
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: next };
    if (n.children) return { ...n, children: replaceChildren(n.children, parentId, next) };
    return n;
  });
}

/** id các thư mục tổ tiên của `id` (không gồm chính nó), từ trong ra ngoài. */
function ancestorIds(nodes: CourseNodeTree[], id: number): number[] {
  const out: number[] = [];
  let cur = findNode(nodes, id)?.parentId ?? null;
  while (cur != null) {
    out.push(cur);
    cur = findNode(nodes, cur)?.parentId ?? null;
  }
  return out;
}

/**
 * Kéo thả chỉ đổi thứ tự trong cùng thư mục: đích thả hợp lệ chỉ là anh em cùng cha.
 * Chuyển sang thư mục khác đi qua menu "Di chuyển…" — tránh lỡ tay thả nhầm vào trong.
 */
const siblingsOnly: CollisionDetection = (args) => {
  const parentId = args.active.data.current?.parentId;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => c.data.current?.parentId === parentId,
    ),
  });
};

const lockToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

interface Props {
  course: CourseDetail;
}

type DeleteTarget = { id: number; title: string; isFolder: boolean };
type ModalState = { mode: NodeFormMode; parentId?: number | null; node?: CourseNodeTree } | null;

export default function CourseStructureTab({ course }: Props) {
  const router = useRouter();
  const [nodes, setNodes] = useState<CourseNodeTree[]>(course.nodes);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<number, VideoStatusInfo>>({});
  const [, startTransition] = useTransition();

  // Reconcile local state khi server re-render (revalidatePath + router.refresh).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes(course.nodes);
    setStatusMap({});
  }, [course.nodes]);

  const displayNodes = useMemo(() => mergeStatus(nodes, statusMap), [nodes, statusMap]);
  const pendingCount = useMemo(() => countPending(displayNodes), [displayNodes]);
  const shouldPoll = useMemo(() => hasPendingVideo(displayNodes), [displayNodes]);

  const refreshedOnSettle = useRef(false);
  useEffect(() => {
    if (!shouldPoll) return;
    let cancelled = false;
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const res = await getCourseVideoStatusAction(course.id);
      if (cancelled || !res.data) return;
      setStatusMap((prev) => {
        const nextMap = { ...prev };
        for (const it of res.data!.items) {
          nextMap[it.nodeId] = {
            bunnyStatus: it.bunnyStatus,
            durationSeconds: it.durationSeconds,
            thumbnailUrl: it.thumbnailUrl,
          };
        }
        return nextMap;
      });
      if (res.data.allSettled && !refreshedOnSettle.current) {
        refreshedOnSettle.current = true;
        router.refresh();
      }
    };
    void tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      refreshedOnSettle.current = false;
    };
  }, [shouldPoll, course.id, router]);

  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<CourseNodeTree | null>(null);

  const [moveTarget, setMoveTarget] = useState<CourseNodeTree | null>(null);

  // ===== DnD: chỉ sắp xếp trong cùng thư mục (dnd-kit pointer) =====
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ===== Upload kiểu Drive: chọn/kéo file → tạo node + upload nền NGAY =====
  const { addFiles } = useCourseFileUpload(course.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pickParentRef = useRef<number | null>(null);
  // Highlight vùng thả file từ máy (khác kéo thả sắp xếp của dnd-kit). 'root' = gốc.
  const [fileDropId, setFileDropId] = useState<number | 'root' | null>(null);

  function openPicker(parentId: number | null) {
    pickParentRef.current = parentId;
    fileInputRef.current?.click();
  }
  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length) void addFiles(files, pickParentRef.current);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  function onFileDragOver(e: React.DragEvent, target: number | 'root') {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setFileDropId(target);
  }
  function onFilesDropped(e: React.DragEvent, parentId: number | null) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileDropId(null);
    const items = e.dataTransfer.items ? Array.from(e.dataTransfer.items) : [];
    const hasDir = items.some((it) => {
      const getEntry = (
        it as unknown as { webkitGetAsEntry?: () => { isDirectory?: boolean } | null }
      ).webkitGetAsEntry;
      return getEntry ? getEntry.call(it)?.isDirectory === true : false;
    });
    if (hasDir) {
      handleActionErrors(['Chưa hỗ trợ kéo cả thư mục — vui lòng kéo từng tệp.']);
      return;
    }
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files, parentId);
  }
  function onRootDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFileDropId(null);
  }

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeNode = findNode(nodes, Number(active.id));
    const overNode = findNode(nodes, Number(over.id));
    // siblingsOnly chỉ trả anh em cùng cha; vẫn chặn phòng cây vừa đổi giữa lúc kéo.
    if (!activeNode || !overNode || activeNode.parentId !== overNode.parentId) return;
    reorderSameParent(activeNode.parentId, activeNode.id, overNode.id);
  }

  function reorderSameParent(parentId: number | null, activeId: number, overId: number) {
    const siblings = getSiblings(nodes, parentId);
    const oldIndex = siblings.findIndex((s) => s.id === activeId);
    const newIndex = siblings.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(siblings, oldIndex, newIndex);
    setNodes((prev) => replaceChildren(prev, parentId, next));
    const payload = {
      parentId: parentId ?? undefined,
      items: next.map((s, i) => ({ id: s.id, order: i + 1 })),
    };
    startTransition(async () => {
      const res = await reorderCourseNodesAction(course.id, payload);
      if (res.errors.length) {
        handleActionResult(res.errors);
        router.refresh();
      }
    });
  }

  function handleMoved(destinationId: number | null) {
    // Mở sẵn thư mục đích để admin thấy ngay mục vừa chuyển nằm ở đâu.
    if (destinationId != null) {
      setExpanded(
        (prev) => new Set([...prev, destinationId, ...ancestorIds(nodes, destinationId)]),
      );
    }
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteCourseNodeAction(deleteTarget.id, course.id);
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Xoá thành công');
      if (ok) setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Nội dung khóa học</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Kéo tệp/video từ máy thả vào thư mục để tải lên ngay. Kéo biểu tượng ⠿ để đổi thứ tự
              trong cùng thư mục; chuyển sang thư mục khác bằng menu <strong>⋮ → Di chuyển</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setModal({ mode: 'create-folder', parentId: null })}
              className="cursor-pointer"
            >
              <FolderPlus /> Thư mục
            </Button>
            <Button onClick={() => openPicker(null)} className="cursor-pointer">
              <Plus /> Tệp
            </Button>
          </div>
        </CardHeader>
        {pendingCount > 0 && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:mx-6 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Loader2 className="size-4 animate-spin" />
            {pendingCount} video đang tải lên / xử lý — trạng thái sẽ tự cập nhật khi hoàn tất.
          </div>
        )}
        <CardContent className="pb-4 sm:pb-6">
          <input ref={fileInputRef} type="file" multiple hidden onChange={onPicked} />
          <div
            onDragOver={(e) => onFileDragOver(e, 'root')}
            onDrop={(e) => onFilesDropped(e, null)}
            onDragLeave={onRootDragLeave}
            className={cn(
              'rounded-lg transition',
              fileDropId === 'root' && 'ring-primary bg-primary/5 ring-2',
            )}
          >
            {displayNodes.length === 0 ? (
              <EmptyState
                icon={FolderTree}
                title="Chưa có nội dung"
                description="Kéo tệp/video thả vào đây, hoặc bấm để chọn tệp."
                action={
                  <Button onClick={() => openPicker(null)} className="cursor-pointer">
                    <Plus /> Thêm tệp
                  </Button>
                }
              />
            ) : (
              <DndContext
                id="course-structure-dnd"
                sensors={sensors}
                collisionDetection={siblingsOnly}
                modifiers={[lockToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayNodes.map((n) => n.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-1">
                    {displayNodes.map((node) => (
                      <NodeRow
                        key={node.id}
                        node={node}
                        depth={0}
                        courseId={course.id}
                        expanded={expanded}
                        onToggle={toggle}
                        fileDropId={typeof fileDropId === 'number' ? fileDropId : null}
                        onFileDragOver={onFileDragOver}
                        onFileDrop={onFilesDropped}
                        onAddFolder={(pid) => setModal({ mode: 'create-folder', parentId: pid })}
                        onAddFile={(pid) => openPicker(pid)}
                        onEdit={(n) => setModal({ mode: 'edit', node: n })}
                        onDelete={(n) =>
                          setDeleteTarget({
                            id: n.id,
                            title: n.title,
                            isFolder: n.type === 'FOLDER',
                          })
                        }
                        onView={(n) => setPreview(n)}
                        onMove={(n) => setMoveTarget(n)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>

      <CourseTestsSection courseId={course.id} />

      {modal && (
        <NodeFormModal
          open={!!modal}
          onOpenChange={(open) => !open && setModal(null)}
          courseId={course.id}
          mode={modal.mode}
          parentId={modal.parentId}
          node={modal.node}
        />
      )}

      <MoveNodeDialog
        courseId={course.id}
        courseTitle={course.title}
        tree={displayNodes}
        node={moveTarget}
        onClose={() => setMoveTarget(null)}
        onMoved={handleMoved}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá {deleteTarget?.isFolder ? 'thư mục' : 'tệp'}{' '}
              <span className="text-foreground font-medium">{deleteTarget?.title}</span>?
              {deleteTarget?.isFolder && ' Toàn bộ thư mục con và tệp bên trong cũng sẽ bị xoá.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="full">
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-divider shrink-0 border-b px-4 py-3">
              <DialogTitle className="truncate pr-8">{preview?.title}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {preview && <NodeContentViewer node={preview} track={false} fill />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowActions({
  isFolder,
  onEdit,
  onMove,
  onDelete,
}: {
  isFolder: boolean;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" title="Thao tác" className="cursor-pointer">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={onEdit}>
          <Pencil className="size-4" /> {isFolder ? 'Đổi tên' : 'Chỉnh sửa'}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={onMove}>
          <FolderInput className="size-4" /> Di chuyển…
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer gap-2"
          onClick={onDelete}
        >
          <Trash2 className="size-4" /> Xoá
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NodeRowProps {
  node: CourseNodeTree;
  depth: number;
  courseId: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  fileDropId: number | null;
  onFileDragOver: (e: React.DragEvent, id: number) => void;
  onFileDrop: (e: React.DragEvent, parentId: number) => void;
  onAddFolder: (parentId: number) => void;
  onAddFile: (parentId: number) => void;
  onEdit: (node: CourseNodeTree) => void;
  onDelete: (node: CourseNodeTree) => void;
  onView: (node: CourseNodeTree) => void;
  onMove: (node: CourseNodeTree) => void;
}

function NodeRow({
  node,
  depth,
  courseId,
  expanded,
  onToggle,
  fileDropId,
  onFileDragOver,
  onFileDrop,
  onAddFolder,
  onAddFile,
  onEdit,
  onDelete,
  onView,
  onMove,
}: NodeRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { parentId: node.parentId },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isFolder = node.type === 'FOLDER';
  const isTopFolder = isFolder && depth === 0; // thư mục cấp trên cùng (dưới khóa học)
  const isVideo = node.type === 'FILE' && node.fileKind === 'VIDEO';
  const isDoc = node.type === 'FILE' && node.fileKind === 'DOCUMENT';
  const kind = fileKindStyle(node.fileKind);
  const KindIcon = kind.icon;
  const open = expanded.has(node.id);
  const isFileDropTarget = isFolder && fileDropId === node.id;

  const { enqueue, hasActive } = useUploadManager();
  const docUploading = isDoc && hasActive(node.id);
  const reuploadRef = useRef<HTMLInputElement | null>(null);
  const [reuploading, setReuploading] = useState(false);
  const canResume = isVideo && node.bunnyStatus === 'UPLOADING' && !hasActive(node.id);

  async function handleReuploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (reuploadRef.current) reuploadRef.current.value = '';
    if (!file || !node.bunnyVideoId) return;
    setReuploading(true);
    try {
      const tus = await getBunnyTusUploadAction({ title: node.title, videoId: node.bunnyVideoId });
      if (tus.errors.length || !tus.data) {
        handleActionErrors(tus.errors.length ? tus.errors : ['Không tạo được phiên upload']);
        return;
      }
      enqueue(file, {
        nodeId: node.id,
        courseId,
        videoId: tus.data.videoId,
        libraryId: tus.data.libraryId,
        signature: tus.data.signature,
        expire: tus.data.expire,
        tusEndpoint: tus.data.tusEndpoint,
      });
    } finally {
      setReuploading(false);
    }
  }

  return (
    // Cả <li> (hàng + các con đang mở) là một khối sắp xếp: kéo qua một thư mục đang mở,
    // cả khối dịch chuyển cùng nhau thay vì hàng tiêu đề đè lên các con.
    <li ref={setNodeRef} style={style} className={cn('relative', isDragging && 'z-10')}>
      <div
        onDragOver={isFolder ? (e) => onFileDragOver(e, node.id) : undefined}
        onDrop={isFolder ? (e) => onFileDrop(e, node.id) : undefined}
        className={cn(
          'border-divider bg-card flex items-center gap-2 rounded-md border px-2 py-1.5',
          isFolder && !isTopFolder && 'bg-muted/30',
          isTopFolder && 'border-primary/30 bg-primary/5',
          isDragging && 'opacity-60 shadow-md',
          isFileDropTarget && 'ring-primary bg-primary/10 ring-2',
        )}
        style={{ marginLeft: depth * 20 }}
      >
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Kéo thả"
        >
          <GripVertical className="size-4" />
        </button>

        {isFolder ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={() => onToggle(node.id)}
            title={open ? 'Thu gọn' : 'Mở rộng'}
          >
            {open ? <ChevronDown /> : <ChevronRight />}
          </Button>
        ) : (
          <span className="flex w-8 shrink-0 justify-center" title={kind.label}>
            <span
              className={cn('flex size-7 items-center justify-center rounded-md', kind.chipClass)}
            >
              <KindIcon className="size-4" />
            </span>
          </span>
        )}

        {isFolder &&
          (isTopFolder ? (
            <FolderTree className="text-primary size-[1.15rem] shrink-0" />
          ) : (
            <Folder className="text-muted-foreground size-4 shrink-0" />
          ))}

        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            isTopFolder
              ? 'text-foreground text-[0.95rem] font-semibold'
              : 'text-foreground text-sm',
          )}
        >
          {node.title}
        </span>

        {isFolder ? (
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            {node.children?.length ?? 0} mục
          </Badge>
        ) : isVideo ? (
          <VideoBadge status={node.bunnyStatus} />
        ) : docUploading ? (
          <Badge
            variant="secondary"
            className="flex shrink-0 items-center gap-1 px-1.5 py-0 text-[10px]"
          >
            <Loader2 className="size-3 animate-spin" /> Đang tải lên
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={cn('shrink-0 px-1.5 py-0 text-[10px]', FILE_KIND_STYLE.DOCUMENT.badgeClass)}
          >
            {FILE_KIND_STYLE.DOCUMENT.label}
          </Badge>
        )}

        {!isFolder && (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="shrink-0 cursor-pointer"
            title="Xem nội dung"
            onClick={() => onView(node)}
          >
            <Eye className="size-3" /> Xem
          </Button>
        )}

        {canResume && (
          <>
            <input
              ref={reuploadRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleReuploadFile}
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="shrink-0 cursor-pointer"
              title="Chọn lại file để tiếp tục tải lên"
              disabled={reuploading}
              onClick={() => reuploadRef.current?.click()}
            >
              <Upload className="size-3" /> Tải lại
            </Button>
          </>
        )}

        {isFolder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Thêm vào thư mục"
                className="cursor-pointer"
              >
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => onAddFolder(node.id)}
              >
                <FolderPlus className="size-4" /> Thư mục con
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onAddFile(node.id)}>
                <FileText className="size-4" /> Tệp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <RowActions
          isFolder={isFolder}
          onEdit={() => onEdit(node)}
          onMove={() => onMove(node)}
          onDelete={() => onDelete(node)}
        />
      </div>

      {isFolder && open && (
        <div className="mt-1 space-y-1">
          {node.children && node.children.length > 0 ? (
            <SortableContext
              items={node.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1">
                {node.children.map((child) => (
                  <NodeRow
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    courseId={courseId}
                    expanded={expanded}
                    onToggle={onToggle}
                    fileDropId={fileDropId}
                    onFileDragOver={onFileDragOver}
                    onFileDrop={onFileDrop}
                    onAddFolder={onAddFolder}
                    onAddFile={onAddFile}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                    onMove={onMove}
                  />
                ))}
              </ul>
            </SortableContext>
          ) : (
            <div
              className="text-muted-foreground flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm italic"
              style={{ marginLeft: (depth + 1) * 20 }}
            >
              <span>Thư mục trống</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  className="cursor-pointer"
                  onClick={() => onAddFolder(node.id)}
                >
                  <FolderPlus className="size-3" /> Thư mục
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="cursor-pointer"
                  onClick={() => onAddFile(node.id)}
                >
                  <Plus className="size-3" /> Tệp
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function VideoBadge({ status }: { status: BunnyVideoStatus | null }) {
  const meta = (status && BUNNY_STATUS_META[status]) ?? BUNNY_STATUS_META.ERROR;
  return (
    <Badge
      variant={meta.variant}
      className="flex shrink-0 items-center gap-1 px-1.5 py-0 text-[10px]"
    >
      {meta.pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <ListChecks className="size-3" />
      )}
      {meta.label}
    </Badge>
  );
}
