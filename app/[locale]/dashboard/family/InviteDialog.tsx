"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createInviteAction } from "./actions";

type InviteDialogProps = {
  locale: string;
};

export function InviteDialog({ locale }: InviteDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inviteId, setInviteId] = React.useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const inviteUrl = React.useMemo(() => {
    if (!inviteId || !origin) return "";
    return new URL(`/${locale}/invite/${inviteId}`, origin).toString();
  }, [inviteId, origin, locale]);

  async function handleCreateInvite() {
    try {
      setLoading(true);
      const res = await createInviteAction();
      setInviteId(res.inviteId);
      toast.success("Приглашение создано");
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось создать приглашение");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  function handleOpenLink() {
    if (!inviteUrl) return;
    window.open(inviteUrl, "_blank", "noopener,noreferrer");
  }

  function handleClose() {
    setOpen(false);
    // хочешь — можешь чистить inviteId при закрытии:
    // setInviteId(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Пригласить</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Приглашение в семью</DialogTitle>
          <DialogDescription>
            Создай ссылку и отправь её человеку. После входа он сможет принять
            приглашение.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!inviteId ? (
            <Button
              onClick={handleCreateInvite}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Создаём..." : "Создать ссылку"}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Ссылка:</div>
                <Input value={inviteUrl} readOnly />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="secondary"
                  className="flex-1"
                >
                  Copy
                </Button>
                <Button onClick={handleOpenLink} className="flex-1">
                  Open
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Если человек открывает ссылку на телефоне без входа — его
                отправит на страницу входа и затем вернёт назад на приглашение.
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
