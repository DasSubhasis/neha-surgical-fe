import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimelineEntry {
  when: string;
  type: 'Check In' | 'Check Out';
  comments: string;
  coords: Coordinates | null;
}

export interface AssistantOrder {
  id: number;
  orderNo: string;
  doctorName: string;
  hospitalName: string;
  operationDate: string;
  operationTime: string;
  materialSendDate?: string;
  reportingTime: string;
  assignedAssistantId: number | null;
  assignedAssistantName?: string;
  status: 'Scheduled' | 'In Operation' | 'Completed (Pre-Billing)';
  visited: boolean;
  timeline: TimelineEntry[];
}

export interface Assistant {
  id: number;
  name: string;
}

export interface CheckInOutFormData {
  orderId: number;
  type: 'checkin' | 'checkout';
  comments: string;
  coords: Coordinates | null;
  timestamp: string;
}

export interface AssignAssistantFormData {
  orderId: number;
  assistantId: number;
  reportingTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantOperationsService {
  constructor(private apiService: ApiService) {
    console.log('AssistantOperationsService initialized');
  }

  // Get all orders with assistant assignments
  getOrders(): Observable<AssistantOrder[]> {
    console.log('Fetching assistant orders...');
    return this.apiService.get<AssistantOrder[]>(ENDPOINTS.ORDERS.LIST);
  }

  // Get all assistants
  getAssistants(): Observable<Assistant[]> {
    console.log('Fetching assistants...');
    return this.apiService.get<Assistant[]>(ENDPOINTS.USERS.LIST + '?roleType=Assistant');
  }

  // Record check-in or check-out
  recordCheckInOut(formData: CheckInOutFormData): Observable<any> {
    console.log('Recording check-in/out:', formData);
    const endpoint = formData.type === 'checkin' 
      ? ENDPOINTS.ASSISTANT_OPERATIONS.CHECK_IN
      : ENDPOINTS.ASSISTANT_OPERATIONS.CHECK_OUT;
    
    return this.apiService.post<any>(endpoint, formData);
  }

  // Assign assistant to order
  assignAssistant(formData: AssignAssistantFormData): Observable<any> {
    console.log('Assigning assistant:', formData);
    const endpoint = ENDPOINTS.ASSISTANT_ASSIGNMENTS.ASSIGN;
    
    return this.apiService.post<any>(endpoint, formData);
  }

  // Capture GPS coordinates
  captureCoordinates(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return resolve(null);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('GPS coordinates captured:', coords);
          resolve(coords);
        },
        (error) => {
          console.error('Error capturing GPS:', error);
          resolve(null);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  }
}
