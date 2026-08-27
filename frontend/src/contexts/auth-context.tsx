'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { api, ApiError } from '@/lib/api';
import { clearTokens, getRefreshToken, setTokens } from '@/lib/token-store';

type AuthUser = { id: string; address: string; role: 'USER' | 'ADMIN' };

type AuthContextType = {
  /** Wallet is connected via RainbowKit, independent of whether we've signed in with the backend yet. */
  isConnected: boolean;
  address: string | null;
  /** True once the backend has verified a signature for the connected address. */
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  /** True while restoring a session on load, or while a sign-in request is in flight. */
  isLoading: boolean;
  signInError: string | null;
  /** Prompts the wallet to sign the backend's nonce message and establishes a session. */
  signIn: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Restore a session from a stored refresh token on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getRefreshToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // If the wallet disconnects, or switches to a different address than the
  // signed-in session, the backend session is no longer valid for what's
  // connected — drop it rather than silently keep acting as the old address.
  useEffect(() => {
    if (!user) return;
    if (!isConnected || address?.toLowerCase() !== user.address.toLowerCase()) {
      setUser(null);
      clearTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const signIn = useCallback(async () => {
    if (!address) return;
    setSignInError(null);
    setIsLoading(true);
    try {
      const { message } = await api.requestNonce(address);
      const signature = await signMessageAsync({ message });
      const result = await api.verifySignature(address, message, signature);
      setTokens(result);
      setUser(result.user);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not verify that signature — please try again.';
      setSignInError(message);
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(() => {
    api.logout().catch(() => {
      // Best-effort — the access token likely already expired if this fails.
    });
    clearTokens();
    setUser(null);
    disconnect();
  }, [disconnect]);

  const value = useMemo<AuthContextType>(
    () => ({
      isConnected,
      address: address ?? null,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      user,
      isLoading,
      signInError,
      signIn,
      logout,
    }),
    [isConnected, address, user, isLoading, signInError, signIn, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
