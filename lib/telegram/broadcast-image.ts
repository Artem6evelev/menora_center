import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { CommunityError } from "@/lib/community/errors";
import { BROADCAST_IMAGE_LIMIT } from "./broadcast-content";

export function validateBroadcastImage(bytes: Uint8Array, mime: string) {
  const b = Buffer.from(bytes);
  if (!b.length || b.length > BROADCAST_IMAGE_LIMIT)
    throw new CommunityError("Выберите JPG или PNG размером до 4 МБ");
  let width = 0,
    height = 0,
    extension = "";
  if (
    mime === "image/png" &&
    b.length >= 24 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    b.toString("ascii", 12, 16) === "IHDR"
  ) {
    width = b.readUInt32BE(16);
    height = b.readUInt32BE(20);
    extension = "png";
  } else if (
    mime === "image/jpeg" &&
    b.length > 4 &&
    b[0] === 255 &&
    b[1] === 216
  ) {
    for (let i = 2; i + 4 <= b.length; ) {
      if (b[i++] !== 255) break;
      while (i < b.length && b[i] === 255) i++;
      if (i + 3 > b.length) break;
      const marker = b[i++];
      if (marker === 218 || marker === 217) break;
      const length = b.readUInt16BE(i);
      if (length < 2 || i + length > b.length) break;
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker) &&
        length >= 7
      ) {
        height = b.readUInt16BE(i + 3);
        width = b.readUInt16BE(i + 5);
        extension = "jpg";
        break;
      }
      i += length;
    }
  }
  if (!width || !height || !extension)
    throw new CommunityError(
      "Не удалось прочитать изображение. Выберите файл JPG или PNG",
    );
  if (width + height > 10000 || Math.max(width / height, height / width) > 20)
    throw new CommunityError(
      "Слишком большой или вытянутый снимок. Уменьшите изображение и загрузите его снова",
    );
  return { extension, width, height };
}

export async function uploadBroadcastImage(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer()),
    { extension } = validateBroadcastImage(bytes, file.type);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new CommunityError("Загрузка изображений временно недоступна");
  const storage = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const object = `telegram-broadcasts/${randomUUID()}.${extension}`;
  const { error } = await storage.storage
    .from("images")
    .upload(object, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error)
    throw new CommunityError(
      "Не удалось загрузить изображение. Попробуйте ещё раз",
    );
  return storage.storage.from("images").getPublicUrl(object).data.publicUrl;
}
