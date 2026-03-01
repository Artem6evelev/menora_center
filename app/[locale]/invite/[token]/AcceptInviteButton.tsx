"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptFamilyInvite } from "@/app/actions/family";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";

export function AcceptInviteButton({
  token,
  locale,
}: {
  token: string;
  locale: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setIsLoading(true);
    const result = await acceptFamilyInvite(token);

    if (result.success) {
      toast.success("Вы успешно присоединились к семье!");
      // Перенаправляем пользователя в дашборд семьи
      router.push(`/${locale}/dashboard/family`);
    } else {
      toast.error(result.error || "Произошла ошибка");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAccept}
      disabled={isLoading}
      className="w-full sm:w-auto gap-2"
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <UserCheck className="h-5 w-5" />
      )}
      Присоединиться к семье
    </Button>
  );
}
