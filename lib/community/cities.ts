import records from './data/israel-localities.json';
export type Locality = { id: string; ru: string | null; he: string; en: string | null };
const localities: Locality[] = records;
const byId = new Map(localities.map(item => [item.id, item]));
export const cityLabel = (item: Locality) => item.ru || item.he;
export const localityById = (id: string) => byId.get(id);
const normalize = (text: string) => text.normalize('NFKD').toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]/gu, '');
// Search aliases only, never canonical names or automatic historical mappings.
const transliterate = (text: string) => text.toLowerCase().replace(/sh|ch|kh|ts|tz|zh|ya|yo|yu|[a-z]/g, value => ({sh:'ш',ch:'ч',kh:'х',ts:'ц',tz:'ц',zh:'ж',ya:'я',yo:'ё',yu:'ю',a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'дж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'в',x:'кс',y:'й',z:'з'}[value] || value));
export function searchLocalities(query: string, limit = 20) {
  const q = normalize(query);
  if (!q) return [];
  return localities.filter(item => [item.ru || '', item.he, item.en || '', transliterate(item.en || '')].some(value => normalize(value).includes(q))).slice(0, limit).map(item => ({ id: item.id, name: cityLabel(item), he: item.he, en: item.en }));
}
