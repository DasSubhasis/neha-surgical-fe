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

export interface ConsumptionView {
  consumptionId: number;
  orderId: number;
  orderNo: string;
  itemGroupId: number;
  itemGroupName: string;
  consumedItems: ConsumedItemView[];
  images: ConsumptionImageView[];
  createdBy: string;
  createdAt: string;
}

export interface ConsumedItemView {
  id: string;
  name: string;
  quantity: number;
  type: string;
}

export interface ConsumptionImageView {
  imageId: number;
  imagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: string;
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
  orderId: number;
  orderNo: string;
  orderDate: string;
  doctorId: number;
  doctorName: string;
  hospitalId: number;
  hospitalName: string;
  operationDate: string;
  operationTime: string;
  materialSendDate: string;
  itemGroups: string[];
  items: OrderItem[];
  remarks: string;
  createdBy: string;
  status: string;
  isDelivered: string;
  audits: AuditEntry[];
  materialDelivery?: MaterialDelivery;
  // Additional fields for consumption/billing
  consumptionRecords?: ConsumptionRecord[];
  billingRecords?: BillingRecord[];
  attachments?: Attachment[];
}

export interface OrderItem {
  id: string;
  name: string;
  manual: boolean | null;
  isGroup: boolean | null;
  quantity: number;
}

export interface AuditEntry {
  when: string;
  by: string;
  action: string;
}

export interface MaterialDelivery {
  deliveryStatus: string;
  actualDeliveryBy: string;
  actualDeliveryByUserId: number;
  actualDeliveryTime: string;
  remarks: string;
}

export interface ConsumedItemRequest {
  id: string;
  name: string;
  quantity: number;
  type: string;
}

export interface ConsumptionRequest {
  orderId: number;
  itemGroupId: number;
  itemGroupName: string;
  consumedItems: ConsumedItemRequest[];
  images?: string[];
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsumptionBillingService {

  constructor(private apiService: ApiService) { }

  // Get billable orders (completed orders with Pre-Billing status)
  getBillableOrders(): Observable<Order[]> {
    const status = 'Completed (Pre-Billing)';
    return this.apiService.get<ApiResponse<Order[]>>(`${ENDPOINTS.ORDERS.BASE}?status=${encodeURIComponent(status)}`).pipe(
      map(response => response.data || [])
    );
  }

  // Save consumption entry
  saveConsumption(payload: ConsumptionRequest): Observable<any> {
    return this.apiService.post<any>(ENDPOINTS.CONSUMPTIONS.CREATE, payload);
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
    return this.apiService.get<ApiResponse<Order>>(ENDPOINTS.ORDERS.GET(orderId)).pipe(
      map(response => response.data!)
    );
  }

  // Get consumptions by order
  getConsumptionsByOrder(orderId: number): Observable<ConsumptionView[]> {
    return this.apiService.get<ApiResponse<ConsumptionView[]>>(`${ENDPOINTS.CONSUMPTIONS.BASE}/order/${orderId}`).pipe(
      map(response => response.data!)
    );
  }
}
