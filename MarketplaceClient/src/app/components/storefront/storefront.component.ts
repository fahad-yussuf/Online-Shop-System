import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signal-r';
import { Router } from '@angular/router';
import { CartSidebarComponent } from '../cart-sidebar.component/cart-sidebar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, CartSidebarComponent],
  template: `
    <div class="layout">
      <div class="main">
        <div class="header">
          <h2>Marketplace</h2>
          <div class="header-actions">
            <button (click)="goToOrders()">My Orders</button>
            <button (click)="logout()" class="logout">Logout</button>
          </div>
        </div>
        <p *ngIf="loading">Loading...</p>
        <div class="grid" *ngIf="!loading && products.length > 0">
          <div *ngFor="let p of products" class="card">
            <div class="card-body">
              <span class="category">{{ p.category }}</span>
              <h3>{{ p.name }}</h3>
              <p class="desc">{{ p.description }}</p>
              <div class="attrs" *ngIf="hasAttributes(p)">
                <span *ngFor="let attr of getAttributes(p)" class="attr-badge">
                  {{ attr.key }}: {{ attr.value }}
                </span>
              </div>
              <div class="footer">
                <span class="price">$ {{ p.price }}</span>
                <div class="right">
                  <span [class]="'stock ' + getStockClass(p.quantity!)">
                    {{ p.quantity! > 0 ? p.quantity + ' left' : 'Out of stock' }}
                  </span>
                  <button
                    (click)="addToCart(p)"
                    [disabled]="p.quantity === 0">
                    {{ p.quantity! > 0 ? 'Add to cart' : 'Unavailable' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p *ngIf="!loading && products.length === 0">No products available yet.</p>
      </div>
      <app-cart-sidebar></app-cart-sidebar>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main { flex: 1; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-actions { display: flex; gap: 8px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .card { border: 1px solid #eee; border-radius: 8px; }
    .card-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .category { font-size: 11px; text-transform: uppercase; color: #888; font-weight: 500; }
    h3 { margin: 0; font-size: 16px; }
    .desc { margin: 0; font-size: 13px; color: #555; }
    .attrs { display: flex; flex-wrap: wrap; gap: 6px; }
    .attr-badge { font-size: 11px; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
    .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .price { font-size: 18px; font-weight: 600; }
    .right { display: flex; align-items: center; gap: 8px; }
    .stock { font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 500; }
    .stock.ok { background: #d1fae5; color: #065f46; }
    .stock.low { background: #fef3c7; color: #92400e; }
    .stock.out { background: #fee2e2; color: #991b1b; }
    button { padding: 8px 14px; border: none; border-radius: 4px; cursor: pointer; background: #333; color: white; font-size: 13px; }
    button.logout { background: #718096; }
    button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class StorefrontComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = true;
  private stockSub!: Subscription;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService,
    private signalR: SignalRService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.productService.getAll().subscribe({
      next: p => {
        this.products = p;
        this.loading = false;
        this.cdr.detectChanges();
        // Start SignalR and watch all products after they load
        this.initSignalR();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private async initSignalR() {
    try {
      await this.signalR.startConnection();

      // Subscribe each product to its group
      for (const product of this.products) {
        if (product.id) await this.signalR.watchProduct(product.id);
      }

      // Listen for stock updates and patch the affected product in place
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

  async ngOnDestroy() {
    this.stockSub?.unsubscribe();
    await this.signalR.stopConnection();
  }

  getStockClass(quantity: number): string {
    if (quantity > 5) return 'ok';
    if (quantity > 0) return 'low';
    return 'out';
  }

  addToCart(product: Product) {
    this.cartService.addItem(product.id!, 1).subscribe({
      next: () => {},
      error: (err) => console.error('Add to cart failed:', err)
    });
  }

  hasAttributes(p: Product) { return Object.keys(p.attributes || {}).length > 0; }
  getAttributes(p: Product) {
    return Object.entries(p.attributes || {}).map(([key, value]) => ({ key, value }));
  }
  goToOrders() { this.router.navigate(['/orders']); }
  logout() { this.auth.logout(); }
}