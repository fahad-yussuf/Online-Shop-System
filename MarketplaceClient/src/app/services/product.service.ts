import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  attributes: { [key: string]: string };
  sellerId?: number;
  sellerName?: string;
  quantity?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = 'http://localhost:5165/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/with-stock`);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  getMine(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/my/with-stock`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.base, product);
  }

  update(id: string, product: Product): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  updateStock(productId: string, quantity: number): Observable<any> {
    return this.http.patch(`${this.base}/${productId}/stock`, { quantity });
  }
}