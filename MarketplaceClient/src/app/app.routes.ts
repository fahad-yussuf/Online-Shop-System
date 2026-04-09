import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { SellerDashboardComponent } from './components/seller-dashboard/seller-dashboard.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { StorefrontComponent } from './components/storefront/storefront.component';
import { OrderHistoryComponent } from './components/order-history.component/order-history.component';
import { SellerOrdersComponent } from './components/seller-orders.component/seller-orders.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component/admin-dashboard.component';
import { authGuard, adminGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'store', component: StorefrontComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrderHistoryComponent, canActivate: [authGuard] },
  { path: 'seller', component: SellerDashboardComponent, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
  { path: 'seller/orders', component: SellerOrdersComponent, canActivate: [authGuard] },
  { path: 'seller/product/:id', component: ProductFormComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
];