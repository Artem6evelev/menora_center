import "server-only";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { communityAccess, FILTER_VERSION } from "./policy";
import { fullProfileInput, filterInput } from "./validation";
import { preserveChildHistory } from "./history";
import { prepareChildren } from "./children";
import { CommunityError } from "./errors";

/** Caller owns the transaction. Used by direct saves and OAuth draft completion. */
export async function writeCommunityProfile(tx: any, identity: any, raw: unknown, resourceOnly: boolean, submittedAt?: Date) {
  const parsed = resourceOnly ? filterInput.parse(raw) : fullProfileInput.parse(raw);
  if (resourceOnly && parsed.affiliation !== "none") throw new CommunityError("Выберите подходящую ветку анкеты");
  const userId = identity.id;
  const email = identity.emailAddresses.find((item: any) => item.id === identity.primaryEmailAddressId)?.emailAddress || identity.emailAddresses[0]?.emailAddress;
  if (!email) throw new CommunityError("В аккаунте отсутствует email");
  // Stable Clerk ID and database PK serialize first saves too; a webhook need not arrive first.
  await tx.insert(users).values({ id: userId, email, imageUrl: identity.imageUrl,
    firstName: identity.firstName, lastName: identity.lastName, role: "client" }).onConflictDoNothing();
  const [previous] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
  if (previous.identityDisabledAt) throw new CommunityError("Идентификация аккаунта отключена. Обратитесь к администратору.");
  if (submittedAt) {
    if (previous.filterVersion === FILTER_VERSION && previous.filterCompletedAt) throw new CommunityError("Этот аккаунт уже прошёл актуальный фильтр. Проверьте восстановленные ответы перед явным сохранением.");
  } else if (previous.filterRevision !== parsed.expectedRevision) {
    throw new CommunityError("Анкета уже изменена. Обновите страницу перед сохранением.");
  }
  const filterFields = { affiliation: parsed.affiliation, gender: parsed.gender,
    giyurStage: !resourceOnly && parsed.affiliation === "giyur" ? fullProfileInput.parse(raw).giyurStage ?? null : null,
    filterVersion: FILTER_VERSION, filterCompletedAt: new Date(), filterRevision: previous.filterRevision + 1,
    isProfileComplete: resourceOnly ? previous.isProfileComplete : true };
  let fields: Record<string, unknown> = { ...filterFields, email };
  if (!resourceOnly) {
    const data = fullProfileInput.parse(raw);
    const eligibleMother = communityAccess(filterFields).canManageChildren;
    if (!eligibleMother && data.childrenData?.length) throw new CommunityError("Добавление детей доступно только с профиля еврейской мамы");
    const children = eligibleMother && data.childrenData !== undefined
      ? prepareChildren(userId, data.childrenData, previous.childrenData) : previous.childrenData;
    fields = { ...fields, firstName: data.firstName, lastName: data.lastName, phone: data.phone,
      dateOfBirth: new Date(data.dateOfBirth + "T00:00:00Z"), city: data.city,
      maritalStatus: data.maritalStatus, spouseName: data.maritalStatus === "married" ? data.spouseName ?? null : null,
      hasChildren: data.hasChildren, childrenData: children, agreedToPrivacy: true,
      source: data.source !== undefined ? data.source : previous.source };
    await preserveChildHistory(tx, userId, previous.childrenData);
  }
  await tx.update(users).set(fields).where(eq(users.id, userId));
  const access = communityAccess({ ...previous, ...filterFields });
  return { revision: filterFields.filterRevision, access, welcome: !resourceOnly && !previous.agreedToPrivacy, email,
    redirectTo: access.canViewEvents ? "/dashboard/events" : `/register?result=${parsed.affiliation === "none" ? "resources" : "restricted"}` };
}
