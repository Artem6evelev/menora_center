// components/admin/MakeAuthorButton.tsx
"use client";

import { useState } from "react";
import { makeUserAuthor } from "@/actions/authors.actions";

interface Props {
  userId: string;
  currentRole: string;
}

export default function MakeAuthorButton({ userId, currentRole }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  // Если юзер уже автор или суперадмин, не показываем кнопку
  if (currentRole === "author" || currentRole === "superadmin") {
    return (
      <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
        Уже {currentRole}
      </span>
    );
  }

  const handleMakeAuthor = async () => {
    if (
      !confirm(
        "Сделать этого пользователя автором? У него появится свой профиль на сайте.",
      )
    )
      return;

    setIsLoading(true);
    try {
      await makeUserAuthor(userId);
      alert("Успешно! Пользователь теперь Автор.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleMakeAuthor}
      disabled={isLoading}
      className="text-xs font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-md transition disabled:opacity-50"
    >
      {isLoading ? "Загрузка..." : "Сделать автором"}
    </button>
  );
}
