import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="form-container">
      <h2>{{ isEdit ? 'Edit Product' : 'Add Product' }}</h2>
      <input [(ngModel)]="product.name" placeholder="Product name"/>
      <input [(ngModel)]="product.description" placeholder="Description"/>
      <input [(ngModel)]="product.price" placeholder="Price" type="number" min="0"/>
      <input [(ngModel)]="product.category" placeholder="Category"/>
      <input [(ngModel)]="stockQuantity" placeholder="Stock quantity" type="number" min="0"/>
      <div class="attributes">
        <h4>Custom Attributes</h4>
        <div *ngFor="let attr of attributeList; let i = index" class="attr-row">
          <input [(ngModel)]="attr.key" placeholder="Key (e.g. Size)"/>
          <input [(ngModel)]="attr.value" placeholder="Value (e.g. XL)"/>
          <button (click)="removeAttr(i)" class="danger">✕</button>
        </div>
        <button (click)="addAttr()" class="secondary">+ Add Attribute</button>
      </div>
      <div class="actions">
        <button (click)="save()">{{ isEdit ? 'Update' : 'Create' }}</button>
        <button (click)="cancel()" class="secondary">Cancel</button>
      </div>
      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .form-container { max-width: 500px; margin: 60px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px; display: flex; flex-direction: column; gap: 12px; }
    input { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #333; color: white; }
    button.danger { background: #e53e3e; }
    button.secondary { background: #718096; }
    .attr-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .actions { display: flex; gap: 8px; }
    .error { color: red; font-size: 13px; }
    h4 { margin: 0; font-size: 14px; }
  `]
})
export class ProductFormComponent implements OnInit {
  product: Product = { name: '', description: '', price: 0, category: '', attributes: {} };
  attributeList: { key: string; value: string }[] = [];
  stockQuantity = 0;
  isEdit = false;
  productId = '';
  error = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId && this.productId !== 'new') {
      this.isEdit = true;
      this.productService.getById(this.productId).subscribe(p => {
        this.product = p;
        this.stockQuantity = p.quantity ?? 0;
        this.attributeList = Object.entries(p.attributes || {})
          .map(([key, value]) => ({ key, value }));
      });
    }
  }

  addAttr() { this.attributeList.push({ key: '', value: '' }); }
  removeAttr(i: number) { this.attributeList.splice(i, 1); }

  save() {
    this.product.attributes = {};
    this.attributeList.forEach(a => {
      if (a.key) this.product.attributes[a.key] = a.value;
    });

    if (this.isEdit) {
      this.productService.update(this.productId, this.product).subscribe({
        next: () => {
          // Update stock separately then navigate
          this.productService.updateStock(this.productId, this.stockQuantity).subscribe({
            next: () => this.router.navigate(['/seller']),
            error: () => this.error = 'Product updated but stock update failed'
          });
        },
        error: () => this.error = 'Update failed'
      });
    } else {
      this.productService.create(this.product).subscribe({
        next: (created) => {
          // Set initial stock after product created
          this.productService.updateStock(created.id!, this.stockQuantity).subscribe({
            next: () => this.router.navigate(['/seller']),
            error: () => this.error = 'Product created but stock update failed'
          });
        },
        error: () => this.error = 'Create failed'
      });
    }
  }

  cancel() { this.router.navigate(['/seller']); }
}