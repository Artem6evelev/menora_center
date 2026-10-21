import { publicEventTitle } from '@/lib/community/event-return';
export async function GET(request: Request) {
  const title = await publicEventTitle(new URL(request.url).searchParams.get('id') || '');
  return Response.json({ title }, { headers: { 'Cache-Control': 'no-store' } });
}
