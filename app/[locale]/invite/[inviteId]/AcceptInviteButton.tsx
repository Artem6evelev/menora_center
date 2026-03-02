"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AcceptInviteButton({
  inviteId,
  locale,
}: {
  inviteId: string;
  locale: string;
}) {
  const [loading, setLoading] = React.useState(false);

  async function onAccept() {
    try {
      setLoading(true);

      // TODO: здесь будет server action acceptInviteAction(inviteId)
      // пока просто показываем, что token дошёл
      toast.success(`Invite accepted: ${inviteId}`);

      // например, редирект после принятия:
      window.location.href = `/${locale}/dashboard/family`;
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось принять приглашение");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onAccept} disabled={loading} className="w-full">
      {loading ? "Принимаем..." : "Принять приглашение"}
    </Button>
  );
}
