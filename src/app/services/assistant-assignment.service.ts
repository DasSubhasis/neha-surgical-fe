import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface Assistant {
  id: string;
  name: string;
  phone: string;
}

export interface AssistantAssignment {
  id: number;
  orderNo: string;
  patient: string;
  operationDate: string;
  operationTime: string;
  assistantId: string | null;
  assistantName: string | null;
  reportingTime: string | null;
  remarks: string;
  status: 'Pending' | 'Assigned';
}

export interface ExistingAssignment {
  id: number;
  assistantId: string;
  orderNo: string;
  date: string;
  startTime: string;
  endTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantAssignmentService {
  private assistants: Assistant[] = [
    { id: 'A1', name: 'Rahul Kumar', phone: '+91-9000000001' },
    { id: 'A2', name: 'Priya Sharma', phone: '+91-9000000002' },
    { id: 'A3', name: 'Amit Verma', phone: '+91-9000000003' }
  ];

  private assignments: AssistantAssignment[] = [
    {
      id: 1002,
      orderNo: 'ORD-1002',
      patient: 'Mr. X',
      operationDate: '2025-12-04',
      operationTime: '10:30',
      assistantId: null,
      assistantName: null,
      reportingTime: null,
      remarks: '',
      status: 'Pending'
    },
    {
      id: 1003,
      orderNo: 'ORD-1003',
      patient: 'Ms. Y',
      operationDate: '2025-12-06',
      operationTime: '09:15',
      assistantId: 'A2',
      assistantName: 'Priya Sharma',
      reportingTime: '08:45',
      remarks: 'Pre-op briefing',
      status: 'Assigned'
    },
    {
      id: 1004,
      orderNo: 'ORD-1004',
      patient: 'Mrs. Z',
      operationDate: '2025-12-09',
      operationTime: '12:45',
      assistantId: null,
      assistantName: null,
      reportingTime: null,
      remarks: '',
      status: 'Pending'
    },
    {
      id: 1005,
      orderNo: 'ORD-1005',
      patient: 'Mr. A',
      operationDate: '2025-12-09',
      operationTime: '08:30',
      assistantId: 'A1',
      assistantName: 'Rahul Kumar',
      reportingTime: '15:45',
      remarks: 'Critical case',
      status: 'Assigned'
    },
    {
      id: 1006,
      orderNo: 'ORD-1006',
      patient: 'Ms. B',
      operationDate: '2025-12-10',
      operationTime: '16:00',
      assistantId: null,
      assistantName: null,
      reportingTime: null,
      remarks: '',
      status: 'Pending'
    }
  ];

  private existingAssignments: ExistingAssignment[] = [
    { id: 1, assistantId: 'A1', orderNo: 'ORD-1002', date: '2025-11-25', startTime: '10:00', endTime: '12:00' },
    { id: 2, assistantId: 'A1', orderNo: 'ORD-1003', date: '2025-11-26', startTime: '13:00', endTime: '15:00' },
    { id: 3, assistantId: 'A2', orderNo: 'ORD-1004', date: '2025-11-25', startTime: '08:30', endTime: '10:30' },
    { id: 4, assistantId: 'A2', orderNo: 'ORD-1005', date: '2025-11-27', startTime: '09:00', endTime: '11:00' },
    { id: 5, assistantId: 'A3', orderNo: 'ORD-1006', date: '2025-11-27', startTime: '11:00', endTime: '13:00' }
  ];

  getAssignments(): Observable<AssistantAssignment[]> {
    return of([...this.assignments]).pipe(delay(300));
  }

  getAssistants(): Observable<Assistant[]> {
    return of([...this.assistants]).pipe(delay(200));
  }

  getExistingAssignments(): Observable<ExistingAssignment[]> {
    return of([...this.existingAssignments]).pipe(delay(200));
  }

  assignAssistant(
    orderId: number,
    assistantId: string,
    reportingTime: string,
    remarks: string
  ): Observable<{ success: boolean; message: string; data?: AssistantAssignment }> {
    const index = this.assignments.findIndex(a => a.id === orderId);
    
    if (index !== -1) {
      const assistant = this.assistants.find(a => a.id === assistantId);
      
      this.assignments[index] = {
        ...this.assignments[index],
        assistantId,
        assistantName: assistant?.name || null,
        reportingTime,
        remarks,
        status: 'Assigned'
      };

      // Simulate WhatsApp notifications
      console.log(`WA -> ${assistant?.name} (${assistant?.phone}): Assigned to ${this.assignments[index].orderNo} on ${this.assignments[index].operationDate} at ${this.assignments[index].operationTime} — reporting ${reportingTime}`);
      console.log(`WA -> Doctor: (simulated) Assistant assigned for ${this.assignments[index].orderNo}`);
      console.log(`WA -> Officials: (simulated) Assistant assigned for ${this.assignments[index].orderNo}`);

      return of({
        success: true,
        message: 'Assistant assigned successfully',
        data: this.assignments[index]
      }).pipe(delay(300));
    }

    return of({
      success: false,
      message: 'Assignment not found'
    }).pipe(delay(300));
  }
}
