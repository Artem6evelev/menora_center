"use server";
import { registerForEvent as register, getUserFamilyData as getFamily } from "./event";
export async function registerForEvent(eventId: string, userId: string, extraData: unknown) {
  return register(eventId, userId, undefined, extraData);
}
export async function getUserFamilyData(userId: string) { return getFamily(userId); }
