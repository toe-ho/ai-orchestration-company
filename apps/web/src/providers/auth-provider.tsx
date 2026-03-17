import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api/auth-api.js';
import type { AuthUser } from '../lib/api/auth-api.js';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSession(): Promise<void> {
    try {
      const data = await authApi.getSession();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    try {
      await authApi.signOut();
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, signOut, refresh: loadSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
