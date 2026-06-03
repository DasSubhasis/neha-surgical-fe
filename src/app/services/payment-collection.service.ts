import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export const PAYMENT_MODES = ['Cash', 'Cheque', 'UPI', 'NEFT', 'RTGS', 'DD', 'Bank Transfer'] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

export function paymentReferenceLabel(mode: string | null | undefined): string {
  switch (mode) {
    case 'Cheque': return 'Cheque Number';
    case 'UPI':    return 'UPI / UTR Number';
    case 'NEFT':
    case 'RTGS':   return 'Transaction Reference';
    case 'DD':     return 'DD Number';
    case 'Bank Transfer': return 'Reference Number';
    default:       return 'Reference Number';
  }
}

export interface PaymentCollection {
  collectionId: number;
  collectionDate: string;
  collectedBy: string;
  doctorId: number;
  doctorName: string;
  hospitalId: number;
  hospitalName: string;
  amount: number;
  remarks?: string;
  paymentMode?: string;
  paymentReference?: string;
  createdBy?: string;
  createdAt: string;
}

export interface PaymentFormData {
  collectionDate: string;
  collectedBy: string;
  doctorId: number | null;
  hospitalId: number | null;
  amount: number;
  remarks?: string;
  paymentMode?: string;
  paymentReference?: string;
  createdBy: string;
}

export interface Doctor {
  doctorId: number;
  doctorName: string;
  contactNo?: string;
  email?: string;
  specialization?: string;
}

export interface Hospital {
  hospitalId: number;
  name: string;
  address?: string;
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

  createPayment(data: PaymentFormData): Observable<any> {
    return this.apiService.post<any>(ENDPOINTS.PAYMENTS.CREATE, data);
  }

  updatePayment(id: number, data: Partial<PaymentFormData>): Observable<any> {
    return this.apiService.put<any>(ENDPOINTS.PAYMENTS.UPDATE(id), data);
  }

  deletePayment(id: number): Observable<any> {
    return this.apiService.delete<any>(ENDPOINTS.PAYMENTS.DELETE(id));
  }

  getDoctors(): Observable<Doctor[]> {
    return this.apiService.get<Doctor[]>(ENDPOINTS.DOCTORS.LIST(true));
  }

  getHospitals(): Observable<Hospital[]> {
    return this.apiService.get<ApiResponse<Hospital[]>>(ENDPOINTS.HOSPITALS.LIST(true)).pipe(
      map((response) => response.data || [])
    );
  }
}
