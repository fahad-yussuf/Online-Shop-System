import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUser, AdminStats } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin">
      <div class="header">
        <h2>Admin Dashboard</h2>
        <button (click)="logout()" class="logout">Logout</button>
      </div>

      <!-- Stats cards -->
      <div class="stats" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-num">{{ stats.totalUsers }}</div>
          <div class="stat-label">Total users</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">{{ stats.totalProducts }}</div>
          <div class="stat-label">Products</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">{{ stats.totalOrders }}</div>
          <div class="stat-label">Total orders</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-num">{{ stats.pendingOrders }}</div>
          <div class="stat-label">Pending orders</div>
        </div>
        <div class="stat-card fulfilled">
          <div class="stat-num">{{ stats.fulfilledOrders }}</div>
          <div class="stat-label">Fulfilled orders</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button [class.active]="activeTab === 'users'" (click)="activeTab = 'users'">Users</button>
        <button [class.active]="activeTab === 'orders'" (click)="activeTab = 'orders'; loadOrders()">Orders</button>
      </div>

      <!-- Users tab -->
      <div *ngIf="activeTab === 'users'">
        <p *ngIf="loadingUsers">Loading...</p>
        <table *ngIf="!loadingUsers && users.length > 0">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td><span class="role-badge">{{ u.role }}</span></td>
              <td>
                <span [class]="'status-badge ' + (u.isActive ? 'active' : 'inactive')">
                  {{ u.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button
                  *ngIf="u.isActive"
                  (click)="deactivate(u)"
                  class="danger">
                  Deactivate
                </button>
                <button
                  *ngIf="!u.isActive"
                  (click)="activate(u)">
                  Activate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Orders tab -->
      <div *ngIf="activeTab === 'orders'">
        <div class="filter-row">
          <select [(ngModel)]="orderFilter" (change)="loadOrders()">
            <option value="">All orders</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <p *ngIf="loadingOrders">Loading...</p>
        <table *ngIf="!loadingOrders && orders.length > 0">
          <thead>
            <tr><th>Order ID</th><th>Buyer ID</th><th>Status</th><th>Date</th><th>Items</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td>#{{ o.id }}</td>
              <td>{{ o.buyerId }}</td>
              <td><span [class]="'status-badge ' + o.status.toLowerCase()">{{ o.status }}</span></td>
              <td>{{ o.createdAt | date:'shortDate' }}</td>
              <td>{{ o.items.length }} item(s)</td>
              <td>
                <button
                  *ngIf="o.status !== 'Cancelled' && o.status !== 'Fulfilled'"
                  (click)="cancelOrder(o)"
                  class="danger">
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loadingOrders && orders.length === 0">No orders found.</p>
      </div>
    </div>
  `,
  styles: [`
    .admin { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { border: 1px solid #eee; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-card.pending { border-color: #f59e0b; background: #fffbeb; }
    .stat-card.fulfilled { border-color: #10b981; background: #f0fdf4; }
    .stat-num { font-size: 32px; font-weight: 600; color: #111; }
    .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
    .tabs button { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; background: #f5f5f5; color: #555; }
    .tabs button.active { background: #333; color: white; }
    .filter-row { margin-bottom: 16px; }
    select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
    th { background: #f5f5f5; font-weight: 500; }
    button { padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; background: #333; color: white; font-size: 12px; }
    button.danger { background: #e53e3e; }
    button.logout { background: #718096; padding: 8px 16px; font-size: 14px; }
    .role-badge { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .status-badge.active { background: #d1fae5; color: #065f46; }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.paid { background: #dbeafe; color: #1e40af; }
    .status-badge.fulfilled { background: #d1fae5; color: #065f46; }
    .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  users: AdminUser[] = [];
  orders: any[] = [];
  activeTab = 'users';
  orderFilter = '';
  loadingUsers = true;
  loadingOrders = false;

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
  }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: s => { this.stats = s; this.cdr.detectChanges(); }
    });
  }

  loadUsers() {
    this.loadingUsers = true;
    this.adminService.getUsers().subscribe({
      next: u => { this.users = u; this.loadingUsers = false; this.cdr.detectChanges(); }
    });
  }

  loadOrders() {
    this.loadingOrders = true;
    this.adminService.getOrders(this.orderFilter || undefined).subscribe({
      next: o => { this.orders = o; this.loadingOrders = false; this.cdr.detectChanges(); },
      error: () => { this.loadingOrders = false; this.cdr.detectChanges(); }
    });
  }

  deactivate(user: AdminUser) {
    if (confirm(`Deactivate ${user.email}?`)) {
      this.adminService.deactivateUser(user.id).subscribe({
        next: () => { user.isActive = false; this.cdr.detectChanges(); }
      });
    }
  }

  activate(user: AdminUser) {
    this.adminService.activateUser(user.id).subscribe({
      next: () => { user.isActive = true; this.cdr.detectChanges(); }
    });
  }

  cancelOrder(order: any) {
    if (confirm(`Cancel order #${order.id}?`)) {
      this.adminService.cancelOrder(order.id).subscribe({
        next: () => { order.status = 'Cancelled'; this.cdr.detectChanges(); }
      });
    }
  }

  logout() { this.auth.logout(); }
}