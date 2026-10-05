import { Routes } from '@angular/router';

import { HomeComponent } from './features/home/home.component';
import { ProductsComponent } from './features/products/products.component';
import { ProductDetailsComponent } from './features/product-details/product-details.component';

import { LoginComponent } from './admin/login/login.component';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { AdminProductsComponent } from './admin/products/admin-products.component';
import { AddProductComponent } from './admin/add-product/add-product.component';
import { EditProductComponent } from './admin/edit-product/edit-product.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public Customer Routes
  { path: '', component: HomeComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailsComponent },
  { path: 'category/:category', component: ProductsComponent },

  // Admin Authentication Route
  { path: 'admin/login', component: LoginComponent },

  // Protected Admin Area (Admin Layout with Sidebar + Guard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [adminGuard] },
      { path: 'products', component: AdminProductsComponent, canActivate: [adminGuard] },
      { path: 'products/add', component: AddProductComponent, canActivate: [adminGuard] },
      { path: 'products/edit/:id', component: EditProductComponent, canActivate: [adminGuard] }
    ]
  },

  { path: '**', redirectTo: '' }
];
