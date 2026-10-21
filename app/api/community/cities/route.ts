import { searchLocalities } from '@/lib/community/cities';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') || '';
  if (q.length > 150) return Response.json({ error: 'Слишком длинный запрос' }, { status: 400 });
  return Response.json({ cities: searchLocalities(q) });
}
