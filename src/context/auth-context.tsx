import { User } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/src/lib/supabase";
import { AuthUser, LoginInput, RegisterInput } from "@/src/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    username:
      typeof user.user_metadata?.username === "string"
        ? user.user_metadata.username
        : (user.email?.split("@")[0] ?? "Utilisateur"),
    email: user.email ?? "",
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) {
          return;
        }

        if (error || !data.user) {
          setUser(null);
        } else {
          setUser(toAuthUser(data.user));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
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
      login: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          setUser(toAuthUser(data.user));
        }
      },
      register: async ({ username, email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.session) {
          throw new Error(
            "Compte créé. Confirmez votre email avant de vous connecter.",
          );
        }

        if (data.user) {
          setUser(toAuthUser(data.user));
        }
      },
      logout: async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw new Error(error.message);
        }

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
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
