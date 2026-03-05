"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFamilyMemberAction } from "./member-actions";

type Gender = "MALE" | "FEMALE" | "OTHER" | null;

export type EditableMember = {
  id: string;
  fullName: string;
  hebrewName: string | null;
  gender: Gender;
  birthDateGeorgian: string | null; // ISO or null
  yahrzeitDateGeorgian: string | null; // ISO or null
  isJewishBirthday: boolean;
};

function isoToInputDate(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function EditMemberDrawer({
  open,
  onOpenChange,
  familyId,
  canEdit,
  member,
  onOptimisticUpdate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  familyId: string;
  canEdit: boolean;
  member: EditableMember | null;
  onOptimisticUpdate: (patch: Partial<EditableMember>) => void;
}) {
  const [saving, startTransition] = React.useTransition();

  const [fullName, setFullName] = React.useState("");
  const [hebrewName, setHebrewName] = React.useState("");
  const [gender, setGender] = React.useState<Gender>(null);
  const [birthDate, setBirthDate] = React.useState("");
  const [yahrzeitDate, setYahrzeitDate] = React.useState("");
  const [isJewishBirthday, setIsJewishBirthday] = React.useState(true);

  React.useEffect(() => {
    if (!member) return;
    setFullName(member.fullName ?? "");
    setHebrewName(member.hebrewName ?? "");
    setGender(member.gender ?? null);
    setBirthDate(isoToInputDate(member.birthDateGeorgian));
    setYahrzeitDate(isoToInputDate(member.yahrzeitDateGeorgian));
    setIsJewishBirthday(member.isJewishBirthday ?? true);
  }, [member]);

  const save = () => {
    if (!member) return;

    const patch: Partial<EditableMember> = {
      fullName: fullName.trim() || member.fullName,
      hebrewName: hebrewName.trim() || null,
      gender,
      birthDateGeorgian: birthDate ? `${birthDate}T00:00:00.000Z` : null,
      yahrzeitDateGeorgian: yahrzeitDate
        ? `${yahrzeitDate}T00:00:00.000Z`
        : null,
      isJewishBirthday,
    };

    // ✅ мгновенно
    onOptimisticUpdate(patch);

    startTransition(async () => {
      try {
        await updateFamilyMemberAction({
          familyId,
          memberId: member.id,
          fullName: patch.fullName,
          hebrewName: patch.hebrewName,
          gender: patch.gender,
          birthDateGeorgian: birthDate || null,
          yahrzeitDateGeorgian: yahrzeitDate || null,
          isJewishBirthday,
        });

        toast.success("Сохранено");
        onOpenChange(false);
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось сохранить");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-none sm:w-[520px] sm:h-[92vh] sm:rounded-[24px] sm:ml-auto sm:mr-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle>Личные данные</DialogTitle>
        </DialogHeader>

        {!member ? (
          <div className="text-sm text-muted-foreground">Нет данных</div>
        ) : (
          <div className="space-y-4">
            {!canEdit ? (
              <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                Редактирование доступно только вам или главе семьи.
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">ФИО</div>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Имя на иврите</div>
              <Input
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Пол</div>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={gender ?? ""}
                  onChange={(e) => setGender((e.target.value || null) as any)}
                  disabled={!canEdit}
                >
                  <option value="">Не указано</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                  <option value="OTHER">Другое</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Евр. день рождения
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isJewishBirthday}
                    onChange={(e) => setIsJewishBirthday(e.target.checked)}
                    disabled={!canEdit}
                  />
                  Считать по еврейскому календарю
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Дата рождения (григ.)
                </div>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Йорцайт (григ.)
                </div>
                <Input
                  type="date"
                  value={yahrzeitDate}
                  onChange={(e) => setYahrzeitDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button onClick={save} disabled={!member || !canEdit || saving}>
            {saving ? "Сохраняю..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
