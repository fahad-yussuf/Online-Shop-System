import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export type UserRole = 'Buyer' | 'Seller' | 'Admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:5165/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  register(email: string, password: string, name: string, role: number) {
    return this.http.post(`${this.base}/register`, { email, password, name, role });
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.base}/login`, { email, password })
      .pipe(tap(res => localStorage.setItem('token', res.token)));
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getToken() { return localStorage.getItem('token'); }
  isLoggedIn() { return !!this.getToken(); }

  getRole(): UserRole | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  }
  getSellerId(): string | null {
  const token = this.getToken();
  if (!token) return null;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
}
}