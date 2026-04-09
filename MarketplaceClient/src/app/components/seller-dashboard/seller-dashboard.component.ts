import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signal-r';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="alert" *ngIf="lowStockAlerts.length > 0">
        <strong>Low stock alerts:</strong>
        <span *ngFor="let alert of lowStockAlerts" class="alert-item">
          {{ alert.productName }} — {{ alert.quantity }} left
        </span>
        <button (click)="dismissAlerts()" class="dismiss">Dismiss</button>
      </div>
      <div class="header">
        <h2>My Products</h2>
        <div>
          <button (click)="goToOrders()">
            View Orders
            <span *ngIf="newOrderCount > 0" class="badge">{{ newOrderCount }}</span>
          </button>
          <button (click)="goToAdd()">+ Add Product</button>
          <button (click)="logout()" class="logout">Logout</button>
        </div>
      </div>
      <p *ngIf="loading">Loading...</p>
      <table *ngIf="!loading && products.length > 0">
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products">
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td>{{ p.price }}</td>
            <td>
              <span [class]="'stock-badge ' + getStockClass(p.quantity!)">
                {{ p.quantity }} left
              </span>
            </td>
            <td>
              <button (click)="edit(p)">Edit</button>
              <button (click)="delete(p.id!)" class="danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p *ngIf="!loading && products.length === 0">No products yet. Add your first one!</p>
    </div>
  `,
  styles: [`
    .dashboard { padding: 32px; max-width: 900px; margin: 0 auto; }
    .alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .alert-item { background: #fff; padding: 2px 8px; border-radius: 4px; font-size: 13px; }
    .dismiss { margin-left: auto; background: none; border: 1px solid #f59e0b; color: #92400e; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .badge { background: #e53e3e; color: white; border-radius: 10px; padding: 1px 7px; font-size: 11px; margin-left: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 500; }
    button { padding: 6px 14px; margin-right: 8px; border: none; border-radius: 4px; cursor: pointer; background: #333; color: white; }
    button.danger { background: #e53e3e; }
    button.logout { background: #718096; }
    .stock-badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .ok { background: #d1fae5; color: #065f46; }
    .low { background: #fef3c7; color: #92400e; }
    .out { background: #fee2e2; color: #991b1b; }
  `]
})
export class SellerDashboardComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = true;
  lowStockAlerts: { productName: string; quantity: number }[] = [];
  newOrderCount = 0;
  private routerSub!: Subscription;
  private lowStockSub!: Subscription;
  private newOrderSub!: Subscription;
  private stockSub!: Subscription;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private signalR: SignalRService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.loadProducts();

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd && e.urlAfterRedirects === '/seller')
    ).subscribe(() => { this.newOrderCount = 0; this.loadProducts(); });

    await this.initSignalR();
  }

  private async initSignalR() {
    try {
      await this.signalR.startConnection();

      const sellerId = this.auth.getSellerId();
      if (sellerId) await this.signalR.joinSellerGroup(sellerId);

      // Listen for low stock alerts
      this.lowStockSub = this.signalR.lowStockAlert$.subscribe(alert => {
        const alreadyAlerted = this.lowStockAlerts
          .some(a => a.productName === alert.productName);
        if (!alreadyAlerted) {
          this.lowStockAlerts.push({
            productName: alert.productName,
            quantity: alert.quantity
          });
          this.cdr.detectChanges();
        }
      });

      // Listen for new orders — increment badge counter
      this.newOrderSub = this.signalR.newOrder$.subscribe(() => {
        this.newOrderCount++;
        this.cdr.detectChanges();
      });

      // Listen for stock updates and update product rows live
      this.stockSub = this.signalR.stockUpdated$.subscribe(update => {
        const product = this.products.find(p => p.id === update.productId);
        if (product) {
          product.quantity = update.newQuantity;
          this.cdr.detectChanges();
        }
      });

    } catch (err) {
      console.error('SignalR connection failed:', err);
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.lowStockSub?.unsubscribe();
    this.newOrderSub?.unsubscribe();
    this.stockSub?.unsubscribe();
    this.signalR.stopConnection();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getMine().subscribe({
      next: p => { this.products = p; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getStockClass(quantity: number): string {
    if (quantity > 5) return 'ok';
    if (quantity <= 5 && quantity > 0) return 'low';
    return 'out';
  }

  dismissAlerts() { this.lowStockAlerts = []; }
  goToAdd() { this.router.navigate(['/seller/product/new']); }
  goToOrders() { this.newOrderCount = 0; this.router.navigate(['/seller/orders']); }
  edit(product: Product) { this.router.navigate(['/seller/product', product.id]); }

  delete(id: string) {
    if (confirm('Delete this product?')) {
      this.productService.delete(id).subscribe(() => {
        this.products = this.products.filter(p => p.id !== id);
        this.cdr.detectChanges();
      });
    }
  }

  logout() { this.auth.logout(); }
}