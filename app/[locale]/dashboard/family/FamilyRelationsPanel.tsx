"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  upsertRelationAction,
  deleteRelationBetweenAction,
} from "./relation-actions";

type Member = {
  id: string;
  fullName: string;
};

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

type RelationRow = {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelType;
  toMember: { id: string; fullName: string };
};

function labels(locale: string): Record<RelType, string> {
  if (locale === "he") {
    return {
      SPOUSE: "בן/בת זוג",
      PARENT: "הורה",
      CHILD: "ילד/ה",
      SIBLING: "אח/ות",
      GRANDPARENT: "סבא/סבתא",
      GRANDCHILD: "נכד/ה",
      AUNT_UNCLE: "דוד/דודה",
      NIECE_NEPHEW: "אחיין/אחיינית",
      COUSIN: "בן/בת דוד",
      IN_LAW: "מחֹתן/ת",
      GUARDIAN: "אפוטרופוס",
      WARD: "חסוי/ה",
      OTHER: "אחר",
    };
  }
  if (locale === "en") {
    return {
      SPOUSE: "Spouse",
      PARENT: "Parent",
      CHILD: "Child",
      SIBLING: "Sibling",
      GRANDPARENT: "Grandparent",
      GRANDCHILD: "Grandchild",
      AUNT_UNCLE: "Aunt/Uncle",
      NIECE_NEPHEW: "Niece/Nephew",
      COUSIN: "Cousin",
      IN_LAW: "In-law",
      GUARDIAN: "Guardian",
      WARD: "Ward",
      OTHER: "Other",
    };
  }
  return {
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
}

export function FamilyRelationsPanel(props: {
  locale: string;
  familyId: string;
  isHead: boolean;
  currentMemberId: string;
  members: Member[];
  relationsFromCurrent: RelationRow[]; // только связи "от выбранного"
}) {
  const { locale, familyId, isHead, currentMemberId } = props;

  const L = labels(locale);
  const [fromId, setFromId] = React.useState<string>(currentMemberId);
  const [toId, setToId] = React.useState<string>("");
  const [type, setType] = React.useState<RelType>("SIBLING");
  const [pending, startTransition] = React.useTransition();

  // если не HEAD — “от имени” фиксируем на себе
  React.useEffect(() => {
    if (!isHead) setFromId(currentMemberId);
  }, [isHead, currentMemberId]);

  const fromMember = props.members.find((m) => m.id === fromId);
  const toOptions = props.members.filter((m) => m.id !== fromId);

  async function save() {
    if (!toId) {
      toast.error("Выбери человека");
      return;
    }

    startTransition(async () => {
      try {
        await upsertRelationAction({
          familyId,
          fromMemberId: fromId,
          toMemberId: toId,
          type,
        });
        toast.success("Сохранено");
        // проще всего: refresh страницы
        window.location.reload();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
      }
    });
  }

  async function remove(a: string, b: string) {
    startTransition(async () => {
      try {
        await deleteRelationBetweenAction({ familyId, a, b });
        toast.success("Удалено");
        window.location.reload();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-muted/20 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Связи</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Расширенные отношения: супруг, родители/дети, брат/сестра,
          дед/бабушка, кузены и т.д.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <div className="text-sm font-medium mb-1">От имени</div>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            disabled={!isHead || pending}
          >
            {props.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">К кому</div>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            disabled={pending}
          >
            <option value="">— выбрать —</option>
            {toOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Тип</div>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as RelType)}
            disabled={pending}
          >
            {Object.keys(L).map((k) => (
              <option key={k} value={k}>
                {L[k as RelType]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={save} disabled={pending}>
        {pending ? "Сохраняю..." : "Добавить/обновить связь"}
      </Button>

      <div className="pt-2 border-t">
        <div className="text-sm font-semibold mb-2">
          Текущие связи: {fromMember?.fullName ?? ""}
        </div>

        {props.relationsFromCurrent.length === 0 ? (
          <div className="text-sm text-muted-foreground">Пока нет</div>
        ) : (
          <div className="space-y-2">
            {props.relationsFromCurrent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
              >
                <div className="text-sm">
                  <span className="font-medium">{L[r.type]}</span> →{" "}
                  <span className="font-semibold">{r.toMember.fullName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => remove(r.fromMemberId, r.toMemberId)}
                  disabled={pending}
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
