import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Category {
  id?: number;
  categoryId?: number;
  name: string;
  status: string;
  isActive: string;
  createdAt?: string;
}

export interface CategoryFormData {
  name: string;
  status: string;
  isActive: string;
}

export interface ImportRow {
  index: number;
  row: {
    name: string;
  };
  isDuplicate: boolean;
  duplicateAgainst: (number | string)[];
  action: 'add' | 'merge' | 'skip';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all categories
   */
  getAllCategories(isActive: boolean = true): Observable<Category[]> {
    const endpoint = `/Categories${isActive !== undefined ? `?isActive=${isActive}` : ''}`;
    return this.apiService.get<Category[]>(endpoint);
  }

  /**
   * Get a single category by ID
   */
  getCategoryById(id: number): Observable<Category> {
    return this.apiService.get<Category>(`/Categories/${id}`);
  }

  /**
   * Create a new category
   */
  createCategory(categoryData: CategoryFormData): Observable<ApiResponse> {
    const payload = {
      name: categoryData.name,
      isActive: categoryData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>('/Categories', payload);
  }

  /**
   * Update an existing category
   */
  updateCategory(id: number, categoryData: CategoryFormData): Observable<ApiResponse> {
    const payload = {
      name: categoryData.name,
      isActive: categoryData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse>(`/Categories/${id}`, payload);
  }

  /**
   * Delete a category
   */
  deleteCategory(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Categories/${id}`);
  }
}
