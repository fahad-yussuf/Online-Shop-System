import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  fulfilledOrders: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = 'http://localhost:5165/api/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/users`);
  }

  deactivateUser(id: number): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/deactivate`, {});
  }

  activateUser(id: number): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/activate`, {});
  }

  getOrders(status?: string): Observable<any[]> {
    const url = status
      ? `${this.base}/orders?status=${status}`
      : `${this.base}/orders`;
    return this.http.get<any[]>(url);
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.patch(`${this.base}/orders/${id}/cancel`, {});
  }
}