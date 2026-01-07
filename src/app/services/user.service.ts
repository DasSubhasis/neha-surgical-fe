import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { Role } from './role.service';

export interface User {
  id?: number;
  userId?: number;
  username?: string;
  email: string;
  fullName: string;
  phone: string;
  employeeId?: string;
  identifier?: string;
  roleId: number;
  roleName?: string;
  role?: Role;
  status: string;
  isActive: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserFormData {
  email: string;
  fullName: string;
  phone: string;
  employeeId: string;
  identifier: string;
  roleId: number;
  status: string;
  isActive: string;
}

export interface ImportRow {
  index: number;
  row: {
    email: string;
    fullName: string;
    phone: string;
    roleName: string;
  };
  isDuplicate: boolean;
  duplicateAgainst: (number | string)[];
  action: 'add' | 'merge' | 'skip';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all users
   */
  getAllUsers(isActive?: string, roleId?: number): Observable<User[]> {
    let endpoint = '/Users';
    const params: string[] = [];
    
    if (isActive) params.push(`isActive=${isActive}`);
    if (roleId) params.push(`roleId=${roleId}`);
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }
    
    return this.apiService.get<ApiResponse<User[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get a single user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.apiService.get<ApiResponse<User>>(`/Users/${id}`).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Get users by role ID
   */
  getUsersByRole(roleId: number): Observable<User[]> {
    return this.apiService.get<ApiResponse<User[]>>(`/Users/role/${roleId}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Create a new user
   */
  createUser(userData: UserFormData): Observable<ApiResponse<User>> {
    const payload = {
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone || '',
      employeeId: userData.employeeId || '',
      identifier: userData.identifier || '',
      roleId: userData.roleId,
      isActive: userData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse<User>>('/Users', payload);
  }

  /**
   * Update an existing user
   */
  updateUser(id: number, userData: UserFormData): Observable<ApiResponse<User>> {
    const payload = {
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone || '',
      employeeId: userData.employeeId || '',
      identifier: userData.identifier || '',
      roleId: userData.roleId,
      isActive: userData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse<User>>(`/Users/${id}`, payload);
  }

  /**
   * Delete a user
   */
  deleteUser(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Users/${id}`);
  }
}
