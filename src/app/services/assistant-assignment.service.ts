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
  userId?: number;
  username?: string;
  fullName?: string;
  employeeId?: string;
  identifier?: string;
  roleId?: number;
  roleName?: string;
  isActive?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  manual?: boolean;
  isGroup?: boolean;
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
  itemGroups?: string[];
  items?: OrderItem[];
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
    return this.apiService.get<ApiResponse<any[]>>(
      ENDPOINTS.ASSISTANT_ASSIGNMENTS.LIST(status)
    ).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((assignment: any) => ({
          id: assignment.id,
          orderNo: assignment.orderNo,
          patient: assignment.patient,
          operationDate: assignment.operationDate,
          operationTime: assignment.operationTime,
          doctorId: assignment.doctorId,
          doctorName: assignment.doctorName,
          hospitalId: assignment.hospitalId,
          hospitalName: assignment.hospitalName,
          assistantId: assignment.assistantId,
          assistantName: assignment.assistantName,
          reportingTime: assignment.reportingTime,
          remarks: assignment.remarks,
          status: assignment.status,
          itemGroups: assignment.itemGroups || [],
          items: assignment.items || []
        }));
      })
    );
  }

  getAssistants(): Observable<Assistant[]> {
    return this.apiService.get<ApiResponse<any[]>>(
      '/Users/non-admin?isActive=Y'
    ).pipe(
      map(response => {
        const users = response.data || [];
        return users.map((user: any) => {
          // Create combined display name: fullName - employeeId - identifier
          const nameParts = [user.fullName];
          if (user.employeeId) nameParts.push(user.employeeId);
          if (user.identifier) nameParts.push(user.identifier);
          const displayName = nameParts.join(' - ');

          return {
            id: user.userId,
            name: displayName,
            phone: user.phone || '',
            email: user.email || '',
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            employeeId: user.employeeId,
            identifier: user.identifier,
            roleId: user.roleId,
            roleName: user.roleName,
            isActive: user.isActive
          };
        });
      })
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
