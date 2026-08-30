'use client';

import { useState, useTransition } from 'react';
import { Pencil, Plus, Tags, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import EmptyState from '@/components/app/EmptyState';
import { useIsTeachingAssistant } from '@/components/app/RoleProvider';
import AddStudentsToGroupModal from './AddStudentsToGroupModal';
import ClassGroupBadge from './ClassGroupBadge';
import ClassGroupFormModal from './ClassGroupFormModal';
import { deleteClassGroupAction } from '@/actions/v1/classes/delete-class-group';
import { handleActionResult } from '@/lib/actions';
import type { ClassGroupRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  groups: ClassGroupRow[];
}

export default function ClassGroupsTab({ classId, groups }: Props) {
  const isTA = useIsTeachingAssistant();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassGroupRow | null>(null);
  const [deleting, setDeleting] = useState<ClassGroupRow | null>(null);
  const [addingStudentsTo, setAddingStudentsTo] = useState<ClassGroupRow | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(g: ClassGroupRow) {
    setEditing(g);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteClassGroupAction(classId, deleting.id);
      const ok = handleActionResult(res.errors, undefined, 'Đã xoá nhóm');
      if (ok) setDeleting(null);
    });
  }

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <CardTitle>Nhóm lớp</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Chia học sinh trong lớp thành các nhóm nhỏ để quản lý và ghi danh khóa học nhanh hơn.
          </p>
        </div>
        {!isTA && (
          <Button onClick={openCreate} className="cursor-pointer">
            <Plus /> Tạo nhóm
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4 sm:pb-6">
        {groups.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Chưa có nhóm nào"
            description={
              isTA
                ? 'Lớp học này chưa được chia nhóm.'
                : 'Dùng nút "Tạo nhóm" ở trên để bắt đầu chia nhóm cho lớp.'
            }
          />
        ) : (
          <ul className="divide-divider divide-y">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <ClassGroupBadge group={g} />
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <UsersIcon className="size-3.5" /> {g.studentCount} học sinh
                  </span>
                </div>
                {!isTA && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer"
                      title="Thêm học sinh vào nhóm"
                      onClick={() => setAddingStudentsTo(g)}
                    >
                      <UserPlus />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer"
                      title="Sửa nhóm"
                      onClick={() => openEdit(g)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      title="Xoá nhóm"
                      onClick={() => setDeleting(g)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {formOpen && (
        <ClassGroupFormModal
          classId={classId}
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={editing ? 'edit' : 'create'}
          initialData={editing}
          usedColors={groups.filter((g) => g.id !== editing?.id).map((g) => g.color)}
        />
      )}

      {addingStudentsTo && (
        <AddStudentsToGroupModal
          classId={classId}
          group={addingStudentsTo}
          open={addingStudentsTo !== null}
          onOpenChange={(o) => !o && setAddingStudentsTo(null)}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá nhóm</AlertDialogTitle>
            <AlertDialogDescription>
              Xoá nhóm <span className="text-foreground font-medium">{deleting?.name}</span>?
              {deleting && deleting.studentCount > 0 && (
                <>
                  {' '}
                  <span className="text-foreground font-medium">
                    {deleting.studentCount} học sinh
                  </span>{' '}
                  đang ở nhóm này sẽ chuyển về trạng thái{' '}
                  <span className="text-foreground font-medium">Chưa phân nhóm</span>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {pending ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
