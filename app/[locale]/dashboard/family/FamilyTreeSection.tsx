// app/[locale]/dashboard/family/FamilyTreeSection.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { placeMemberAction, unplaceMemberAction } from "./tree-actions";
import { EditMemberDialog, EditableMember } from "./EditMemberDialog";

import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

type FamilyRole = "HEAD" | "SPOUSE" | "CHILD" | "DEPENDENT";
type Gender = "MALE" | "FEMALE" | "OTHER" | null;

type Member = {
  id: string;
  userId: string | null;
  role: FamilyRole;
  fullName: string;
  hebrewName: string | null;
  gender: Gender;
  birthDateGeorgian: string | null; // ISO
  yahrzeitDateGeorgian: string | null; // ISO
  treePlaced: boolean;
  treeOrder: number;
};

function useIsCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return coarse;
}

function DroppableZone({
  id,
  title,
  empty,
  children,
}: {
  id: string;
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-2xl border bg-muted/20 p-4 transition",
        isOver ? "ring-2 ring-primary/40 bg-muted/30" : "",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 space-y-2">
        {children ? (
          children
        ) : (
          <div className="text-xs text-muted-foreground">{empty}</div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  member,
  isHead,
  saving,
  onEdit,
  canEdit,
  children,
}: {
  member: Member;
  isHead: boolean;
  saving: boolean;
  onEdit: () => void;
  canEdit: boolean;
  children: React.ReactNode;
}) {
  const disabled = member.role === "HEAD" || !isHead;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: member.id,
      disabled,
      data: { memberId: member.id },
    });

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-xl border bg-card p-3 text-start shadow-sm transition",
        isDragging ? "opacity-70" : "opacity-100",
        saving ? "opacity-80" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold leading-tight">{member.fullName}</div>
          {member.hebrewName ? (
            <div className="text-xs text-muted-foreground font-serif mt-1">
              {member.hebrewName}
            </div>
          ) : null}
          {saving ? (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Saving…
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {canEdit ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={saving}
            >
              Edit
            </Button>
          ) : null}

          {!disabled ? (
            <button
              className="cursor-grab active:cursor-grabbing rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              {...listeners}
              {...attributes}
              aria-label="Drag"
              title="Перетащи"
            >
              ⠿
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}

export function FamilyTreeSection(props: {
  locale: string;
  familyId: string;
  isHead: boolean;
  currentUserId: string;
  members: Member[];
}) {
  const { locale, familyId, isHead, currentUserId } = props;
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const isMobile = useIsCoarsePointer();

  const [localMembers, setLocalMembers] = React.useState<Member[]>(
    props.members,
  );
  React.useEffect(() => setLocalMembers(props.members), [props.members]);

  const [savingIds, setSavingIds] = React.useState<Set<string>>(new Set());

  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EditableMember | null>(null);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(
    null,
  );

  const t =
    locale === "he"
      ? {
          title: "עץ משפחה",
          subtitle: "Desktop: גרירה | Mobile: כפתורים",
          unplaced: "לא הוצבו",
          spouse: "בן/בת זוג",
          children: "ילדים",
          relatives: "קרובים",
          makeSpouse: "קבע כבן/בת זוג",
          makeChild: "קבע כילד/ה",
          makeRel: "קבע כקרוב/ה",
          remove: "הסר מהעץ",
          headOnly: "רק ראש המשפחה יכול לערוך",
          empty: "כרגע ריק",
        }
      : locale === "en"
        ? {
            title: "Family Tree",
            subtitle: "Desktop: drag | Mobile: buttons",
            unplaced: "Unplaced",
            spouse: "Spouse",
            children: "Children",
            relatives: "Relatives",
            makeSpouse: "Make spouse",
            makeChild: "Make child",
            makeRel: "Make relative",
            remove: "Remove from tree",
            headOnly: "Only head of family can edit",
            empty: "Empty",
          }
        : {
            title: "Family Tree",
            subtitle: "Desktop: перетаскивание | Mobile: кнопки",
            unplaced: "Неразмещённые",
            spouse: "Супруг(а)",
            children: "Дети",
            relatives: "Родственники",
            makeSpouse: "Сделать супругом",
            makeChild: "Сделать ребёнком",
            makeRel: "Сделать родственником",
            remove: "Убрать из дерева",
            headOnly: "Редактировать может только глава семьи",
            empty: "Пока пусто",
          };

  const head = localMembers.find((m) => m.role === "HEAD");
  const unplaced = localMembers.filter(
    (m) => m.role !== "HEAD" && !m.treePlaced,
  );
  const spouse = localMembers.filter(
    (m) => m.role === "SPOUSE" && m.treePlaced,
  );
  const children = localMembers.filter(
    (m) => m.role === "CHILD" && m.treePlaced,
  );
  const relatives = localMembers.filter(
    (m) => m.role === "DEPENDENT" && m.treePlaced,
  );

  function setSaving(id: string, on: boolean) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function optimisticPatch(memberId: string, patch: Partial<Member>) {
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
    );
  }

  function saveMoveOptimistic(
    memberId: string,
    patch: Partial<Member>,
    run: () => Promise<any>,
  ) {
    if (!isHead) {
      toast.error(t.headOnly);
      return;
    }

    const snapshot = localMembers;
    optimisticPatch(memberId, patch);
    setSaving(memberId, true);

    startTransition(async () => {
      try {
        await run();
        router.refresh();
      } catch (e: any) {
        setLocalMembers(snapshot);
        toast.error(e?.message ?? "Ошибка сохранения");
      } finally {
        setSaving(memberId, false);
      }
    });
  }

  function move(memberId: string, role: "SPOUSE" | "CHILD" | "DEPENDENT") {
    saveMoveOptimistic(memberId, { role, treePlaced: true }, () =>
      placeMemberAction({ familyId, memberId, role }),
    );
  }

  function unplace(memberId: string) {
    saveMoveOptimistic(memberId, { role: "DEPENDENT", treePlaced: false }, () =>
      unplaceMemberAction({ familyId, memberId }),
    );
  }

  function canEditMember(m: Member) {
    return isHead || (m.userId != null && m.userId === currentUserId);
  }

  function openEdit(m: Member) {
    setEditingMemberId(m.id);
    setEditing({
      id: m.id,
      fullName: m.fullName,
      hebrewName: m.hebrewName,
      gender: m.gender ?? null,
      birthDateGeorgian: m.birthDateGeorgian ?? null,
      yahrzeitDateGeorgian: m.yahrzeitDateGeorgian ?? null,
    });
    setEditOpen(true);
  }

  function Actions({ m }: { m: Member }) {
    if (m.role === "HEAD") return null;

    const saving = savingIds.has(m.id);

    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!isHead || pending || saving}
          onClick={() => move(m.id, "SPOUSE")}
        >
          {t.makeSpouse}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!isHead || pending || saving}
          onClick={() => move(m.id, "CHILD")}
        >
          {t.makeChild}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!isHead || pending || saving}
          onClick={() => move(m.id, "DEPENDENT")}
        >
          {t.makeRel}
        </Button>

        {m.treePlaced ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!isHead || pending || saving}
            onClick={() => unplace(m.id)}
          >
            {t.remove}
          </Button>
        ) : null}

        {!isHead ? (
          <div className="text-xs text-muted-foreground self-center">
            {t.headOnly}
          </div>
        ) : null}
      </div>
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id as string | undefined;
    const memberId = String(e.active.id);

    if (!overId) return;

    const dragged = localMembers.find((m) => m.id === memberId);
    if (!dragged || dragged.role === "HEAD") return;

    if (overId === "unplaced") return unplace(memberId);
    if (overId === "spouse") return move(memberId, "SPOUSE");
    if (overId === "children") return move(memberId, "CHILD");
    if (overId === "relatives") return move(memberId, "DEPENDENT");
  }

  const TreeContent = (
    <div className="space-y-4">
      <DroppableZone id="unplaced" title={t.unplaced} empty={t.empty}>
        {unplaced.length === 0 ? (
          <div className="text-xs text-muted-foreground">{t.empty}</div>
        ) : (
          unplaced.map((m) => (
            <DraggableCard
              key={m.id}
              member={m}
              isHead={isHead}
              saving={savingIds.has(m.id)}
              onEdit={() => openEdit(m)}
              canEdit={canEditMember(m)}
            >
              <Actions m={m} />
            </DraggableCard>
          ))
        )}
      </DroppableZone>

      <div className="grid gap-4 lg:grid-cols-3">
        <DroppableZone id="spouse" title={t.spouse} empty={t.empty}>
          {spouse.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              {t.empty}
              {!isMobile ? (
                <div className="mt-1">Перетащи карточку сюда</div>
              ) : null}
            </div>
          ) : (
            spouse.map((m) => (
              <DraggableCard
                key={m.id}
                member={m}
                isHead={isHead}
                saving={savingIds.has(m.id)}
                onEdit={() => openEdit(m)}
                canEdit={canEditMember(m)}
              >
                <Actions m={m} />
              </DraggableCard>
            ))
          )}
        </DroppableZone>

        <div className="rounded-2xl border bg-background p-4">
          <div className="text-sm font-semibold">HEAD</div>
          <div className="mt-3">
            {head ? (
              <DraggableCard
                member={head}
                isHead={isHead}
                saving={false}
                onEdit={() => openEdit(head)}
                canEdit={canEditMember(head)}
              >
                <div className="text-xs text-muted-foreground">
                  Главу семьи не перемещаем
                </div>
              </DraggableCard>
            ) : (
              <div className="text-xs text-muted-foreground">{t.empty}</div>
            )}
          </div>
        </div>

        <DroppableZone id="relatives" title={t.relatives} empty={t.empty}>
          {relatives.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              {t.empty}
              {!isMobile ? (
                <div className="mt-1">Перетащи карточку сюда</div>
              ) : null}
            </div>
          ) : (
            relatives.map((m) => (
              <DraggableCard
                key={m.id}
                member={m}
                isHead={isHead}
                saving={savingIds.has(m.id)}
                onEdit={() => openEdit(m)}
                canEdit={canEditMember(m)}
              >
                <Actions m={m} />
              </DraggableCard>
            ))
          )}
        </DroppableZone>
      </div>

      <DroppableZone id="children" title={t.children} empty={t.empty}>
        {children.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            {t.empty}
            {!isMobile ? (
              <div className="mt-1">Перетащи карточку сюда</div>
            ) : null}
          </div>
        ) : (
          children.map((m) => (
            <DraggableCard
              key={m.id}
              member={m}
              isHead={isHead}
              saving={savingIds.has(m.id)}
              onEdit={() => openEdit(m)}
              canEdit={canEditMember(m)}
            >
              <Actions m={m} />
            </DraggableCard>
          ))
        )}
      </DroppableZone>

      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        familyId={familyId}
        locale={locale}
        member={editing}
        canEdit={
          editingMemberId
            ? canEditMember(
                localMembers.find((m) => m.id === editingMemberId) as any,
              )
            : false
        }
        onUpdated={(patch) => {
          if (!editingMemberId) return;
          setLocalMembers((prev) =>
            prev.map((m) =>
              m.id === editingMemberId ? ({ ...m, ...patch } as any) : m,
            ),
          );
        }}
      />
    </div>
  );

  return (
    <section id="family-tree" className="scroll-mt-24 space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {isMobile ? (
        TreeContent
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          {TreeContent}
        </DndContext>
      )}
    </section>
  );
}
