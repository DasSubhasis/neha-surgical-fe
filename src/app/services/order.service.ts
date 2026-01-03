import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface OrderItem {
  id: string;
  name: string;
  manual?: boolean;
  isGroup?: boolean;
}

export interface ItemGroup {
  id: string;
  name: string;
  items: OrderItem[];
}

export interface Order {
  id: number;
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
  audits: OrderAudit[];
}

export interface OrderAudit {
  when: string;
  by: string;
  action: string;
}

export interface OrderFormData {
  orderDate: string;
  doctorId: number | null;
  hospitalId: number | null;
  operationDate: string;
  operationTime: string;
  materialSendDate: string;
  itemGroups: string[];
  items: OrderItem[];
  remarks: string;
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private apiService: ApiService) {}

  getOrders(): Observable<Order[]> {
    return this.apiService.get<ApiResponse<any[]>>(ENDPOINTS.ORDERS.LIST).pipe(
      map(response => {
        const orders = response.data || [];
        return orders.map((order: any) => ({
          id: order.orderId || order.id,
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          doctorId: order.doctorId,
          doctorName: order.doctorName,
          hospitalId: order.hospitalId,
          hospitalName: order.hospitalName,
          operationDate: order.operationDate,
          operationTime: order.operationTime,
          materialSendDate: order.materialSendDate,
          itemGroups: order.itemGroups || [],
          items: order.items || [],
          remarks: order.remarks || '',
          createdBy: order.createdBy || '',
          status: order.status || 'Draft',
          audits: order.audits || []
        }));
      })
    );
  }

  getOrder(id: string | number): Observable<Order> {
    return this.apiService.get<ApiResponse<any>>(ENDPOINTS.ORDERS.GET(id)).pipe(
      map(response => {
        const order = response.data!;
        return {
          id: order.orderId || order.id,
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          doctorId: order.doctorId,
          doctorName: order.doctorName,
          hospitalId: order.hospitalId,
          hospitalName: order.hospitalName,
          operationDate: order.operationDate,
          operationTime: order.operationTime,
          materialSendDate: order.materialSendDate,
          itemGroups: order.itemGroups || [],
          items: order.items || [],
          remarks: order.remarks || '',
          createdBy: order.createdBy || '',
          status: order.status || 'Draft',
          audits: order.audits || []
        };
      })
    );
  }

  createOrder(orderData: OrderFormData): Observable<ApiResponse<Order>> {
    return this.apiService.post<ApiResponse<Order>>(ENDPOINTS.ORDERS.CREATE, orderData);
  }

  updateOrder(id: string | number, orderData: OrderFormData): Observable<ApiResponse<Order>> {
    return this.apiService.put<ApiResponse<Order>>(ENDPOINTS.ORDERS.UPDATE(id), orderData);
  }

  deleteOrder(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(ENDPOINTS.ORDERS.DELETE(id));
  }

  getAllItemGroups(): Observable<ItemGroup[]> {
    // TODO: Replace with actual API endpoint when available
    // For now, return empty array or implement if API exists
    return this.apiService.get<ApiResponse<ItemGroup[]>>('/ItemGroups').pipe(
      map(response => response.data || [])
    );
  }
}
