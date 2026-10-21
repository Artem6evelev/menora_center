'use client';
import { createContext, useCallback, useContext, useRef } from 'react';
type Prepare = () => Promise<string>;
const Context = createContext<{ register: (prepare: Prepare | null) => void; prepare: () => Promise<string | undefined> }>({ register() {}, prepare: async () => undefined });
export function AttemptProvider({ children }: { children: React.ReactNode }) {
  const callback = useRef<Prepare | null>(null);
  const register = useCallback((prepare: Prepare | null) => { callback.current = prepare; }, []);
  const prepare = useCallback(async () => callback.current?.(), []);
  return <Context.Provider value={{ register, prepare }}>{children}</Context.Provider>;
}
export const useAttempt = () => useContext(Context);
