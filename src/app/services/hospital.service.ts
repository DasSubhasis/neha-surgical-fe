import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface HospitalContact {
  name: string;
  mobile: string;
  email: string;
  location: string;
  remarks: string;
}

export interface Hospital {
  id?: number;
  hospitalId?: number;
  name: string;
  address: string;
  contactPerson?: string;
  contactNo?: string;
  contacts: HospitalContact[];
  status: string;
  isActive: string;
  createdAt?: string;
}

export interface HospitalFormData {
  name: string;
  address: string;
  contactPerson: string;
  contactNo: string;
  contacts: HospitalContact[];
  status: string;
  isActive: string;
}

export interface ImportRow {
  index: number;
  row: {
    name: string;
    address: string;
    contactPerson: string;
    contactNo: string;
  };
  isDuplicate: boolean;
  duplicateAgainst: (number | string)[];
  action: 'add' | 'merge' | 'skip';
}

@Injectable({
  providedIn: 'root'
})
export class HospitalService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all hospitals
   */
  getAllHospitals(isActive: string = 'Y'): Observable<Hospital[]> {
    const endpoint = ENDPOINTS.HOSPITALS.LIST(isActive === 'Y');
    return this.apiService.get<ApiResponse<Hospital[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get a single hospital by ID
   */
  getHospitalById(id: number): Observable<Hospital> {
    const endpoint = ENDPOINTS.HOSPITALS.GET(id);
    return this.apiService.get<ApiResponse<Hospital>>(endpoint).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Create a new hospital
   */
  createHospital(hospitalData: HospitalFormData): Observable<ApiResponse> {
    const payload = {
      name: hospitalData.name,
      address: hospitalData.address || '',
      contactPerson: hospitalData.contactPerson || '',
      contactNo: hospitalData.contactNo || '',
      contacts: hospitalData.contacts || [],
      isActive: hospitalData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>(ENDPOINTS.HOSPITALS.CREATE, payload);
  }

  /**
   * Update an existing hospital
   */
  updateHospital(id: number, hospitalData: HospitalFormData): Observable<ApiResponse> {
    const payload = {
      hospitalId: id,
      name: hospitalData.name,
      address: hospitalData.address || '',
      contactPerson: hospitalData.contactPerson || '',
      contactNo: hospitalData.contactNo || '',
      contacts: hospitalData.contacts || [],
      isActive: hospitalData.isActive || 'Y'
    };

    const endpoint = ENDPOINTS.HOSPITALS.UPDATE(id);
    return this.apiService.put<ApiResponse>(endpoint, payload);
  }

  /**
   * Delete a hospital
   */
  deleteHospital(id: number): Observable<ApiResponse> {
    const endpoint = ENDPOINTS.HOSPITALS.DELETE(id);
    return this.apiService.delete<ApiResponse>(endpoint);
  }
}
