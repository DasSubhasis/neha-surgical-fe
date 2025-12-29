import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface Role {
  id?: number;
  roleId?: number;
  name: string;
  description: string;
  status: string;
  isActive: string;
  createdAt?: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  status: string;
  isActive: string;
}

export interface ImportRow {
  index: number;
  row: {
    name: string;
    description: string;
  };
  isDuplicate: boolean;
  duplicateAgainst: (number | string)[];
  action: 'add' | 'merge' | 'skip';
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  // Available permissions for the system
  private availablePermissions: Permission[] = [
    // Dashboard
    { id: 1, code: 'DASHBOARD_VIEW', name: 'View Dashboard', module: 'Dashboard', description: 'Can view dashboard' },
    
    // User Management
    { id: 2, code: 'USER_VIEW', name: 'View Users', module: 'User Management', description: 'Can view users list' },
    { id: 3, code: 'USER_CREATE', name: 'Create Users', module: 'User Management', description: 'Can create new users' },
    { id: 4, code: 'USER_EDIT', name: 'Edit Users', module: 'User Management', description: 'Can edit users' },
    { id: 5, code: 'USER_DELETE', name: 'Delete Users', module: 'User Management', description: 'Can delete users' },
    
    // Role Management
    { id: 6, code: 'ROLE_VIEW', name: 'View Roles', module: 'Role Management', description: 'Can view roles list' },
    { id: 7, code: 'ROLE_CREATE', name: 'Create Roles', module: 'Role Management', description: 'Can create new roles' },
    { id: 8, code: 'ROLE_EDIT', name: 'Edit Roles', module: 'Role Management', description: 'Can edit roles' },
    { id: 9, code: 'ROLE_DELETE', name: 'Delete Roles', module: 'Role Management', description: 'Can delete roles' },
    
    // Master Data
    { id: 10, code: 'MASTER_VIEW', name: 'View Master Data', module: 'Master Data', description: 'Can view master data' },
    { id: 11, code: 'MASTER_CREATE', name: 'Create Master Data', module: 'Master Data', description: 'Can create master data' },
    { id: 12, code: 'MASTER_EDIT', name: 'Edit Master Data', module: 'Master Data', description: 'Can edit master data' },
    { id: 13, code: 'MASTER_DELETE', name: 'Delete Master Data', module: 'Master Data', description: 'Can delete master data' },
    
    // Orders
    { id: 14, code: 'ORDER_VIEW', name: 'View Orders', module: 'Orders', description: 'Can view orders' },
    { id: 15, code: 'ORDER_CREATE', name: 'Create Orders', module: 'Orders', description: 'Can create orders' },
    { id: 16, code: 'ORDER_EDIT', name: 'Edit Orders', module: 'Orders', description: 'Can edit orders' },
    { id: 17, code: 'ORDER_DELETE', name: 'Delete Orders', module: 'Orders', description: 'Can delete orders' },
    
    // Reports
    { id: 18, code: 'REPORT_VIEW', name: 'View Reports', module: 'Reports', description: 'Can view reports' },
    { id: 19, code: 'REPORT_EXPORT', name: 'Export Reports', module: 'Reports', description: 'Can export reports' },
    
    // Billing
    { id: 20, code: 'BILLING_VIEW', name: 'View Billing', module: 'Billing', description: 'Can view billing' },
    { id: 21, code: 'BILLING_CREATE', name: 'Create Bills', module: 'Billing', description: 'Can create bills' },
    { id: 22, code: 'BILLING_EDIT', name: 'Edit Bills', module: 'Billing', description: 'Can edit bills' },
    
    // Payments
    { id: 23, code: 'PAYMENT_VIEW', name: 'View Payments', module: 'Payments', description: 'Can view payments' },
    { id: 24, code: 'PAYMENT_COLLECT', name: 'Collect Payments', module: 'Payments', description: 'Can collect payments' },
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Get all available permissions
   */
  getAvailablePermissions(): Permission[] {
    return this.availablePermissions;
  }

  /**
   * Get permissions grouped by module
   */
  getPermissionsByModule(): { module: string; permissions: Permission[] }[] {
    const modules = [...new Set(this.availablePermissions.map(p => p.module))];
    return modules.map(module => ({
      module,
      permissions: this.availablePermissions.filter(p => p.module === module)
    }));
  }

  /**
   * Get all roles
   */
  getAllRoles(isActive: boolean = true): Observable<Role[]> {
    const endpoint = `/Roles${isActive !== undefined ? `?isActive=${isActive}` : ''}`;
    return this.apiService.get<Role[]>(endpoint);
  }

  /**
   * Get a single role by ID
   */
  getRoleById(id: number): Observable<Role> {
    return this.apiService.get<Role>(`/Roles/${id}`);
  }

  /**
   * Create a new role
   */
  createRole(roleData: RoleFormData): Observable<ApiResponse> {
    const payload = {
      name: roleData.name,
      description: roleData.description || '',
      isActive: roleData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>('/Roles', payload);
  }

  /**
   * Update an existing role
   */
  updateRole(id: number, roleData: RoleFormData): Observable<ApiResponse> {
    const payload = {
      name: roleData.name,
      description: roleData.description || '',
      isActive: roleData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse>(`/Roles/${id}`, payload);
  }

  /**
   * Delete a role
   */
  deleteRole(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Roles/${id}`);
  }
}
