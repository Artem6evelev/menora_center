// app/[locale]/dashboard/family/EditMemberDialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateMemberDetailsAction } from "./tree-actions";

type Gender = "MALE" | "FEMALE" | "OTHER" | null;

export type EditableMember = {
  id: string;
  fullName: string;
  hebrewName: string | null;
  gender: Gender;
  birthDateGeorgian: string | null; // ISO string
  yahrzeitDateGeorgian: string | null; // ISO string
};

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function EditMemberDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  familyId: string;
  locale: string;
  member: EditableMember | null;
  canEdit: boolean;
  onUpdated?: (patch: Partial<EditableMember>) => void;
}) {
  const { open, onOpenChange, familyId, member, canEdit, onUpdated } = props;
  const [pending, startTransition] = React.useTransition();

  const [fullName, setFullName] = React.useState("");
  const [hebrewName, setHebrewName] = React.useState("");
  const [gender, setGender] = React.useState<Gender>(null);
  const [birth, setBirth] = React.useState("");
  const [yahrzeit, setYahrzeit] = React.useState("");

  React.useEffect(() => {
    if (!member) return;
    setFullName(member.fullName ?? "");
    setHebrewName(member.hebrewName ?? "");
    setGender(member.gender ?? null);
    setBirth(toDateInputValue(member.birthDateGeorgian));
    setYahrzeit(toDateInputValue(member.yahrzeitDateGeorgian));
  }, [member]);

  async function onSave() {
    if (!member) return;
    if (!canEdit) {
      toast.error("Нет прав на редактирование");
      return;
    }

    startTransition(async () => {
      try {
        await updateMemberDetailsAction({
          familyId,
          memberId: member.id,
          fullName,
          hebrewName: hebrewName || null,
          gender,
          birthDateGeorgian: birth || null,
          yahrzeitDateGeorgian: yahrzeit || null,
        });

        toast.success("Сохранено");

        onUpdated?.({
          fullName,
          hebrewName: hebrewName || null,
          gender,
          birthDateGeorgian: birth ? `${birth}T00:00:00.000Z` : null,
          yahrzeitDateGeorgian: yahrzeit ? `${yahrzeit}T00:00:00.000Z` : null,
        });

        onOpenChange(false);
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось сохранить");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать</DialogTitle>
          <DialogDescription>Обнови данные участника семьи.</DialogDescription>
        </DialogHeader>

        {!member ? (
          <div className="text-sm text-muted-foreground">Нет данных</div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Полное имя</div>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Например: Artem Shevelev"
                disabled={!canEdit || pending}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Имя на иврите</div>
              <Input
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                placeholder="Например: ארטם"
                disabled={!canEdit || pending}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Пол</div>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={gender ?? ""}
                onChange={(e) => setGender((e.target.value as Gender) || null)}
                disabled={!canEdit || pending}
              >
                <option value="">—</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
                <option value="OTHER">Другое</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">День рождения</div>
                <Input
                  type="date"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  disabled={!canEdit || pending}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Йорцайт</div>
                <Input
                  type="date"
                  value={yahrzeit}
                  onChange={(e) => setYahrzeit(e.target.value)}
                  disabled={!canEdit || pending}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Закрыть
          </Button>
          <Button onClick={onSave} disabled={!canEdit || pending || !member}>
            {pending ? "Сохраняю..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
