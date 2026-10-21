import { z } from "zod";
import { AFFILIATIONS, communityAccess, FILTER_VERSION } from "./policy";
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату").refine(value => {
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
}, "Укажите существующую дату в прошлом");
export const childInput = z.object({
  id: z.string().min(1).max(150).optional(),
  name: z.string().trim().min(2, "Укажите имя ребёнка").max(100),
  dateOfBirth: dateOnly,
  gender: z.enum(["male", "female"]).nullable().optional(),
  draftId: z.string().uuid().optional(),
}).strict();
const returnTo = z.string().max(500).regex(/^\/(?:events\/[A-Za-z0-9_-]+|dashboard\/events)$/).optional();
export const filterInput = z.object({
  affiliation: z.enum(AFFILIATIONS), gender: z.enum(["male", "female"]).optional(), returnTo,
  expectedRevision: z.number().int().nonnegative(),
}).strict();
export const fullProfileInput = z.object({
  ...filterInput.shape,
  gender: z.enum(["male", "female"]),
  firstName: z.string().trim().min(2).max(100), lastName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^\+?[\d ()-]{7,25}$/, "Укажите номер телефона"),
  dateOfBirth: dateOnly, city: z.string().trim().min(1).max(150),
  cityId: z.string().regex(/^\d{4}$/).nullable().optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
  spouseName: z.string().trim().max(150).nullable().optional(),
  hasChildren: z.boolean(), childrenData: z.array(childInput).max(20).optional(),
  giyurStage: z.enum(["advanced", "completed"]).nullable().optional(),
  source: z.string().trim().max(200).optional(), agreedToPrivacy: z.literal(true),
}).strict().superRefine((value, ctx) => {
  if (value.hasChildren && communityAccess({ ...value, filterVersion: FILTER_VERSION, filterCompletedAt: new Date(), isProfileComplete: true }).canManageChildren && !value.childrenData?.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["childrenData"], message: "Добавьте данные ребёнка или снимите отметку «Есть дети»" });
  if (!value.hasChildren && value.childrenData?.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["childrenData"], message: "Скрытый блок детей не отправляется при ответе «Нет»" });
  if (value.affiliation !== "giyur" && value.giyurStage) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["giyurStage"], message: "Уточнение этапа относится только к гиюру" });
  if (value.affiliation === "none") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "В этой ветке полная анкета не отправляется" });
  if (value.maritalStatus === "married" && !value.spouseName?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["spouseName"], message: "Укажите имя супруга или супруги" });
});
export type ProfileInput = z.infer<typeof fullProfileInput>;
export const registrationInput = z.object({
  family: z.record(z.boolean()).default({ self: true }),
  childIds: z.array(z.string().min(1).max(150)).max(20).optional(),
  extraAdults: z.number().int().min(0).max(20).default(0),
  // Every child must belong to the parent's profile, not an anonymous counter.
  extraKids: z.number().int().max(0).min(0).default(0),
}).strict();
