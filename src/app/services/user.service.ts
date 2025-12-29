import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Role } from './role.service';

export interface User {
  id?: number;
  userId?: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  roleId: number;
  roleName?: string;
  role?: Role;
  status: string;
  isActive: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  roleId: number;
  status: string;
  isActive: string;
}

export interface ImportRow {
  index: number;
  row: {
    username: string;
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
  getAllUsers(isActive: boolean = true): Observable<User[]> {
    const endpoint = `/Users${isActive !== undefined ? `?isActive=${isActive}` : ''}`;
    return this.apiService.get<User[]>(endpoint);
  }

  /**
   * Get a single user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.apiService.get<User>(`/Users/${id}`);
  }

  /**
   * Get users by role ID
   */
  getUsersByRole(roleId: number): Observable<User[]> {
    return this.apiService.get<User[]>(`/Users?roleId=${roleId}`);
  }

  /**
   * Create a new user
   */
  createUser(userData: UserFormData): Observable<ApiResponse> {
    const payload = {
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone || '',
      roleId: userData.roleId,
      isActive: userData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>('/Users', payload);
  }

  /**
   * Update an existing user
   */
  updateUser(id: number, userData: UserFormData): Observable<ApiResponse> {
    const payload: any = {
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone || '',
      roleId: userData.roleId,
      isActive: userData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse>(`/Users/${id}`, payload);
  }

  /**
   * Delete a user
   */
  deleteUser(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Users/${id}`);
  }
}
