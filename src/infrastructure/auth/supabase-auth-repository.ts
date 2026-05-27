import { User } from '@supabase/supabase-js';

import { AuthRepository } from '@/src/domain/auth/auth-repository';
import { AuthUser } from '@/src/domain/auth/entities';
import { supabase } from '@/src/lib/supabase';

function getAuthErrorMessage(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Confirmez votre email avant de vous connecter.';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  return message;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    username:
      typeof user.user_metadata?.username === 'string'
        ? user.user_metadata.username
        : (user.email?.split('@')[0] ?? 'Utilisateur'),
    email: user.email ?? '',
    bankAccount:
      typeof user.user_metadata?.bankAccount === 'string' ? user.user_metadata.bankAccount : '',
  };
}

export const supabaseAuthRepository: AuthRepository = {
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return toAuthUser(data.user);
  },
  onAuthStateChange: (callback) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? toAuthUser(session.user) : null);
    });

    return subscription;
  },
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(getAuthErrorMessage(error.message));
    }

    if (!data.user) {
      throw new Error('Connexion impossible.');
    }

    return toAuthUser(data.user);
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

    return {
      user: data.session && data.user ? toAuthUser(data.user) : null,
      requiresEmailConfirmation: !data.session,
    };
  },
  updateProfile: async ({ username, bankAccount }) => {
    const cleanUsername = username.trim();
    const cleanBankAccount = bankAccount.trim();

    if (!cleanUsername) {
      throw new Error('Le nom ne peut pas être vide.');
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        username: cleanUsername,
        bankAccount: cleanBankAccount,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Mise à jour impossible.');
    }

    return toAuthUser(data.user);
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },
};
