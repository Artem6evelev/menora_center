"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { motion, AnimatePresence } from "framer-motion";

import {
  upsertRelationAction,
  deleteRelationBetweenAction,
} from "./relation-actions";

import { EditMemberDrawer, type EditableMember } from "./EditMemberDrawer";

type RelType =
  | "SPOUSE"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "GRANDPARENT"
  | "GRANDCHILD"
  | "AUNT_UNCLE"
  | "NIECE_NEPHEW"
  | "COUSIN"
  | "IN_LAW"
  | "GUARDIAN"
  | "WARD"
  | "OTHER";

type Gender = "MALE" | "FEMALE" | "OTHER" | null;

type Member = {
  id: string;
  userId: string | null;
  fullName: string;
  hebrewName: string | null;
  gender: Gender;
  birthDateGeorgian: string | null;
  yahrzeitDateGeorgian: string | null;
  isJewishBirthday: boolean;
};

type RelationRow = {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelType;
  toMember: { id: string; fullName: string };
};

const RU_LABEL: Record<RelType, string> = {
  SPOUSE: "Супруг(а)",
  PARENT: "Родитель",
  CHILD: "Ребёнок",
  SIBLING: "Брат/Сестра",
  GRANDPARENT: "Дед/Бабушка",
  GRANDCHILD: "Внук/Внучка",
  AUNT_UNCLE: "Дядя/Тётя",
  NIECE_NEPHEW: "Племянник/Племянница",
  COUSIN: "Кузен/Кузина",
  IN_LAW: "Свойство",
  GUARDIAN: "Опекун",
  WARD: "Подопечный",
  OTHER: "Другое",
};

type Edge = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  lx: number;
  ly: number;
};

const LAYOUT = {
  CANVAS_W: 1800,
  CANVAS_H: 1200,

  HEAD_W: 520,
  SIDE_W: 420,
  TOP_W: 520,
  BOTTOM_W: 520,

  GAP: 180,
  SLOT_MAX_H: 280,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useIsCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return coarse;
}

function quadrant(type: RelType) {
  if (type === "SPOUSE") return "left";
  if (type === "PARENT" || type === "GRANDPARENT") return "top";
  if (type === "CHILD" || type === "GRANDCHILD") return "bottom";
  return "right";
}

function shortName(name: string) {
  const v = name.trim();
  if (v.length <= 22) return v;
  return v.slice(0, 22) + "…";
}

function StaticShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[28px] border bg-muted/10 p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-foreground/[0.03]" />
        <div className="absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-foreground/[0.03]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Wheel/trackpad = PAN
 * Ctrl+wheel/pinch = ZOOM
 * Скорость: pan через rAF, edges НЕ пересчитываем на pan (только на layout/relations/scale)
 */
function CanvasViewport({
  children,
  onTransformRef,
}: {
  children: React.ReactNode;
  onTransformRef: React.MutableRefObject<{
    x: number;
    y: number;
    scale: number;
  }>;
}) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const tRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const [, force] = React.useReducer((x) => x + 1, 0);

  const setT = React.useCallback(
    (next: { x: number; y: number; scale: number }) => {
      tRef.current = next;
      onTransformRef.current = next;
      force();
    },
    [onTransformRef],
  );

  const panAcc = React.useRef({ dx: 0, dy: 0, raf: 0 });

  const applyPan = React.useCallback(() => {
    const { dx, dy } = panAcc.current;
    panAcc.current.dx = 0;
    panAcc.current.dy = 0;
    panAcc.current.raf = 0;

    const cur = tRef.current;
    setT({ ...cur, x: cur.x - dx, y: cur.y - dy });
  }, [setT]);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;

      // если курсор над скроллом слота — пусть он скроллится
      const scrollable = target?.closest?.(
        '[data-scrollable="true"]',
      ) as HTMLElement | null;
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight)
        return;

      // zoom
      if (e.ctrlKey) {
        e.preventDefault();

        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const cur = tRef.current;
        const zoomIntensity = 0.0015;
        const nextScale = clamp(
          cur.scale * (1 - e.deltaY * zoomIntensity),
          0.55,
          2.0,
        );

        const ratio = nextScale / cur.scale;
        const nx = cx - (cx - cur.x) * ratio;
        const ny = cy - (cy - cur.y) * ratio;

        setT({ x: nx, y: ny, scale: nextScale });

        // после зума пересчёт стрелок
        requestAnimationFrame(() => {
          // @ts-ignore
          window.__familyEdgesRaf?.();
        });
        return;
      }

      // pan
      e.preventDefault();
      panAcc.current.dx += e.deltaX;
      panAcc.current.dy += e.deltaY;
      if (!panAcc.current.raf)
        panAcc.current.raf = requestAnimationFrame(applyPan);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [applyPan, setT]);

  const t = tRef.current;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Масштаб: {Math.round(t.scale * 100)}% · Перемещение: колесо/тачпад ·
          Zoom: Pinch / Ctrl+Wheel
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setT({
                ...tRef.current,
                scale: clamp(tRef.current.scale - 0.1, 0.55, 2.0),
              })
            }
          >
            −
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setT({ x: 0, y: 0, scale: 1 })}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setT({
                ...tRef.current,
                scale: clamp(tRef.current.scale + 0.1, 0.55, 2.0),
              })
            }
          >
            +
          </Button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative rounded-[28px] border bg-background/55 overflow-hidden"
        style={{ height: 580 }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const NodeCard = React.forwardRef<
  HTMLDivElement,
  {
    label: string;
    name: string;
    pending?: boolean;

    onOpenProfile?: () => void;

    canManage?: boolean;
    onChangeRelation?: () => void;
    onRemove?: () => void;
  }
>(function NodeCard(props, ref) {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.16 }}
      data-pan-block="true"
      className="rounded-2xl border bg-background/70 backdrop-blur shadow-[0_8px_30px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        onClick={props.onOpenProfile}
        className="min-w-0 text-left flex-1"
        aria-label="Открыть профиль"
      >
        <div className="text-[11px] text-muted-foreground">{props.label}</div>
        <div className="text-sm font-semibold truncate">{props.name}</div>
      </button>

      <div className="flex items-center gap-2">
        {props.onOpenProfile ? (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              props.onOpenProfile?.();
            }}
            aria-label="Личные данные"
            title="Личные данные"
          >
            <UserRound className="h-4 w-4" />
          </Button>
        ) : null}

        {props.canManage && props.onChangeRelation ? (
          <Button
            size="sm"
            variant="outline"
            disabled={props.pending}
            onClick={(e) => {
              e.stopPropagation();
              props.onChangeRelation?.();
            }}
          >
            Связь
          </Button>
        ) : null}

        {props.canManage && props.onRemove ? (
          <Button
            size="sm"
            variant="outline"
            disabled={props.pending}
            onClick={(e) => {
              e.stopPropagation();
              props.onRemove?.();
            }}
          >
            Убрать
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
});

function HeadDroppable({
  name,
  canDrop,
  setExternalRef,
  onOpenProfile,
}: {
  name: string;
  canDrop: boolean;
  setExternalRef: (el: HTMLDivElement | null) => void;
  onOpenProfile?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "HEAD_DROP" });

  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      setExternalRef(el);
      setNodeRef(el);
    },
    [setExternalRef, setNodeRef],
  );

  return (
    <motion.div
      ref={setRef}
      layout
      data-pan-block="true"
      className={[
        "rounded-[28px] border bg-background/80 backdrop-blur",
        "px-6 py-5 flex items-center justify-between gap-4",
        "shadow-[0_12px_40px_rgba(0,0,0,0.08)]",
        isOver && canDrop ? "ring-2 ring-primary/40" : "",
      ].join(" ")}
      animate={isOver && canDrop ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.16 }}
    >
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">Глава семьи</div>
        <div className="text-lg font-semibold tracking-tight truncate">
          {name}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onOpenProfile ? (
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-2xl"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile();
            }}
            aria-label="Личные данные главы семьи"
            title="Личные данные"
          >
            <UserRound className="h-4 w-4" />
          </Button>
        ) : null}

        <div className="text-xs text-muted-foreground">
          {canDrop ? "Перетащи сюда" : "Только просмотр"}
        </div>
      </div>
    </motion.div>
  );
}

function DraggableMemberCard({
  m,
  disabled,
  onMobileAdd,
}: {
  m: Member;
  disabled: boolean;
  onMobileAdd?: () => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: m.id,
    disabled,
  });

  return (
    <motion.div
      layout
      ref={setNodeRef}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      whileHover={disabled ? {} : { y: -2 }}
      transition={{ duration: 0.16 }}
      data-pan-block="true"
      className={[
        "min-w-[240px] rounded-2xl border bg-background/70 backdrop-blur",
        "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        "px-4 py-3 flex items-center justify-between gap-3",
        isDragging ? "opacity-40" : "opacity-100",
        disabled ? "opacity-70" : "cursor-grab active:cursor-grabbing",
      ].join(" ")}
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
    >
      <div className="text-sm font-semibold truncate">{m.fullName}</div>

      {disabled ? (
        onMobileAdd ? (
          <Button size="sm" variant="secondary" onClick={onMobileAdd}>
            Добавить
          </Button>
        ) : null
      ) : (
        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
          ⠿
        </span>
      )}
    </motion.div>
  );
}

function DragPreview({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0.9 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-2xl border bg-background/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.18)] px-4 py-3 min-w-[260px] flex items-center justify-between gap-3"
    >
      <div className="text-sm font-semibold truncate">{name}</div>
      <span className="text-xs text-muted-foreground">Перетаскивание</span>
    </motion.div>
  );
}

function SlotStack({
  title,
  items,
  renderItem,
  scheduleEdges,
}: {
  title: string;
  items: RelationRow[];
  renderItem: (r: RelationRow) => React.ReactNode;
  scheduleEdges: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const head = items.slice(0, 3);
  const tail = items.slice(3);

  return (
    <>
      <div
        data-scrollable="true"
        className="space-y-3 pr-2"
        style={{ maxHeight: LAYOUT.SLOT_MAX_H, overflowY: "auto" }}
        onScroll={scheduleEdges}
      >
        <AnimatePresence>
          {head.map((r) => (
            <React.Fragment key={r.id}>{renderItem(r)}</React.Fragment>
          ))}
        </AnimatePresence>

        {tail.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setOpen(true)}
          >
            Ещё +{tail.length}
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Полный список</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto space-y-3 pr-2">
            {items.map((r) => (
              <div key={r.id}>{renderItem(r)}</div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FamilyHeadRelations(props: {
  locale: string;
  familyId: string;

  isHead: boolean;
  currentMemberId: string;

  headMemberId: string;
  headName: string;

  members: Member[];
  relationsFromHead: RelationRow[];
}) {
  const router = useRouter();
  const isMobile = useIsCoarsePointer();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [relations, setRelations] = React.useState(props.relationsFromHead);
  React.useEffect(
    () => setRelations(props.relationsFromHead),
    [props.relationsFromHead],
  );

  const [membersLocal, setMembersLocal] = React.useState<Member[]>(
    props.members,
  );
  React.useEffect(() => setMembersLocal(props.members), [props.members]);

  const [pickOpen, setPickOpen] = React.useState(false);
  const [pendingTo, setPendingTo] = React.useState<Member | null>(null);
  const [pendingType, setPendingType] = React.useState<RelType>("CHILD");
  const [pending, startTransition] = React.useTransition();

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<EditableMember | null>(
    null,
  );

  const canEditMember = React.useCallback(
    (memberId: string) => props.isHead || props.currentMemberId === memberId,
    [props.isHead, props.currentMemberId],
  );

  const openEdit = React.useCallback((m: Member) => {
    setEditMember({
      id: m.id,
      fullName: m.fullName,
      hebrewName: m.hebrewName ?? null,
      gender: m.gender ?? null,
      birthDateGeorgian: m.birthDateGeorgian ?? null,
      yahrzeitDateGeorgian: m.yahrzeitDateGeorgian ?? null,
      isJewishBirthday: m.isJewishBirthday ?? true,
    });
    setEditOpen(true);
  }, []);

  const linkedIds = React.useMemo(
    () => new Set(relations.map((r) => r.toMemberId)),
    [relations],
  );

  const unlinked = React.useMemo(
    () =>
      membersLocal.filter(
        (m) => m.id !== props.headMemberId && !linkedIds.has(m.id),
      ),
    [membersLocal, linkedIds, props.headMemberId],
  );

  const left = React.useMemo(
    () => relations.filter((r) => quadrant(r.type) === "left"),
    [relations],
  );
  const top = React.useMemo(
    () => relations.filter((r) => quadrant(r.type) === "top"),
    [relations],
  );
  const right = React.useMemo(
    () => relations.filter((r) => quadrant(r.type) === "right"),
    [relations],
  );
  const bottom = React.useMemo(
    () => relations.filter((r) => quadrant(r.type) === "bottom"),
    [relations],
  );

  const viewportRef = React.useRef({ x: 0, y: 0, scale: 1 });

  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const headRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [edges, setEdges] = React.useState<Edge[]>([]);

  const setCardRef = React.useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      cardRefs.current[id] = el;
    };
  }, []);

  const recomputeEdges = React.useCallback(() => {
    const canvas = canvasRef.current;
    const head = headRef.current;
    if (!canvas || !head) return;

    const cRect = canvas.getBoundingClientRect();
    const hRect = head.getBoundingClientRect();
    const scale = viewportRef.current.scale || 1;

    const toLocalX = (x: number) => x / scale;
    const toLocalY = (y: number) => y / scale;

    const headCenterX = toLocalX(hRect.left - cRect.left + hRect.width / 2);
    const headCenterY = toLocalY(hRect.top - cRect.top + hRect.height / 2);
    const headTopY = toLocalY(hRect.top - cRect.top);
    const headBottomY = toLocalY(hRect.top - cRect.top + hRect.height);
    const headLeftX = toLocalX(hRect.left - cRect.left);
    const headRightX = toLocalX(hRect.left - cRect.left + hRect.width);

    const next: Edge[] = [];

    for (const r of relations) {
      const el = cardRefs.current[r.toMemberId];
      if (!el) continue;

      const rRect = el.getBoundingClientRect();

      const cardCenterX = toLocalX(rRect.left - cRect.left + rRect.width / 2);
      const cardCenterY = toLocalY(rRect.top - cRect.top + rRect.height / 2);
      const cardTopY = toLocalY(rRect.top - cRect.top);
      const cardBottomY = toLocalY(rRect.top - cRect.top + rRect.height);
      const cardLeftX = toLocalX(rRect.left - cRect.left);
      const cardRightX = toLocalX(rRect.left - cRect.left + rRect.width);

      const q = quadrant(r.type);

      let x1 = headCenterX,
        y1 = headCenterY,
        x2 = cardCenterX,
        y2 = cardCenterY;

      if (q === "top") {
        x1 = headCenterX;
        y1 = headTopY;
        x2 = cardCenterX;
        y2 = cardBottomY;
      } else if (q === "bottom") {
        x1 = headCenterX;
        y1 = headBottomY;
        x2 = cardCenterX;
        y2 = cardTopY;
      } else if (q === "left") {
        x1 = headLeftX;
        y1 = headCenterY;
        x2 = cardRightX;
        y2 = cardCenterY;
      } else if (q === "right") {
        x1 = headRightX;
        y1 = headCenterY;
        x2 = cardLeftX;
        y2 = cardCenterY;
      }

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      // shorten end
      const shorten = 14;
      x2 = x2 - (dx / len) * shorten;
      y2 = y2 - (dy / len) * shorten;

      // label center
      const lx = (x1 + x2) / 2;
      const ly = (y1 + y2) / 2;

      next.push({
        id: `${r.toMemberId}:${r.type}`,
        x1,
        y1,
        x2,
        y2,
        label: RU_LABEL[r.type],
        lx,
        ly,
      });
    }

    setEdges(next);
  }, [relations]);

  const rafRef = React.useRef<number | null>(null);
  const scheduleEdges = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      recomputeEdges();
    });
  }, [recomputeEdges]);

  React.useLayoutEffect(() => {
    scheduleEdges();

    const onResize = () => scheduleEdges();
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => scheduleEdges());
    if (canvasRef.current) ro.observe(canvasRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleEdges]);

  React.useLayoutEffect(() => {
    scheduleEdges();
  }, [scheduleEdges, relations, membersLocal]);

  React.useEffect(() => {
    // @ts-ignore
    window.__familyEdgesRaf = scheduleEdges;
    return () => {
      // @ts-ignore
      window.__familyEdgesRaf = undefined;
    };
  }, [scheduleEdges]);

  function openRelationPicker(to: Member, currentType: RelType) {
    if (!props.isHead) return;
    setPendingTo(to);
    setPendingType(currentType);
    setPickOpen(true);
  }

  function optimisticUpsert(to: Member, type: RelType) {
    setRelations((prev) => [
      ...prev.filter((r) => r.toMemberId !== to.id),
      {
        id: `tmp_${Date.now()}`,
        fromMemberId: props.headMemberId,
        toMemberId: to.id,
        type,
        toMember: { id: to.id, fullName: to.fullName },
      },
    ]);
  }

  function createRelation(type: RelType) {
    if (!pendingTo) return;

    optimisticUpsert(pendingTo, type);
    setPickOpen(false);

    startTransition(async () => {
      try {
        await upsertRelationAction({
          familyId: props.familyId,
          fromMemberId: props.headMemberId,
          toMemberId: pendingTo.id,
          type,
        });
        toast.success("Связь добавлена");
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
        router.refresh();
      }
    });
  }

  function removeRelation(toMemberId: string) {
    setRelations((prev) => prev.filter((r) => r.toMemberId !== toMemberId));

    startTransition(async () => {
      try {
        await deleteRelationBetweenAction({
          familyId: props.familyId,
          a: props.headMemberId,
          b: toMemberId,
        });
        toast.success("Удалено");
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
        router.refresh();
      }
    });
  }

  const chips: RelType[] = [
    "SPOUSE",
    "CHILD",
    "PARENT",
    "SIBLING",
    "COUSIN",
    "OTHER",
  ];

  const activeMember = activeId
    ? membersLocal.find((m) => m.id === activeId)
    : null;

  const CX = LAYOUT.CANVAS_W / 2;
  const CY = LAYOUT.CANVAS_H / 2;
  const leftX = CX - LAYOUT.HEAD_W / 2 - LAYOUT.GAP - LAYOUT.SIDE_W;
  const rightX = CX + LAYOUT.HEAD_W / 2 + LAYOUT.GAP;
  const topY = LAYOUT.GAP;
  const bottomY = LAYOUT.CANVAS_H - LAYOUT.GAP - LAYOUT.SLOT_MAX_H;

  const renderRelationCard = (r: RelationRow) => {
    const full = membersLocal.find((x) => x.id === r.toMemberId);
    if (!full) return null;

    return (
      <NodeCard
        key={r.id}
        ref={setCardRef(r.toMemberId)}
        label={RU_LABEL[r.type]}
        name={r.toMember.fullName}
        pending={pending}
        onOpenProfile={() => openEdit(full)}
        canManage={props.isHead}
        onChangeRelation={() => openRelationPicker(full, r.type)}
        onRemove={() => removeRelation(r.toMemberId)}
      />
    );
  };

  const CanvasContent = (
    <div
      ref={canvasRef}
      className="relative"
      style={{
        width: LAYOUT.CANVAS_W,
        height: LAYOUT.CANVAS_H,
        padding: 60,
      }}
    >
      <svg
        className="absolute inset-0 pointer-events-none text-foreground/40"
        width="100%"
        height="100%"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {edges.map((e) => (
          <g key={e.id}>
            <motion.line
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="currentColor"
              strokeOpacity="0.6"
              strokeWidth="1.4"
              markerEnd="url(#arrow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.28 }}
            />
            <motion.text
              x={e.lx}
              y={e.ly}
              fontSize="11"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.9"
              stroke="hsl(var(--background))"
              strokeWidth="3.2"
              paintOrder="stroke"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              {e.label}
            </motion.text>
          </g>
        ))}
      </svg>

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: LAYOUT.HEAD_W }}
      >
        <HeadDroppable
          name={props.headName}
          canDrop={props.isHead && !isMobile}
          setExternalRef={(el) => (headRef.current = el)}
          onOpenProfile={() => {
            const head = membersLocal.find((m) => m.id === props.headMemberId);
            if (head) openEdit(head);
          }}
        />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: topY, width: LAYOUT.TOP_W }}
      >
        <SlotStack
          title="Родители / предки"
          items={top}
          renderItem={renderRelationCard}
          scheduleEdges={scheduleEdges}
        />
      </div>

      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: leftX, width: LAYOUT.SIDE_W }}
      >
        <SlotStack
          title="Супруг(а)"
          items={left}
          renderItem={renderRelationCard}
          scheduleEdges={scheduleEdges}
        />
      </div>

      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: rightX, width: LAYOUT.SIDE_W }}
      >
        <SlotStack
          title="Родственники"
          items={right}
          renderItem={renderRelationCard}
          scheduleEdges={scheduleEdges}
        />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: bottomY, width: LAYOUT.BOTTOM_W }}
      >
        <SlotStack
          title="Дети / потомки"
          items={bottom}
          renderItem={renderRelationCard}
          scheduleEdges={scheduleEdges}
        />
      </div>
    </div>
  );

  const Canvas = (
    <>
      <StaticShell>
        <div className="space-y-1">
          <div className="text-xl font-semibold tracking-tight">
            Семейное полотно
          </div>
          <div className="text-sm text-muted-foreground">
            Перетащи участника на главу семьи → выбери тип связи. Кнопка 👤 —
            личные данные.
          </div>
        </div>

        <div className="mt-6">
          <CanvasViewport onTransformRef={viewportRef}>
            {CanvasContent}
          </CanvasViewport>
        </div>

        <div className="mt-6 rounded-[22px] border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Не распределены</div>
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold bg-background/60">
              {unlinked.length}
            </span>
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            Добавить связь можно только главе семьи.
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            <AnimatePresence>
              {unlinked.map((m) => (
                <DraggableMemberCard
                  key={m.id}
                  m={m}
                  disabled={!props.isHead || isMobile}
                  onMobileAdd={
                    props.isHead
                      ? () => {
                          setPendingTo(m);
                          setPendingType("CHILD");
                          setPickOpen(true);
                        }
                      : undefined
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <Dialog open={pickOpen} onOpenChange={setPickOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {pendingTo
                  ? `Связать: ${shortName(props.headName)} → ${shortName(pendingTo.fullName)}`
                  : "Добавить связь"}
              </DialogTitle>
              <DialogDescription>
                Связь появляется мгновенно, сохранение уйдёт на сервер в фоне.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {chips.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => createRelation(k)}
                    disabled={pending}
                    className={[
                      "rounded-full border px-3 py-1 text-xs transition",
                      pendingType === k
                        ? "bg-foreground text-background"
                        : "bg-background hover:bg-muted/40",
                    ].join(" ")}
                  >
                    {RU_LABEL[k]}
                  </button>
                ))}
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Все варианты
                </div>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={pendingType}
                  onChange={(e) => setPendingType(e.target.value as RelType)}
                  disabled={pending}
                >
                  {Object.keys(RU_LABEL).map((k) => (
                    <option key={k} value={k}>
                      {RU_LABEL[k as RelType]}
                    </option>
                  ))}
                </select>

                <div className="mt-2">
                  <Button
                    className="w-full"
                    disabled={pending || !pendingTo}
                    onClick={() => createRelation(pendingType)}
                  >
                    {pending ? "Сохраняю..." : "Сохранить связь"}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPickOpen(false)}
                disabled={pending}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </StaticShell>

      <EditMemberDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        familyId={props.familyId}
        canEdit={!!editMember && canEditMember(editMember.id)}
        member={editMember}
        onOptimisticUpdate={(patch) => {
          if (!editMember) return;
          setEditMember({ ...editMember, ...patch });

          setMembersLocal((prev) =>
            prev.map((m) =>
              m.id === editMember.id ? ({ ...m, ...patch } as any) : m,
            ),
          );

          scheduleEdges();
        }}
      />
    </>
  );

  if (props.isHead && !isMobile) {
    return (
      <section className="space-y-4">
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveId(String(e.active.id))}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={(e: DragEndEvent) => {
            setActiveId(null);
            if (e.over?.id !== "HEAD_DROP") return;

            const memberId = String(e.active.id);
            const m = membersLocal.find((x) => x.id === memberId);
            if (!m) return;

            setPendingTo(m);
            setPendingType("CHILD");
            setPickOpen(true);
          }}
        >
          {Canvas}

          <DragOverlay>
            {activeMember ? <DragPreview name={activeMember.fullName} /> : null}
          </DragOverlay>
        </DndContext>
      </section>
    );
  }

  return <section className="space-y-4">{Canvas}</section>;
}
