import { CommunityError } from "./errors";
import { createHash, randomUUID } from "node:crypto";
import { childInput } from "./validation";
export interface ProfileChild { id: string; parentId: string; name: string; dateOfBirth: string; [key: string]: unknown }
export function profileChildren(parentId: string, data: unknown): ProfileChild[] {
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => ({ ...item,
    id: typeof item.id === "string" && item.id ? item.id : `legacy_${createHash("sha256").update(`${parentId}:${index}:${item.name}:${item.dateOfBirth || item.birthDate || ""}`).digest("hex").slice(0, 32)}`,
    parentId, name: item.name || "", dateOfBirth: item.dateOfBirth || item.birthDate || "",
  }));
}
export function prepareChildren(parentId: string, input: unknown, previous: unknown): ProfileChild[] {
  if (!Array.isArray(input) || input.length > 20) throw new CommunityError("Проверьте данные детей");
  const existing = profileChildren(parentId, previous);
  const known = new Map(existing.map(child => [child.id, child]));
  const used = new Set<string>();
  return input.map(raw => {
    // parentId is never accepted from the client. An ID must already belong to this profile.
    const parsed = childInput.parse(raw);
    if (parsed.id && (!known.has(parsed.id) || used.has(parsed.id))) throw new CommunityError("Ребёнок не связан с Вашим профилем");
    const id = parsed.id || randomUUID(); used.add(id);
    return { ...(known.get(id) || {}), ...parsed, id, parentId };
  });
}
