export interface AuthUser {
  id: string;
  username: string;
  email: string;
  bankAccount: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  username: string;
  bankAccount: string;
}
