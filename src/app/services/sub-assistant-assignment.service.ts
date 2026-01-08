import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface SubAssistantAssignment {
  subAssignmentId: number;
  assignmentId: number;
  orderId: number;
  orderNo: string;
  mainAssistantId: number;
  mainAssistantName: string;
  subAssistantId: number;
  subAssistantName: string;
  subAssistantPhone: string;
  remarks: string | null;
  assignedAt: string;
}

export interface SubAssistantAssignmentFormData {
  assignmentId: number;
  orderId: number;
  subAssistantId: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubAssistantAssignmentService {

  constructor(private apiService: ApiService) { }

  // Get all sub-assistant assignments with optional filters
  getSubAssistantAssignments(orderId?: number, assignmentId?: number): Observable<SubAssistantAssignment[]> {
    let url = ENDPOINTS.SUB_ASSISTANT_ASSIGNMENTS.BASE;
    const params: string[] = [];
    
    if (orderId) {
      params.push(`orderId=${orderId}`);
    }
    if (assignmentId) {
      params.push(`assignmentId=${assignmentId}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    console.log('Fetching sub-assistant assignments from:', url);
    
    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('Sub-assistant assignments response:', response);
        const data = response?.data || response || [];
        return Array.isArray(data) ? data : [];
      })
    );
  }

  // Get specific sub-assignment by ID
  getSubAssistantAssignment(id: number): Observable<SubAssistantAssignment> {
    const url = `${ENDPOINTS.SUB_ASSISTANT_ASSIGNMENTS.BASE}/${id}`;
    console.log('Fetching sub-assistant assignment from:', url);
    
    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('Sub-assistant assignment response:', response);
        return response?.data || response;
      })
    );
  }

  // Assign sub-assistant under main assistant
  assignSubAssistant(formData: SubAssistantAssignmentFormData): Observable<any> {
    console.log('Assigning sub-assistant:', formData);
    return this.apiService.post<any>(ENDPOINTS.SUB_ASSISTANT_ASSIGNMENTS.BASE, formData);
  }

  // Unassign sub-assistant
  unassignSubAssistant(id: number): Observable<any> {
    const url = `${ENDPOINTS.SUB_ASSISTANT_ASSIGNMENTS.BASE}/${id}`;
    console.log('Unassigning sub-assistant:', url);
    return this.apiService.delete<any>(url);
  }
}
