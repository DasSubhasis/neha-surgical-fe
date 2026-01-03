import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface Assistant {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface AssistantAssignment {
  id: number;
  orderNo: string;
  patient: string;
  operationDate: string;
  operationTime: string;
  doctorId?: number;
  doctorName?: string;
  hospitalId?: number;
  hospitalName?: string;
  assistantId: number | null;
  assistantName: string | null;
  reportingTime: string | null;
  remarks: string;
  status: 'Pending' | 'Assigned';
}

export interface ExistingAssignment {
  id: number;
  orderId: number;
  orderNo: string;
  assistantId: number;
  assistantName: string;
  reportingDate: string;
  reportingTime: string;
  operationDate: string;
  operationTime: string;
  doctorName: string;
  hospitalName: string;
  remarks: string;
}

export interface AssignAssistantRequest {
  orderId: number;
  assistantId: number;
  reportingDate: string;
  reportingTime: string;
  remarks: string;
  assignedBy: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantAssignmentService {
  constructor(private apiService: ApiService) {}

  getAssignments(status?: string): Observable<AssistantAssignment[]> {
    return this.apiService.get<ApiResponse<AssistantAssignment[]>>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.LIST(status)
    ).pipe(
      map(response => response.data || [])
    );
  }

  getAssistants(): Observable<Assistant[]> {
    return this.apiService.get<ApiResponse<Assistant[]>>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.ASSISTANTS
    ).pipe(
      map(response => response.data || [])
    );
  }

  getExistingAssignments(assistantId: number): Observable<ExistingAssignment[]> {
    return this.apiService.get<ApiResponse<ExistingAssignment[]>>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.EXISTING(assistantId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  getExistingAssignmentsByDate(assistantId: number | null, date: string): Observable<ExistingAssignment[]> {
    return this.apiService.get<ApiResponse<ExistingAssignment[]>>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.EXISTING_BY_DATE(assistantId, date)
    ).pipe(
      map(response => response.data || [])
    );
  }

  assignAssistant(
    orderId: number,
    assistantId: number,
    reportingDate: string,
    reportingTime: string,
    remarks: string,
    assignedBy: number = 0
  ): Observable<{ success: boolean; message: string; data?: AssistantAssignment }> {
    const payload: AssignAssistantRequest = {
      orderId,
      assistantId,
      reportingDate,
      reportingTime,
      remarks,
      assignedBy
    };

    return this.apiService.post<any>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.ASSIGN,
      payload
    );
  }

  unassignAssistant(orderId: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.UNASSIGN(orderId)
    );
  }
}
