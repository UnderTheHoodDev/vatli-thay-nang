'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Film,
  Folder,
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
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmptyState from '@/components/app/EmptyState';
import { cn } from '@/lib/utils';
import { handleActionResult, handleActionErrors } from '@/lib/actions';
import { useUploadManager } from './UploadManagerProvider';
import { getBunnyTusUploadAction } from '@/actions/v1/bunny/get-tus-upload';
import { reorderCourseNodesAction } from '@/actions/v1/course-nodes/reorder-course-nodes';
import { moveCourseNodeAction } from '@/actions/v1/course-nodes/move-course-node';
import { deleteCourseNodeAction } from '@/actions/v1/course-nodes/delete-course-node';
import { getCourseVideoStatusAction } from '@/actions/v1/courses/get-video-status';
import NodeFormModal, { type NodeFormMode } from './NodeFormModal';
import NodeContentViewer from './NodeContentViewer';
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
  return n.type === 'FILE' && n.fileKind === 'VIDEO' && !!n.bunnyStatus && PENDING_STATUSES.includes(n.bunnyStatus);
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

function collectDescendantIds(node: CourseNodeTree, acc: Set<number>) {
  acc.add(node.id);
  for (const c of node.children ?? []) collectDescendantIds(c, acc);
}

function visibleIds(nodes: CourseNodeTree[], expanded: Set<number>, acc: number[]) {
  for (const n of nodes) {
    acc.push(n.id);
    if (n.type === 'FOLDER' && expanded.has(n.id) && n.children) {
      visibleIds(n.children, expanded, acc);
    }
  }
}

interface Props {
  course: CourseDetail;
}

type DeleteTarget = { id: number; title: string; isFolder: boolean };
type ModalState =
  | { mode: NodeFormMode; parentId?: number | null; node?: CourseNodeTree }
  | null;

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

  // ===== DnD =====
  const [dropFolderId, setDropFolderId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortableIds = useMemo(() => {
    const acc: number[] = [];
    visibleIds(displayNodes, expanded, acc);
    return acc;
  }, [displayNodes, expanded]);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isInvalidDrop(activeId: number, overId: number): boolean {
    const activeNode = findNode(nodes, activeId);
    if (!activeNode) return true;
    const descendants = new Set<number>();
    collectDescendantIds(activeNode, descendants);
    return descendants.has(overId);
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) {
      setDropFolderId(null);
      return;
    }
    const activeId = Number(active.id);
    const overId = Number(over.id);
    const overNode = findNode(displayNodes, overId);
    if (overNode?.type === 'FOLDER' && !isInvalidDrop(activeId, overId)) {
      setDropFolderId(overId);
    } else {
      setDropFolderId(null);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setDropFolderId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = Number(active.id);
    const overId = Number(over.id);
    const activeNode = findNode(nodes, activeId);
    const overNode = findNode(nodes, overId);
    if (!activeNode || !overNode) return;

    if (isInvalidDrop(activeId, overId)) {
      handleActionErrors(['Không thể di chuyển thư mục vào chính nó hoặc thư mục con.']);
      return;
    }

    // Thả LÊN folder → chuyển VÀO folder đó (cuối danh sách).
    if (overNode.type === 'FOLDER') {
      if (activeNode.parentId === overNode.id) return; // đã ở trong folder
      moveInto(activeNode, overNode.id);
      return;
    }

    // Thả lên 1 tệp → cùng cha thì reorder, khác cha thì chuyển sang folder của tệp đó.
    const targetParentId = overNode.parentId;
    if (activeNode.parentId === targetParentId) {
      reorderSameParent(targetParentId, activeId, overId);
    } else {
      moveInto(activeNode, targetParentId);
    }
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

  function moveInto(activeNode: CourseNodeTree, newParentId: number | null) {
    // Ra gốc → OMIT newParentId (BE: bỏ trống = root), tránh null qua @Min(1).
    const payload = newParentId != null ? { newParentId } : {};
    startTransition(async () => {
      const res = await moveCourseNodeAction(activeNode.id, course.id, payload);
      if (res.errors.length) handleActionErrors(res.errors);
      // Chuyển cha → refresh để lấy thứ tự/cấu trúc chuẩn từ server.
      router.refresh();
    });
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
              Tổ chức theo thư mục (như Google Drive). Kéo để sắp xếp; thả lên thư mục để chuyển vào
              trong.
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
            <Button
              onClick={() => setModal({ mode: 'create-file', parentId: null })}
              className="cursor-pointer"
            >
              <Plus /> Tệp
            </Button>
          </div>
        </CardHeader>
        {pendingCount > 0 && (
          <div className="mx-6 mb-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Loader2 className="size-4 animate-spin" />
            {pendingCount} video đang tải lên / xử lý — trạng thái sẽ tự cập nhật khi hoàn tất.
          </div>
        )}
        <CardContent className="pb-6">
          {displayNodes.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="Chưa có nội dung"
              description="Tạo thư mục hoặc tải lên tệp đầu tiên để bắt đầu xây dựng khóa học."
              action={
                <Button
                  onClick={() => setModal({ mode: 'create-file', parentId: null })}
                  className="cursor-pointer"
                >
                  <Plus /> Thêm tệp
                </Button>
              }
            />
          ) : (
            <DndContext
              id="course-structure-dnd"
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds}>
                <ul className="space-y-1">
                  {displayNodes.map((node) => (
                    <NodeRow
                      key={node.id}
                      node={node}
                      depth={0}
                      courseId={course.id}
                      expanded={expanded}
                      onToggle={toggle}
                      dropFolderId={dropFolderId}
                      onAddFolder={(pid) => setModal({ mode: 'create-folder', parentId: pid })}
                      onAddFile={(pid) => setModal({ mode: 'create-file', parentId: pid })}
                      onEdit={(n) => setModal({ mode: 'edit', node: n })}
                      onDelete={(n) =>
                        setDeleteTarget({ id: n.id, title: n.title, isFolder: n.type === 'FOLDER' })
                      }
                      onView={(n) => setPreview(n)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

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
  onDelete,
}: {
  isFolder: boolean;
  onEdit: () => void;
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
  dropFolderId: number | null;
  onAddFolder: (parentId: number) => void;
  onAddFile: (parentId: number) => void;
  onEdit: (node: CourseNodeTree) => void;
  onDelete: (node: CourseNodeTree) => void;
  onView: (node: CourseNodeTree) => void;
}

function NodeRow({
  node,
  depth,
  courseId,
  expanded,
  onToggle,
  dropFolderId,
  onAddFolder,
  onAddFile,
  onEdit,
  onDelete,
  onView,
}: NodeRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: node.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isFolder = node.type === 'FOLDER';
  const isVideo = node.type === 'FILE' && node.fileKind === 'VIDEO';
  const open = expanded.has(node.id);
  const isDropTarget = dropFolderId === node.id;

  const { enqueue, hasActive } = useUploadManager();
  const reuploadRef = useRef<HTMLInputElement | null>(null);
  const [reuploading, setReuploading] = useState(false);
  const canResume =
    isVideo && node.bunnyStatus === 'UPLOADING' && !hasActive(node.id);

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
    <li>
      {/* Ref/droppable chỉ ở hàng header (không bao trùm children) → pointerWithin
          không nhầm thả-lên-con thành thả-vào-folder. */}
      <div
        ref={setNodeRef}
        className={cn(
          'border-divider bg-card flex items-center gap-2 rounded-md border px-2 py-1.5',
          isFolder && 'bg-muted/30',
          isDragging && 'opacity-50 shadow',
          isDropTarget && 'ring-primary ring-2',
        )}
        style={{ ...style, marginLeft: depth * 20 }}
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
          <span className="text-muted-foreground w-8 text-center">
            {isVideo ? <Film className="mx-auto size-4" /> : <FileText className="mx-auto size-4" />}
          </span>
        )}

        {isFolder && <Folder className="text-primary size-4 shrink-0" />}

        <span className="text-foreground min-w-0 flex-1 truncate text-sm">{node.title}</span>

        {isFolder ? (
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            {node.children?.length ?? 0} mục
          </Badge>
        ) : isVideo ? (
          <VideoBadge status={node.bunnyStatus} />
        ) : (
          <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
            Tài liệu
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
          onDelete={() => onDelete(node)}
        />
      </div>

      {isFolder && open && (
        <div className="mt-1 space-y-1">
          {node.children && node.children.length > 0 ? (
            <ul className="space-y-1">
              {node.children.map((child) => (
                <NodeRow
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  courseId={courseId}
                  expanded={expanded}
                  onToggle={onToggle}
                  dropFolderId={dropFolderId}
                  onAddFolder={onAddFolder}
                  onAddFile={onAddFile}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                />
              ))}
            </ul>
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
    <Badge variant={meta.variant} className="flex shrink-0 items-center gap-1 px-1.5 py-0 text-[10px]">
      {meta.pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <ListChecks className="size-3" />
      )}
      {meta.label}
    </Badge>
  );
}
