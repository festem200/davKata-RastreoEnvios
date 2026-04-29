export type UserRole = 'ADMIN' | 'OPERADOR';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BackendLoginResponse {
  accessToken: string;
  expiresIn: string;
  user: {
    id: number;
    name?: string;
    email?: string;
    role: UserRole;
  };
}
