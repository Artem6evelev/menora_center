import { requireStaff } from "@/lib/community/server";
import { requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { BROADCAST_IMAGE_LIMIT } from "@/lib/telegram/broadcast-content";
import { uploadBroadcastImage } from "@/lib/telegram/broadcast-image";
import { CommunityError } from "@/lib/community/errors";
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    await requireStaff();
  } catch {
    return Response.json(
      { error: "Недостаточно прав" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const type = request.headers.get("content-type") || "";
    if (!type.startsWith("multipart/form-data;"))
      return Response.json({ error: "Выберите изображение" }, { status: 400 });
    const limit = BROADCAST_IMAGE_LIMIT + 65536,
      reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "Файл не найден" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > limit) {
          await reader.cancel();
          return Response.json(
            { error: "Размер изображения — не более 4 МБ" },
            { status: 413 },
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const form = await new Response(Buffer.concat(chunks), {
        headers: { "Content-Type": type },
      }).formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size > BROADCAST_IMAGE_LIMIT)
      return Response.json(
        { error: "Выберите JPG или PNG размером до 4 МБ" },
        { status: 400 },
      );
    return Response.json(
      { url: await uploadBroadcastImage(file) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof CommunityError
            ? error.message
            : "Не удалось загрузить изображение",
      },
      {
        status: error instanceof CommunityError ? 400 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
