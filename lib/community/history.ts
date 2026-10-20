import { eventParticipants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { profileChildren } from "./children";
/** Capture old positional references before a user edits their family. No status/payment changes. */
export async function preserveChildHistory(tx: any, parentId: string, previous: unknown) {
  const children = profileChildren(parentId, previous);
  if (!children.length) return;
  const rows = await tx.select().from(eventParticipants).where(eq(eventParticipants.userId, parentId));
  for (const row of rows) {
    const extra = row.extraData as any;
    if (!extra?.family || Array.isArray(extra.childrenSnapshot)) continue;
    const snapshot = children.filter((child, index) => extra.family[`child_${index}`] || extra.family[`child_${child.id}`]);
    if (snapshot.length) await tx.update(eventParticipants).set({ extraData: { ...extra, childrenSnapshot: snapshot,
      childIds: snapshot.map(child => child.id) } }).where(eq(eventParticipants.id, row.id));
  }
}
