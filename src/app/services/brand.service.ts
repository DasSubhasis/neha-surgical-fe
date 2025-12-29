import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface Brand {
  id?: number;
  brandId?: number;
  name: string;
  status: string;
  isActive: string;
  createdAt?: string;
}

export interface BrandFormData {
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
export class BrandService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all brands
   */
  getAllBrands(isActive: boolean = true): Observable<Brand[]> {
    const endpoint = `/Brands${isActive ? '?isActive=Y' : ''}`;
    return this.apiService.get<Brand[]>(endpoint);
  }

  /**
   * Get a single brand by ID
   */
  getBrandById(id: number): Observable<Brand> {
    return this.apiService.get<Brand>(`/Brands/${id}`);
  }

  /**
   * Create a new brand
   */
  createBrand(brandData: BrandFormData): Observable<ApiResponse> {
    const payload = {
      name: brandData.name,
      isActive: brandData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>('/Brands', payload);
  }

  /**
   * Update an existing brand
   */
  updateBrand(id: number, brandData: BrandFormData): Observable<ApiResponse> {
    const payload = {
      brandId: id,
      name: brandData.name,
      isActive: brandData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse>(`/Brands/${id}`, payload);
  }

  /**
   * Delete a brand
   */
  deleteBrand(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Brands/${id}`);
  }
}
