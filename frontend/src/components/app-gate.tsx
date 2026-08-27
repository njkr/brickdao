'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ConnectLanding } from './connect-landing';
import { PageShell } from './layout/page-shell';
import { SignInScreen } from './sign-in-screen';

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-void-950 flex items-center justify-center px-4">
      <p className="text-cream-400 text-sm">Loading…</p>
    </div>
  );
}

/** Gates the whole app behind: wallet connected -> wallet signed in -> normal app shell. */
export function AppGate({ children }: { children: ReactNode }) {
  const { isConnected, isAuthenticated, isLoading } = useAuth();

  if (!isConnected) return <ConnectLanding />;
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <SignInScreen />;

  return <PageShell>{children}</PageShell>;
}
