import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  buyerId: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = 'http://localhost:5165/api/orders';

  constructor(private http: HttpClient) {}

  placeOrder(): Observable<Order> {
    return this.http.post<Order>(this.base, {});
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/my`);
  }

  getSellerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/seller`);
  }

  advanceStatus(orderId: number, newStatus: number): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/${orderId}/status`, { newStatus });
  }
}