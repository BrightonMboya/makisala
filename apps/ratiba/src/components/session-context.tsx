'use client';

import { createContext, useContext } from 'react';
import { authClient } from '@/lib/auth-client';

type SessionData = ReturnType<typeof authClient.useSession>['data'];

const SessionContext = createContext<{
  session: SessionData;
  isPending: boolean;
} | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  return (
    <SessionContext value={{ session, isPending }}>
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  // Fallback: if no provider exists (e.g. outside dashboard layout), call authClient directly
  const fallback = authClient.useSession();
  if (ctx) return ctx;
  return { session: fallback.data, isPending: fallback.isPending };
}
