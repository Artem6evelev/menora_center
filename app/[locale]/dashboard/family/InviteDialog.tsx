// app/[locale]/dashboard/family/InviteDialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createFamilyInvite } from "@/app/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, UserPlus, Loader2 } from "lucide-react";

// Строгая типизация ответа от Server Action (Discriminated Union)
type InviteResponse =
  | { success: true; token: string }
  | { success: false; error: string };

export function InviteDialog({ locale }: { locale: string }) {
  // Инициализация локализации (если ключей пока нет, можно временно заменить t() на обычный текст)
  const t = useTranslations("Dashboard.family.invite");

  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [role, setRole] = useState("SPOUSE");

  const handleGenerate = async () => {
    setIsLoading(true);
    setInviteLink(null);

    try {
      // Явно указываем TypeScript ожидаемый тип ответа
      const result = (await createFamilyInvite(role)) as InviteResponse;

      if (result.success) {
        // Формируем абсолютную ссылку для текущей локали
        const link = `${window.location.origin}/${locale}/invite/${result.token}`;
        setInviteLink(link);
        toast.success(t("success_message") || "Ссылка успешно создана");
      } else {
        toast.error(result.error || t("error_message") || "Ошибка генерации");
      }
    } catch (error) {
      toast.error(t("error_message") || "Произошла системная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success(t("copied") || "Ссылка скопирована в буфер обмена");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t("trigger") || "Пригласить"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title") || "Пригласить в семью"}</DialogTitle>
          <DialogDescription>
            {t("description") ||
              "Сгенерируйте уникальную ссылку. Она будет действительна 7 дней."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("select_role") || "Роль члена семьи"}
            </label>
            <Select onValueChange={setRole} defaultValue={role}>
              {/* dir="auto" позволяет корректно отображать выпадающий список на иврите */}
              <SelectTrigger dir="auto">
                <SelectValue
                  placeholder={t("role_placeholder") || "Выберите роль"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPOUSE">
                  {t("role_spouse") || "Супруг / Супруга"}
                </SelectItem>
                <SelectItem value="CHILD">
                  {t("role_child") || "Ребенок"}
                </SelectItem>
                <SelectItem value="DEPENDENT">
                  {t("role_dependent") || "Подопечный (Родственник)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!inviteLink ? (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("generate_button") || "Сгенерировать ссылку"}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                {/* dir="ltr" КРИТИЧЕСКИ ВАЖЕН ЗДЕСЬ, чтобы ссылка не ломалась при RTL (иврит) */}
                <Input
                  readOnly
                  value={inviteLink}
                  className="bg-muted text-xs font-mono"
                  dir="ltr"
                />
                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Отправьте эту ссылку члену вашей семьи в Telegram или WhatsApp.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
