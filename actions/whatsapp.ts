"use server";

// Приводим любые форматы номеров к международному стандарту (972...)
function formatToWhatsAppId(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  // Если номер начинается с 05... (например, 0528545828)
  if (cleaned.startsWith("05") && cleaned.length === 10) {
    cleaned = "972" + cleaned.substring(1);
  }
  // Если случайно ввели 5... без нуля (например, 528545828)
  else if (cleaned.startsWith("5") && cleaned.length === 9) {
    cleaned = "972" + cleaned;
  }

  return cleaned;
}

export async function sendMassWhatsApp(
  participants: { phone: string; name: string }[],
  messageTemplate: string,
) {
  try {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_TOKEN;

    if (!apiUrl || !token) {
      return {
        success: false,
        error: "Ключи WhatsApp API не настроены в .env",
      };
    }

    let successCount = 0;
    let failCount = 0;

    for (const recipient of participants) {
      if (!recipient.phone) {
        failCount++;
        continue;
      }

      const formattedPhone = formatToWhatsAppId(recipient.phone);

      // Подставляем имя вместо тега {name}. Если имени нет, пишем "друг"
      const personalizedMessage = messageTemplate.replace(
        /{name}/g,
        recipient.name || "друг",
      );

      try {
        // Запрос к шлюзу
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId: `${formattedPhone}@c.us`, // Формат ID для шлюзов вроде Green-API
            message: personalizedMessage,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }

      // 🛑 Искусственная задержка 500мс между отправками для защиты от антиспам-фильтров
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return {
      success: true,
      message: `Рассылка завершена. Успешно: ${successCount}, Ошибок: ${failCount}`,
    };
  } catch (error) {
    console.error("Ошибка при рассылке:", error);
    return { success: false, error: "Внутренняя ошибка сервера" };
  }
}
