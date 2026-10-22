"use client";
import { miniAppRequest } from "./miniapp-client";
/** One factory per mounted MiniApp, never module/global/browser storage. */
export function createMiniAppCache(ttl = 30_000) {
  let generation = 0;
  const values = new Map<string, { expires: number; data: unknown }>();
  const pending = new Map<string, { promise: Promise<unknown>; controller: AbortController }>();
  const cancelPending = () => { for (const row of pending.values()) row.controller.abort(); pending.clear(); };
  // Kids includes a canonical editable snapshot: deduplicate concurrent readers,
  // but always refresh it when re-entering the screen.
  const lifetime = (key: string) => key === "kids" ? 0 : ttl;
  return {
    clear() { generation++; values.clear(); cancelPending(); },
    invalidate(...prefixes: string[]) {
      generation++;
      for (const key of values.keys()) if (prefixes.some(p => key.startsWith(p))) values.delete(key);
      // In-flight responses from before a mutation never repopulate the cache.
      cancelPending();
    },
    peek<T>(key: string): T | undefined { const row=values.get(key); return row && row.expires>Date.now()?row.data as T:undefined; },
    seed(key: string, data: unknown) { values.set(key,{expires:Date.now()+lifetime(key),data}); },
    async read<T>(key: string, signal?: AbortSignal): Promise<T> {
      const readGeneration=generation;
      const row=values.get(key);
      if (signal?.aborted) throw new DOMException("Aborted","AbortError");
      if(row&&row.expires>Date.now())return row.data as T;
      let request=pending.get(key)?.promise as Promise<T> | undefined;
      if(!request){
        const version=generation;
        const controller = new AbortController();
        request=miniAppRequest<T>(key,{signal:controller.signal}).then(({data})=>{if(version===generation)values.set(key,{expires:Date.now()+lifetime(key),data});return data;});
        pending.set(key,{promise:request,controller});
        const owned=request;
        void request.finally(()=>{if(pending.get(key)?.promise===owned)pending.delete(key);}).catch(()=>{});
      }
      const data=await request;
      if(signal?.aborted || generation!==readGeneration)throw new DOMException("Aborted","AbortError");
      return data;
    },
  };
}
export type MiniAppCache = ReturnType<typeof createMiniAppCache>;
