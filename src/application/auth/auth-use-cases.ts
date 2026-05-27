import { AuthRepository } from '@/src/domain/auth/auth-repository';
import { LoginInput, RegisterInput, UpdateProfileInput } from '@/src/domain/auth/entities';

export function createAuthUseCases(authRepository: AuthRepository) {
  return {
    getCurrentUser: () => authRepository.getCurrentUser(),
    onAuthStateChange: authRepository.onAuthStateChange,
    login: (input: LoginInput) => authRepository.login(input),
    register: (input: RegisterInput) => authRepository.register(input),
    updateProfile: (input: UpdateProfileInput) => authRepository.updateProfile(input),
    logout: () => authRepository.logout(),
  };
}
