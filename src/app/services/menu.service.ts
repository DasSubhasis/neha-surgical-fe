import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Menu {
  id?: number;
  menuId?: number;
  menuName: string;
  menuPath: string;
  menuIcon?: string;
  parentMenuId?: number | null;
  sortOrder: number;
  isActive: string;
  status?: string;
  createdAt?: string;
  subMenus?: Menu[];
}

export interface MenuFormData {
  menuName: string;
  menuPath: string;
  menuIcon?: string;
  parentMenuId?: number | null;
  sortOrder: number;
  status: string;
  isActive: string;
}

export interface ImportRow {
  index: number;
  row: any;
  isDuplicate: boolean;
  duplicateAgainst: string[];
  action: 'add' | 'merge' | 'skip';
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all menus
   */
  getAllMenus(isActive: boolean = true): Observable<Menu[]> {
    const endpoint = `/menus${isActive ? '?isActive=Y' : ''}`;
    return this.apiService.get<Menu[]>(endpoint);
  }

  /**
   * Get a single menu by ID
   */
  getMenuById(id: number): Observable<Menu> {
    return this.apiService.get<Menu>(`/menus/${id}`);
  }

  /**
   * Create a new menu
   */
  createMenu(menuData: MenuFormData): Observable<ApiResponse> {
    const payload = {
      menuName: menuData.menuName,
      menuPath: menuData.menuPath,
      menuIcon: menuData.menuIcon || null,
      parentMenuId: menuData.parentMenuId || null,
      sortOrder: menuData.sortOrder,
      isActive: menuData.isActive
    };
    return this.apiService.post<ApiResponse>('/menus', payload);
  }

  /**
   * Update an existing menu
   */
  updateMenu(id: number, menuData: MenuFormData): Observable<ApiResponse> {
    const payload = {
      menuName: menuData.menuName,
      menuPath: menuData.menuPath,
      menuIcon: menuData.menuIcon || null,
      parentMenuId: menuData.parentMenuId || null,
      sortOrder: menuData.sortOrder,
      isActive: menuData.isActive
    };
    return this.apiService.put<ApiResponse>(`/menus/${id}`, payload);
  }

  /**
   * Delete a menu
   */
  deleteMenu(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/menus/${id}`);
  }
}
