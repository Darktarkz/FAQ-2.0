import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuthResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    modulos?: UserModule[];
    permitted_modulos?: number[];
  };
  token: string;
}

export interface UserModule {
  id: number;
  nombre: string;
  descripcion?: string;
  idpadre?: number | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  modulos?: UserModule[];
  permitted_modulos?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.userSubject.next(response.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    }).pipe(
      tap(() => {
        this.limpiarSesion();
      })
    );
  }

  logoutLocal(): void {
    this.limpiarSesion();
  }

  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.userSubject.value?.is_admin ?? false;
  }

  hasModulePermissions(): boolean {
    return (this.userSubject.value?.permitted_modulos?.length ?? 0) > 0;
  }

  getAllowedModuleIds(): number[] {
    return this.userSubject.value?.permitted_modulos ?? [];
  }

  refreshUser(): Observable<any> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    }).pipe(
      tap(response => {
        localStorage.setItem('user', JSON.stringify(response.user));
        this.userSubject.next(response.user);
      })
    );
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
