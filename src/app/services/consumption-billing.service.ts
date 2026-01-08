import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface ConsumptionItem {
  id: string;
  name: string;
  unit: string;
  group: string | null;
  qtyConsumed: number;
  remarks: string;
  manual?: boolean;
}

export interface BillingItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
  srcConsumptionId?: string;
  fromConsumption?: boolean;
  manual?: boolean;
}

export interface Attachment {
  id: string;
  data: string;
  name: string;
}

export interface ItemGroup {
  id: string;
  name: string;
  items: Item[];
}

export interface Item {
  id: string;
  name: string;
  unit?: string;
  group?: string;
}

export interface ConsumptionRecord {
  id: string;
  name: string;
  unit: string;
  qty: number;
  remarks: string;
}

export interface BillingRecord {
  id: string;
  name: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Order {
  id: number;
  orderNo: string;
  doctorName: string;
  hospitalName: string;
  hospitalAddress?: string;
  patientName?: string;
  assistantName?: string;
  operationDate: string;
  operationTime: string;
  assignedAssistantId: number | null;
  status: string;
  items: OrderItem[];
  itemGroups?: string[];
  consumptionRecords?: ConsumptionRecord[];
  billingRecords?: BillingRecord[];
  attachments?: Attachment[];
  remarks?: string;
  auditLog?: AuditEntry[];
}

export interface OrderItem {
  id: string;
  name: string;
  unit: string;
  group?: string;
  qtyIssued: number;
  qty?: number; // Alternative field name
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  itemsCount: number;
  user: string;
  totalAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConsumptionBillingService {

  constructor(private apiService: ApiService) { }

  // Get billable orders (completed orders with assigned assistants)
  getBillableOrders(): Observable<Order[]> {
    return this.apiService.get<any>(ENDPOINTS.ORDERS.LIST).pipe(
      map(response => {
        const data = response?.data || response || [];
        return data.filter((order: any) => 
          order.assignedAssistantId && 
          ['Completed (Not Billed)', 'Completed (Pre-Billing)', 'Completed'].includes(order.status)
        );
      })
    );
  }

  // Save consumption entry
  saveConsumption(orderId: number, consumedItems: ConsumptionRecord[], attachments: Attachment[], remarks: string): Observable<any> {
    const payload = {
      orderId,
      consumedItems,
      attachments,
      remarks
    };
    return this.apiService.post<any>(`${ENDPOINTS.ORDERS.BASE}/consumption`, payload);
  }

  // Save billing entry
  saveBilling(orderId: number, billingItems: BillingRecord[], remarks: string): Observable<any> {
    const payload = {
      orderId,
      billingItems,
      remarks
    };
    return this.apiService.post<any>(`${ENDPOINTS.ORDERS.BASE}/billing`, payload);
  }

  // Get order details
  getOrderDetails(orderId: number): Observable<Order> {
    return this.apiService.get<any>(ENDPOINTS.ORDERS.GET(orderId)).pipe(
      map(response => response?.data || response)
    );
  }
}
