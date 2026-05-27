import { AuthUser, LoginInput, RegisterInput, UpdateProfileInput } from './entities';

export interface AuthStateChangeSubscription {
  unsubscribe: () => void;
}

export interface RegisterResult {
  user: AuthUser | null;
  requiresEmailConfirmation: boolean;
}

export interface AuthRepository {
  getCurrentUser: () => Promise<AuthUser | null>;
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => AuthStateChangeSubscription;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}
