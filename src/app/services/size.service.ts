import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Size {
  id?: number;
  sizeId?: number;
  name: string;
  status: string;
  isActive: string;
  createdAt?: string;
}

export interface SizeFormData {
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
export class SizeService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all sizes
   */
  getAllSizes(isActive: string = 'Y'): Observable<Size[]> {
    const endpoint = `/Sizes${isActive ? `?isActive=Y` : ''}`;
    return this.apiService.get<ApiResponse<Size[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get a single size by ID
   */
  getSizeById(id: number): Observable<Size> {
    return this.apiService.get<Size>(`/Sizes/${id}`);
  }

  /**
   * Create a new size
   */
  createSize(sizeData: SizeFormData): Observable<ApiResponse> {
    const payload = {
      name: sizeData.name,
      isActive: sizeData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>('/Sizes', payload);
  }

  /**
   * Update an existing size
   */
  updateSize(id: number, sizeData: SizeFormData): Observable<ApiResponse> {
    const payload = {
      name: sizeData.name,
      isActive: sizeData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse>(`/Sizes/${id}`, payload);
  }

  /**
   * Delete a size
   */
  deleteSize(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Sizes/${id}`);
  }
}
