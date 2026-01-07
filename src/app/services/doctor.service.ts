import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface Doctor {
  id?: number;
  doctorId?: number;
  doctorName: string;
  contactNo: string;
  email?: string;
  identifier?: string;
  dob?: string;
  doa?: string;
  specialization: string;
  registrationNumber?: string;
  location?: string;
  remarks?: string;
  isActive: string;
  status?: string;
  // Alias fields for AG Grid display
  name?: string;
  contact?: string;
}

export interface DoctorFormData {
  doctorName: string;
  contactNo: string;
  email: string;
  identifier: string;
  dob: string;
  doa: string;
  specialization: string;
  registrationNumber: string;
  location: string;
  remarks: string;
  isActive: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all doctors
   */
  getAllDoctors(isActive: string = 'Y'): Observable<Doctor[]> {
    const endpoint = ENDPOINTS.DOCTORS.LIST(isActive === 'Y');
    return this.apiService.get<Doctor[]>(endpoint);
  }

  /**
   * Get a single doctor by ID
   */
  getDoctorById(id: number): Observable<Doctor> {
    const endpoint = ENDPOINTS.DOCTORS.GET(id);
    return this.apiService.get<Doctor>(endpoint);
  }

  /**
   * Create a new doctor
   */
  createDoctor(doctorData: DoctorFormData): Observable<ApiResponse> {
    const payload = {
      doctorName: doctorData.doctorName,
      contactNo: doctorData.contactNo,
      email: doctorData.email || '',
      specialization: doctorData.specialization,
      dob: doctorData.dob || '2000-01-01',
      doa: doctorData.doa || '2000-01-01',
      identifier: doctorData.identifier || '',
      registrationNumber: doctorData.registrationNumber || '',
      location: doctorData.location || '',
      remarks: doctorData.remarks || '',
      isActive: doctorData.isActive || 'Y'
    };

    return this.apiService.post<ApiResponse>(ENDPOINTS.DOCTORS.CREATE, payload);
  }

  /**
   * Update an existing doctor
   */
  updateDoctor(id: number, doctorData: DoctorFormData): Observable<ApiResponse> {
    const payload = {
      doctorName: doctorData.doctorName,
      contactNo: doctorData.contactNo,
      email: doctorData.email || '',
      specialization: doctorData.specialization,
      dob: doctorData.dob || '2000-01-01',
      doa: doctorData.doa || '2000-01-01',
      identifier: doctorData.identifier || '',
      registrationNumber: doctorData.registrationNumber || '',
      location: doctorData.location || '',
      remarks: doctorData.remarks || '',
      isActive: doctorData.isActive || 'Y'
    };

    const endpoint = ENDPOINTS.DOCTORS.UPDATE(id);
    return this.apiService.put<ApiResponse>(endpoint, payload);
  }

  /**
   * Delete a doctor
   */
  deleteDoctor(id: number): Observable<ApiResponse> {
    const endpoint = ENDPOINTS.DOCTORS.DELETE(id);
    return this.apiService.delete<ApiResponse>(endpoint);
  }
}
