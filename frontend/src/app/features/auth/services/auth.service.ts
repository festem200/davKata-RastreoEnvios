import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

import { API_URL } from '../../../core/services/api-url';
import {
  BackendLoginResponse,
  LoginRequest,
  LoginResponse,
  User
} from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly router = inject(Router);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<BackendLoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map((response) => this.normalizeLoginResponse(response, credentials.email)),
        tap((response) => this.persistSession(response))
      );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  getUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  private normalizeLoginResponse(
    response: BackendLoginResponse,
    emailFromRequest: string
  ): LoginResponse {
    const user: User = {
      id: response.user.id,
      name: response.user.name ?? this.buildNameFromEmail(response.user.email ?? emailFromRequest),
      email: response.user.email ?? emailFromRequest,
      role: response.user.role
    };

    return {
      accessToken: response.accessToken,
      expiresIn: response.expiresIn,
      user
    };
  }

  private buildNameFromEmail(email: string): string {
    const [name] = email.split('@');
    return name ? name.replace(/[._-]/g, ' ') : 'Usuario';
  }
}
