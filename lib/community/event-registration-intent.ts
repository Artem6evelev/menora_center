import { eventReturnTo } from "./policy";
const prefix = "menora:continue-event-registration:";
/** A tab-local navigation hint, never an identity or admission credential. */
export function rememberEventRegistration(target: unknown) {
  const path = eventReturnTo(target);
  if (!path.startsWith("/events/")) return;
  try {
    sessionStorage.setItem(prefix + path, "1");
  } catch {
    /* Login still works without browser storage. */
  }
}
export function takeEventRegistration(target: unknown) {
  const path = eventReturnTo(target);
  try {
    const pending = sessionStorage.getItem(prefix + path) === "1";
    sessionStorage.removeItem(prefix + path);
    return pending;
  } catch {
    return false;
  }
}
export function clearEventRegistration(target: unknown) {
  try {
    sessionStorage.removeItem(prefix + eventReturnTo(target));
  } catch {
    /* Optional navigation hint. */
  }
}
