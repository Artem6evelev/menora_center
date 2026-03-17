import { supabase } from "./client";

// Функция принимает файл (картинку с компьютера) и возвращает готовую ссылку на неё
export async function uploadEventImage(file: File): Promise<string | null> {
  try {
    // 1. Генерируем уникальное имя файла (чтобы файлы с одинаковыми именами не перезаписывали друг друга)
    const fileExt = file.name.split(".").pop(); // достаем расширение (jpg, png)
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    // 2. Загружаем файл в бакет "events"
    const { data, error } = await supabase.storage
      .from("events")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Ошибка при загрузке картинки в Supabase:", error);
      return null;
    }

    // 3. Получаем публичную ссылку на загруженную картинку
    const { data: publicUrlData } = supabase.storage
      .from("events")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Непредвиденная ошибка при загрузке:", error);
    return null;
  }
}
