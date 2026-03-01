import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Список поддерживаемых языков
const locales = ["en", "ru", "he"];

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Ждем, пока Next.js определит язык (это теперь Promise)
  let locale = await requestLocale;

  // 2. Если язык не пришел или он некорректный — используем дефолтный или 404
  if (!locale || !locales.includes(locale as any)) {
    // Можно вернуть notFound(), но безопаснее для middleware вернуть дефолтный
    locale = "ru";
  }

  return {
    // Возвращаем сам язык и переводы
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
