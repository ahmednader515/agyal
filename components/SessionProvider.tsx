"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/** Poll less often — still catches forced logout from another device without hammering the DB every 5s. */
const SESSION_REFETCH_INTERVAL = 30;

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      refetchInterval={SESSION_REFETCH_INTERVAL}
      refetchOnWindowFocus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
