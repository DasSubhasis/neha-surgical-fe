import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface PaymentCollection {
  id: number;
  receiptNo: string;
  collectionDate: string;
  doctorId: number;
  doctorName: string;
  hospitalId: number;
  hospitalName: string;
  amount: number;
  collectedById: number;
  collectedByName: string;
  remarks?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  audits?: AuditEntry[];
}

export interface PaymentFormData {
  receiptNo: string;
  collectionDate: string;
  doctorId: number | null;
  hospitalId: number | null;
  amount: number;
  collectedById: number;
  remarks: string;
  createdBy: string;
}

export interface AuditEntry {
  when: string;
  by: string;
  action: string;
}

export interface Doctor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentCollectionService {
  constructor(private apiService: ApiService) {}

  getAllPayments(): Observable<PaymentCollection[]> {
    return this.apiService.get<ApiResponse<PaymentCollection[]>>(ENDPOINTS.PAYMENTS.LIST).pipe(
      map((response) => response.data || [])
    );
  }

  getPaymentById(id: number): Observable<PaymentCollection> {
    return this.apiService.get<ApiResponse<PaymentCollection>>(ENDPOINTS.PAYMENTS.GET(id)).pipe(
      map((response) => response.data!)
    );
  }

  createPayment(data: PaymentFormData): Observable<PaymentCollection> {
    return this.apiService.post<ApiResponse<PaymentCollection>>(ENDPOINTS.PAYMENTS.CREATE, data).pipe(
      map((response) => response.data!)
    );
  }

  updatePayment(id: number, data: PaymentFormData): Observable<PaymentCollection> {
    return this.apiService.put<ApiResponse<PaymentCollection>>(ENDPOINTS.PAYMENTS.UPDATE(id), data).pipe(
      map((response) => response.data!)
    );
  }

  deletePayment(id: number): Observable<void> {
    return this.apiService.delete<void>(ENDPOINTS.PAYMENTS.DELETE(id)).pipe(
      map(() => undefined)
    );
  }

  getDoctors(): Observable<Doctor[]> {
    return this.apiService.get<ApiResponse<Doctor[]>>(ENDPOINTS.DOCTORS.LIST(true)).pipe(
      map((response) => response.data || [])
    );
  }

  getHospitals(): Observable<Hospital[]> {
    return this.apiService.get<ApiResponse<Hospital[]>>(ENDPOINTS.HOSPITALS.LIST(true)).pipe(
      map((response) => response.data || [])
    );
  }

  getUsers(): Observable<User[]> {
    return this.apiService.get<ApiResponse<User[]>>(ENDPOINTS.USERS.GET_ALL).pipe(
      map((response) => response.data || [])
    );
  }

  generateReceiptNo(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `RCP-${year}-${random}`;
  }
}
