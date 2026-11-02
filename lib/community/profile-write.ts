import "server-only";
import { users, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { communityAccess, FILTER_VERSION } from "./policy";
import { fullProfileInput, filterInput, openEventProfileInput } from "./validation";
import { isPublicEvent } from "@/lib/events/eligibility";
import { preserveChildHistory } from "./history";
import { prepareChildren } from "./children";
import { CommunityError } from "./errors";
import { cityLabel, localityById } from "./cities";
import { eventDestination } from "./event-return";

/** Caller owns the transaction. Used by direct saves and OAuth draft completion. */
export async function writeCommunityProfile(tx: any, identity: any, raw: unknown, resourceOnly: boolean, submittedAt?: Date, openEventId?: string) {
  const parsed = resourceOnly ? filterInput.parse(raw) : openEventId ? { ...openEventProfileInput.parse(raw), affiliation: undefined } : fullProfileInput.parse(raw);
  if (resourceOnly && parsed.affiliation !== "none") throw new CommunityError("Выберите подходящую ветку анкеты");
  const userId = identity.id;
  const email = identity.emailAddresses.find((item: any) => item.id === identity.primaryEmailAddressId)?.emailAddress || identity.emailAddresses[0]?.emailAddress;
  if (!email) throw new CommunityError("В аккаунте отсутствует email");
  // Stable Clerk ID and database PK serialize first saves too; a webhook need not arrive first.
  await tx.insert(users).values({ id: userId, email, imageUrl: identity.imageUrl,
    firstName: identity.firstName, lastName: identity.lastName, role: "client" }).onConflictDoNothing();
  return writeCanonicalCommunityProfile(tx, userId, raw, resourceOnly, submittedAt, email, openEventId);
}

/** Shared profile writer; authentication belongs to the website/Mini App adapter.
 * An absent email leaves the canonical nullable address untouched. No messages are sent here. */
export async function writeCanonicalCommunityProfile(tx: any, userId: string, raw: unknown,
  resourceOnly = false, submittedAt?: Date, email?: string, openEventId?: string, ordinaryOnly = false) {
  const basicProfile = !!openEventId || ordinaryOnly;
  const parsed = resourceOnly ? filterInput.parse(raw) : basicProfile ? { ...openEventProfileInput.parse(raw), affiliation: undefined } : fullProfileInput.parse(raw);
  if (resourceOnly && parsed.affiliation !== "none") throw new CommunityError("Выберите подходящую ветку анкеты");
  const [previous] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
  if (!previous) throw new CommunityError("Профиль не найден");
  if (previous.identityDisabledAt) throw new CommunityError("Идентификация аккаунта отключена. Обратитесь к администратору.");
  if (openEventId) {
    const [event] = await tx.select().from(events).where(eq(events.id, openEventId)).for("share");
    if (!isPublicEvent(event) || event.admissionPolicy !== "open") throw new CommunityError("Условия мероприятия изменились. Откройте его страницу заново.");
  }
  if (submittedAt) {
    if (previous.isProfileComplete || previous.filterRevision > 0 || (previous.filterVersion === FILTER_VERSION && previous.filterCompletedAt)) throw new CommunityError("В аккаунте уже есть сохранённые данные. Проверьте восстановленные ответы перед явным сохранением.");
  } else if (previous.filterRevision !== parsed.expectedRevision) {
    throw new CommunityError("Анкета уже изменена. Обновите страницу перед сохранением.");
  }
  const filterFields = basicProfile ? { gender: parsed.gender, filterRevision: previous.filterRevision + 1, isProfileComplete: true } : { affiliation: parsed.affiliation, gender: parsed.gender ?? previous.gender,
    giyurStage: previous.giyurStage,
    filterVersion: FILTER_VERSION, filterCompletedAt: new Date(), filterRevision: previous.filterRevision + 1,
    isProfileComplete: resourceOnly ? previous.isProfileComplete : true };
  let fields: Record<string, unknown> = { ...filterFields, ...(email !== undefined ? { email } : {}) };
  if (!resourceOnly) {
    const data = basicProfile ? openEventProfileInput.parse(raw) : fullProfileInput.parse(raw);
    const city = data.cityId ? localityById(data.cityId) : null;
    if (data.cityId && (!city || data.city !== cityLabel(city))) throw new CommunityError("Выберите город из справочника заново");
    if (!city && (previous.cityId || !previous.city || data.city !== previous.city)) throw new CommunityError("Выберите город из справочника");
    const eligibleMother = communityAccess({ ...previous, ...filterFields }).canManageChildren;
    if (!eligibleMother && data.childrenData?.length) throw new CommunityError("Добавление детей доступно только с профиля еврейской мамы");
    const children = eligibleMother && data.childrenData !== undefined
      ? prepareChildren(userId, data.childrenData, previous.childrenData) : previous.childrenData;
    fields = { ...fields, firstName: data.firstName, lastName: data.lastName, phone: data.phone,
      dateOfBirth: new Date(data.dateOfBirth + "T00:00:00Z"), city: city ? cityLabel(city) : previous.city, cityId: city?.id || null,
      maritalStatus: data.maritalStatus, spouseName: data.maritalStatus === "married" ? data.spouseName ?? null : null,
      hasChildren: data.hasChildren, childrenData: children, agreedToPrivacy: true,
      source: data.source !== undefined ? data.source : previous.source };
    await preserveChildHistory(tx, userId, previous.childrenData);
  }
  await tx.update(users).set(fields).where(eq(users.id, userId));
  const access = communityAccess({ ...previous, ...filterFields });
  return { revision: filterFields.filterRevision, access, welcome: !resourceOnly && !previous.agreedToPrivacy, email: email ?? previous.email,
    redirectTo: parsed.returnTo || access.canViewEvents ? await eventDestination(parsed.returnTo, tx) : "/events" };
}
