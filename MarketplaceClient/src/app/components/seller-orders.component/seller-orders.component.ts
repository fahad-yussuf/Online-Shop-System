import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orders">
      <div class="header">
        <h2>Incoming Orders</h2>
        <button (click)="goBack()">Back to Dashboard</button>
      </div>
      <p *ngIf="loading">Loading...</p>
      <div *ngIf="!loading && orders.length === 0">No orders yet.</div>
      <div *ngFor="let order of orders" class="order-card">
        <div class="order-header">
          <span>Order #{{ order.id }}</span>
          <span [class]="'status ' + order.status.toLowerCase()">{{ order.status }}</span>
          <span class="date">{{ order.createdAt | date:'medium' }}</span>
        </div>
        <div *ngFor="let item of order.items" class="order-item">
          {{ item.productName }} × {{ item.quantity }}
        </div>
        <div class="actions">
          <button
            *ngIf="order.status === 'Pending'"
            (click)="advance(order, 1)">
            Mark Paid
          </button>
          <button
            *ngIf="order.status === 'Paid'"
            (click)="advance(order, 2)">
            Mark Fulfilled
          </button>
          <button
            *ngIf="order.status === 'Pending' || order.status === 'Paid'"
            (click)="advance(order, 3)"
            class="danger">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders { padding: 32px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .order-card { border: 1px solid #eee; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .order-header { display: flex; gap: 16px; align-items: center; margin-bottom: 12px; font-weight: 500; }
    .order-item { font-size: 13px; color: #555; padding: 4px 0; }
    .status { padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.paid { background: #dbeafe; color: #1e40af; }
    .status.fulfilled { background: #d1fae5; color: #065f46; }
    .status.cancelled { background: #fee2e2; color: #991b1b; }
    .date { font-size: 12px; color: #888; font-weight: 400; }
    .actions { display: flex; gap: 8px; margin-top: 12px; }
    button { padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer; background: #333; color: white; }
    button.danger { background: #e53e3e; }
  `]
})
export class SellerOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.orderService.getSellerOrders().subscribe({
      next: o => { this.orders = o; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  advance(order: Order, newStatus: number) {
    this.orderService.advanceStatus(order.id, newStatus).subscribe({
      next: updated => {
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index > -1) this.orders[index] = updated;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() { this.router.navigate(['/seller']); }
}