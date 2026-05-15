import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

import { AuthUser, LoginInput, RegisterInput } from "@/src/types/auth";

interface StoredUser extends AuthUser {
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const initialUsers: StoredUser[] = [
  {
    id: "demo-user",
    username: "Demo",
    email: "demo@entreami.be",
    password: "demo1234",
  },
];

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<StoredUser[]>(initialUsers);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async ({ email, password }) => {
        const foundUser = users.find(
          (currentUser) =>
            currentUser.email.toLowerCase() === email.trim().toLowerCase() &&
            currentUser.password === password,
        );

        if (!foundUser) {
          throw new Error("Email ou mot de passe incorrect.");
        }

        setUser(toAuthUser(foundUser));
      },
      register: async ({ username, email, password }) => {
        const cleanEmail = email.trim().toLowerCase();
        const existingUser = users.find(
          (currentUser) => currentUser.email === cleanEmail,
        );

        if (existingUser) {
          throw new Error("Un compte existe déjà avec cet email.");
        }

        const newUser: StoredUser = {
          id: String(Date.now()),
          username: username.trim(),
          email: cleanEmail,
          password,
        };

        setUsers((currentUsers) => [...currentUsers, newUser]);
        setUser(toAuthUser(newUser));
      },
      logout: () => {
        setUser(null);
      },
    }),
    [user, users],
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
