// app/[locale]/dashboard/family/CreateFamilyForm.tsx
"use client";

import { useState } from "react";
import { createNewFamily } from "@/app/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";

export function CreateFamilyForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createNewFamily(formData);

    if (result?.success) {
      toast.success("Профиль семьи успешно создан!");
      // Страница автоматически обновится благодаря revalidatePath в экшене
    } else {
      toast.error(result?.error || "Произошла ошибка при создании");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl bg-card shadow-sm px-4 mt-8">
      <div className="bg-primary/10 p-4 rounded-full mb-6">
        <Users className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-3">
        Создайте профиль семьи
      </h2>
      <p className="text-muted-foreground max-w-md mb-8 text-sm md:text-base">
        Объедините своих близких в один профиль, чтобы вместе получать
        уведомления общины, управлять йорцайтами и отмечать праздники.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row w-full max-w-sm items-center gap-3"
      >
        <Input
          type="text"
          name="familyName"
          placeholder="Например: Семья Коэн"
          required
          disabled={isLoading}
          className="w-full"
        />
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Создать"}
        </Button>
      </form>
    </div>
  );
}
