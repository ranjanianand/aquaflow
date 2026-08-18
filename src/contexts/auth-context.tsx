'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { setAuthToken, signIn, signUp, fetchMe, ApiError } from '@/lib/api/client';

/**
 * The signed-in session.
 *
 * Credentials are checked by the API, which delegates to the identity
 * provider; what comes back is a token this app stores and sends. Two things
 * follow from that and both matter:
 *
 *   * The role here is for rendering only. It arrives from /auth/me, which
 *     reads it from the database — but the API enforces it again on every
 *     request, so a tampered value in this browser changes what is drawn and
 *     nothing about what is permitted.
 *
 *   * A token can be rejected while the app is open — expired, or the account
 *     deactivated. Any 401 from any call ends the session rather than leaving
 *     a screen that quietly fails to load.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  /** Plants this account may see. Empty means all of them. */
  plants: string[];
  allPlants: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];
const TOKEN_KEY = 'aquaflow_token';

/** Trailing slashes are on (static export), so '/login' never matches. */
const isPublic = (pathname: string | null) => {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  return PUBLIC_PATHS.some((allowed) => p === allowed || p.startsWith(allowed + '/'));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Restore a session on load. The token is only trusted as far as /auth/me
  // accepting it — a stored token that has expired must not leave the app
  // looking signed in.
  useEffect(() => {
    let live = true;
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY) : null;

    if (!stored) {
      setIsLoading(false);
      return;
    }

    setAuthToken(stored);
    fetchMe()
      .then((me) => { if (live) setUser(me); })
      .catch(() => {
        if (!live) return;
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => { if (live) setIsLoading(false); });

    return () => { live = false; };
  }, []);

  // A 401 from anywhere means this session is over. Registered once, so a
  // component does not have to remember to handle it.
  useEffect(() => {
    const onUnauthorised = () => {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      if (!isPublic(pathname)) router.replace('/login');
    };
    window.addEventListener('aquaflow:unauthorised', onUnauthorised);
    return () => window.removeEventListener('aquaflow:unauthorised', onUnauthorised);
  }, [pathname, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic(pathname)) router.replace('/login');
    if (user && isPublic(pathname)) router.replace('/dashboard-v2');
  }, [user, isLoading, pathname, router]);

  /** Returns null on success, or a message to show. */
  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const { token } = await signIn(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      // Sign-in proves who they are; /auth/me says what they may do. An
      // account with no grant authenticates and then gets 403 here, which is
      // the correct and non-obvious case.
      const me = await fetchMe();
      setUser(me);
      return null;
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      const err = e as ApiError;
      if (err.status === 403) {
        return 'This account has not been granted access yet. An administrator needs to approve it.';
      }
      return err.message || 'Could not sign in';
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await signUp(email, password, name);
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setAuthToken(res.token);
        setUser(await fetchMe());
        return null;
      }
      return 'Account created. Check your email to confirm it, then sign in.';
    } catch (e) {
      return (e as ApiError).message || 'Could not create the account';
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
