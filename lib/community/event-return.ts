import 'server-only';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { eventReturnTo } from './policy';
export async function eventDestination(value: unknown, connection: any = db) {
  const target = eventReturnTo(value);
  if (target === '/dashboard/events') return target;
  const [event] = await connection.select({ id: events.id, status: events.status, closed: events.isRegistrationClosed }).from(events).where(eq(events.id, target.slice('/events/'.length)));
  return event?.status === 'planned' && !event.closed ? target : '/dashboard/events?notice=event-unavailable';
}
export async function publicEventTitle(id: string) {
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) return null;
  const [event] = await db.select({ title: events.title, status: events.status, closed: events.isRegistrationClosed }).from(events).where(eq(events.id, id));
  return event?.status === 'planned' && !event.closed ? event.title : null;
}
