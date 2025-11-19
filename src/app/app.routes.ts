import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home.component';
import { SalesComponent } from './features/sales/sales.component';
import { ProductsComponent } from './features/products/products.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  ...authRoutes,
  {
    path: 'home',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
    ],
  },
  {
    path: 'sales',
    component: MainLayoutComponent,
    children: [
      { path: '', component: SalesComponent },
    ],
  },
  {
    path: 'products',
    component: MainLayoutComponent,
    children: [
      { path: '', component: ProductsComponent },
    ],
  }
];