import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { createAuthUseCases } from '@/src/application/auth/auth-use-cases';
import { AuthUser, LoginInput, RegisterInput, UpdateProfileInput } from '@/src/domain/auth/entities';
import { supabaseAuthRepository } from '@/src/infrastructure/auth/supabase-auth-repository';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<{ requiresEmailConfirmation: boolean }>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const authUseCases = createAuthUseCases(supabaseAuthRepository);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    authUseCases
      .getCurrentUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const subscription = authUseCases.onAuthStateChange((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (input) => {
        setUser(await authUseCases.login(input));
      },
      register: async (input) => {
        const result = await authUseCases.register(input);

        if (result.user) {
          setUser(result.user);
        }

        return { requiresEmailConfirmation: result.requiresEmailConfirmation };
      },
      updateProfile: async (input) => {
        setUser(await authUseCases.updateProfile(input));
      },
      logout: async () => {
        await authUseCases.logout();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
