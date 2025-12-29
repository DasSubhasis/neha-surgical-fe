import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'doctor',
        loadComponent: () => import('./components/doctor/doctor.component').then(m => m.DoctorComponent)
      },
      {
        path: 'item',
        loadComponent: () => import('./components/item/item.component').then(m => m.ItemComponent)
      },
      {
        path: 'hospital',
        loadComponent: () => import('./components/hospital/hospital.component').then(m => m.HospitalComponent)
      },
      {
        path: 'brand',
        loadComponent: () => import('./components/brand/brand.component').then(m => m.BrandComponent)
      },
      {
        path: 'specification',
        loadComponent: () => import('./components/specification/specification.component').then(m => m.SpecificationComponent)
      },
      {
        path: 'size',
        loadComponent: () => import('./components/size/size.component').then(m => m.SizeComponent)
      },
      {
        path: 'category',
        loadComponent: () => import('./components/category/category.component').then(m => m.CategoryComponent)
      },
      // Placeholder routes for pages not yet implemented
      {
        path: 'user',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'order-entry',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'order-reminder',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'assistant-assignment',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'material-transfer',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'assistant-operations',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'consumption-billing',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'payment-collection',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
