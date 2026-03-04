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
import { createFamilyInvite } from "@/app/actions/family";

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

      const res = await createFamilyInvite("DEPENDENT");

      if (!res.success) {
        toast.error(res.error ?? "Не удалось создать приглашение");
        return;
      }

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

  async function handleShare() {
    if (!inviteUrl) return;

    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({
          title: "Приглашение в семью",
          url: inviteUrl,
        });
        return;
      }
      await handleCopy();
    } catch {
      // пользователь мог отменить share — не ругаемся
    }
  }

  function handleOpenLink() {
    if (!inviteUrl) return;
    window.open(inviteUrl, "_blank", "noopener,noreferrer");
  }

  function handleClose() {
    setOpen(false);
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
                <Button
                  onClick={handleShare}
                  variant="secondary"
                  className="flex-1"
                >
                  Share
                </Button>
                <Button onClick={handleOpenLink} className="flex-1">
                  Open
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                На телефоне лучше отправлять через <b>Share</b> — мессенджеры
                иногда “режут” длинные ссылки.
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
