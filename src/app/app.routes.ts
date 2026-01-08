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
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
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
      {
        path: 'item-group',
        loadComponent: () => import('./components/item-group/item-group.component').then(m => m.ItemGroupComponent)
      },
      {
        path: 'role',
        loadComponent: () => import('./components/role/role.component').then(m => m.RoleComponent)
      },
      {
        path: 'user',
        loadComponent: () => import('./components/user/user.component').then(m => m.UserComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./shared/components/menu/menu.component').then(m => m.MenuComponent)
      },
      // Order Entry (implemented)
      {
        path: 'order-entry',
        loadComponent: () => import('./components/order-entry/order-entry.component').then(m => m.OrderEntryComponent)
      },
      // Placeholder routes for pages not yet implemented
      {
        path: 'order-reminder',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'assistant-assignment',
        loadComponent: () => import('./components/assistant-assignment/assistant-assignment.component').then(m => m.AssistantAssignmentComponent)
      },
      {
        path: 'material-transfer',
        loadComponent: () => import('./components/material-transfer/material-transfer.component').then(m => m.MaterialTransferComponent)
      },
      {
        path: 'material-delivery',
        loadComponent: () => import('./components/material-delivery/material-delivery.component').then(m => m.MaterialDeliveryComponent)
      },
      {
        path: 'assistant-operations',
        loadComponent: () => import('./components/assistant-operations/assistant-operations.component').then(m => m.AssistantOperationsComponent)
      },
      {
        path: 'consumption-billing',
        loadComponent: () => import('./components/consumption-billing/consumption-billing.component').then(m => m.ConsumptionBillingComponent)
      },
      {
        path: 'payment-collection',
        loadComponent: () => import('./components/payment-collection/payment-collection.component').then(m => m.PaymentCollectionComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
