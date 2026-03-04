"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptFamilyInvite } from "@/app/actions/family";

export function AcceptInviteButton({
  inviteId,
  locale,
}: {
  inviteId: string;
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onAccept = () => {
    startTransition(async () => {
      const res = await acceptFamilyInvite(inviteId);

      if (!res.success) {
        toast.error(res.error ?? "Не удалось принять приглашение");
        return;
      }

      toast.success("Готово! Вы добавлены в семью");
      router.replace(`/${locale}/dashboard/family`);
      router.refresh();
    });
  };

  return (
    <Button className="w-full" onClick={onAccept} disabled={pending}>
      {pending ? "Принимаем..." : "Принять приглашение"}
    </Button>
  );
}
