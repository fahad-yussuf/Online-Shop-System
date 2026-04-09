import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Cart {
  buyerId: number;
  items: CartItem[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private base = 'http://localhost:5165/api/cart';
  private cartSubject = new BehaviorSubject<Cart>({ buyerId: 0, items: [], updatedAt: '' });
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadCart(): Observable<Cart> {
    return this.http.get<Cart>(this.base).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItem(productId: string, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.base}/add`, { productId, quantity }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeItem(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.base}/remove/${productId}`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  getItemCount(): number {
    return this.cartSubject.value.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTotal(): number {
    return this.cartSubject.value.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }
}