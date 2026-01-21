import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Specification {
  id?: number;
  specificationId?: number;
  name: string;
  status: string;
  isActive: string;
  createdAt?: string;
}

export interface SpecificationFormData {
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
export class SpecificationService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all specifications
   */
  getAllSpecifications(isActive: string = 'Y'): Observable<Specification[]> {
    const endpoint = `/Specifications${isActive ? '?isActive=Y' : ''}`;
    return this.apiService.get<ApiResponse<Specification[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get a single specification by ID
   */
  getSpecificationById(id: number): Observable<Specification> {
    return this.apiService.get<Specification>(`/Specifications/${id}`);
  }

  /**
   * Create a new specification
   */
  createSpecification(specificationData: SpecificationFormData): Observable<ApiResponse> {
    const payload = {
      name: specificationData.name,
      isActive: specificationData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>('/Specifications', payload);
  }

  /**
   * Update an existing specification
   */
  updateSpecification(id: number, specificationData: SpecificationFormData): Observable<ApiResponse> {
    const payload = {
      specificationId: id,
      name: specificationData.name,
      isActive: specificationData.isActive || 'Y'
    };

    return this.apiService.put<ApiResponse>(`/Specifications/${id}`, payload);
  }

  /**
   * Delete a specification
   */
  deleteSpecification(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(`/Specifications/${id}`);
  }
}
