import { CommunityError } from "./errors";
import { childInput, registrationInput } from "./validation";
import { communityAccess } from "./policy";
import { prepareChildren, profileChildren } from "./children";
import { z } from "zod";
const updatesInput = z.object({ newSpouseName: z.string().trim().min(2).max(150).optional(), newChild: childInput.omit({ id: true }).optional() }).strict();
export function prepareEventRegistration(profile: any, event: any, raw: unknown, updates?: unknown) {
  const access = communityAccess(profile);
  if (!access.canRegisterSelf) throw new CommunityError("Сначала заполните анкету и проверьте доступ к событиям");
  if (event.isRegistrationClosed || event.status !== "planned") throw new CommunityError("Запись на мероприятие закрыта");
  const input = registrationInput.parse(raw || {});
  const profileUpdate = updatesInput.parse(updates || {});
  const previous = profileChildren(profile.id, profile.childrenData);
  if (profileUpdate.newChild && !access.canManageChildren) throw new CommunityError("Добавлять детей можно только с профиля еврейской мамы");
  const children = profileUpdate.newChild
    ? prepareChildren(profile.id, [...previous.map(({ id, name, dateOfBirth }) => ({ id, name, dateOfBirth })), profileUpdate.newChild], profile.childrenData)
    : previous;
  const selectedIds = new Set(input.childIds || []);
  for (const [key, selected] of Object.entries(input.family)) {
    if (key === "self" || key === "spouse") continue;
    if (!key.startsWith("child_")) throw new CommunityError("Неизвестный участник семьи");
    const suffix = key.slice(6);
    const child = /^\d+$/.test(suffix) ? children[Number(suffix)] : children.find(item => item.id === suffix);
    if (!child) throw new CommunityError("Ребёнок не связан с Вашим профилем");
    if (selected) selectedIds.add(child.id);
  }
  if (selectedIds.size && !access.canRegisterChildren) throw new CommunityError("Запись детей доступна только с профиля еврейской мамы");
  const selectedChildren = [...selectedIds].map(id => {
    const child = children.find(item => item.id === id);
    if (!child || child.parentId !== profile.id) throw new CommunityError("Ребёнок не связан с Вашим профилем");
    return { id: child.id, parentId: profile.id, name: child.name, dateOfBirth: child.dateOfBirth, gender: child.gender || null };
  });
  const spouseName = profileUpdate.newSpouseName || profile.spouseName;
  if (input.family.spouse && !spouseName) throw new CommunityError("Укажите супруга или супругу");
  const family: Record<string, boolean> = { self: true, ...(input.family.spouse ? { spouse: true } : {}) };
  selectedChildren.forEach(child => { family[`child_${child.id}`] = true; });
  const adultPrice = Number.parseFloat(event.price || "0");
  const childPrice = Number.parseFloat(event.childPrice || "0");
  const totalAmount = event.isFree ? 0 : (1 + Number(!!family.spouse) + input.extraAdults) * adultPrice + selectedChildren.length * childPrice;
  if (!Number.isFinite(totalAmount) || totalAmount < 0) throw new CommunityError("Стоимость мероприятия уточняется. Обратитесь к администратору.");
  return { children, spouseName, profileUpdate,
    totalAmount: Math.round(totalAmount * 100) / 100,
    extraData: { family, childIds: selectedChildren.map(child => child.id), childrenSnapshot: selectedChildren, extraAdults: input.extraAdults, extraKids: 0 },
  };
}
