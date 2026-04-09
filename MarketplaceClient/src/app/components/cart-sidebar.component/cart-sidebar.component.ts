import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, Cart } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar">
      <h3>Your Cart</h3>
      <div *ngIf="cart.items.length === 0" class="empty">Cart is empty</div>
      <div *ngFor="let item of cart.items" class="item">
        <div class="item-name">{{ item.productName }}</div>
        <div class="item-meta">
          {{ item.quantity }} × $ {{ item.unitPrice }}
          <button (click)="remove(item.productId)" class="remove">✕</button>
        </div>
      </div>
      <div *ngIf="cart.items.length > 0" class="footer">
        <div class="total">Total: $ {{ getTotal() }}</div>
        <button (click)="checkout()" class="checkout" [disabled]="placing">
          {{ placing ? 'Placing...' : 'Place Order' }}
        </button>
      </div>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="success" class="success">Order placed!</p>
    </div>
  `,
  styles: [`
    .sidebar { padding: 20px; border-left: 1px solid #eee; min-width: 260px; }
    h3 { margin: 0 0 16px; font-size: 16px; }
    .empty { font-size: 13px; color: #888; }
    .item { margin-bottom: 12px; }
    .item-name { font-size: 14px; font-weight: 500; }
    .item-meta { font-size: 13px; color: #555; display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
    .remove { background: none; border: none; color: #e53e3e; cursor: pointer; font-size: 14px; padding: 0; }
    .footer { margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; }
    .total { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
    .checkout { width: 100%; padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .checkout:disabled { background: #999; cursor: not-allowed; }
    .error { color: #e53e3e; font-size: 13px; margin-top: 8px; }
    .success { color: #38a169; font-size: 13px; margin-top: 8px; }
  `]
})
export class CartSidebarComponent implements OnInit {
  cart: Cart = { buyerId: 0, items: [], updatedAt: '' };
  placing = false;
  error = '';
  success = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.detectChanges();
    });
    this.cartService.loadCart().subscribe();
  }

  getTotal() { return this.cartService.getTotal(); }

  remove(productId: string) {
    this.cartService.removeItem(productId).subscribe();
  }

  checkout() {
    this.placing = true;
    this.error = '';
    this.success = false;
    this.orderService.placeOrder().subscribe({
      next: () => {
        this.placing = false;
        this.success = true;
        this.cartService.loadCart().subscribe();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.placing = false;
        this.error = err.error?.message || 'Order failed';
        this.cdr.detectChanges();
      }
    });
  }
}