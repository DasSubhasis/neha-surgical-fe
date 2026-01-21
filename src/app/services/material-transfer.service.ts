import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface MaterialTransfer {
  id: number;
  orderNo: string;
  orderDate: string;
  doctorName: string;
  hospitalName: string;
  operationDate: string;
  operationTime?: string;
  materialSendDate: string;
  deliveryDate?: string;
  itemsSummary: MaterialTransferItem[];
  status: string;
  remarks?: string;
  deliveryRemarks?: string;
  proofUrl?: string;
  audits: MaterialTransferAudit[];
}

export interface MaterialTransferItem {
  id: string;
  name: string;
  manual?: boolean;
  isGroup?: boolean;
}

export interface MaterialTransferAudit {
  when: string;
  by: string;
  action: string;
}

export interface DeliveryUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  employeeId: string | null;
  identifier: string | null;
  roleId: number;
  roleName: string;
  isActive: string;
}

export interface MaterialTransferFormData {
  orderId: number;
  deliveryDate: string;
  remarks?: string;
  proofFile?: File;
}

export interface MaterialDeliveryFormData {
  orderId: number;
  deliveryDate: string;
  deliveredById: number;
  remarks: string;
  deliveryStatus: string;
  createdBy: string;
}

export interface MaterialDeliveryInfo {
  deliveryStatus: string;
  actualDeliveryBy: string;
  actualDeliveryByUserId: number;
  actualDeliveryTime: string;
  remarks: string;
}

export interface MaterialDelivery {
  deliveryId: number;
  orderId: number;
  orderNo: string;
  doctorName: string;
  hospitalName: string;
  operationDate: string;
  operationTime?: string;
  materialSendDate?: string;
  deliveryDate: string;
  deliveredBy: string;
  remarks: string;
  deliveryStatus: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  materialDelivery?: MaterialDeliveryInfo;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialTransferService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all material transfers (orders with Booked or Material Delivered status)
   */
  getTransfers(): Observable<MaterialTransfer[]> {
    return this.apiService.get<ApiResponse<MaterialTransfer[]>>(ENDPOINTS.ORDERS.LIST).pipe(
      map(response => {
        const orders = response.data || [];
        // Filter only orders that are Booked or Material Delivered
        return orders.filter(order => 
          order.status === 'Booked' || order.status === 'Material Delivered'
        );
      })
    );
  }

  /**
   * Get pending orders (for material transfer - orders with isDelivered=Pending)
   */
  getPendingOrders(): Observable<MaterialTransfer[]> {
    return this.apiService.get<ApiResponse<any[]>>(`${ENDPOINTS.ORDERS.BASE}?isDelivered=Pending`).pipe(
      map(response => {
        const orders = response.data || [];
        return orders.map((order: any) => ({
          id: order.orderId || order.id,
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          doctorName: order.doctorName,
          hospitalName: order.hospitalName,
          operationDate: order.operationDate,
          operationTime: order.operationTime,
          materialSendDate: order.materialSendDate,
          deliveryDate: order.deliveryDate,
          itemsSummary: order.items || [],
          status: order.status,
          remarks: order.remarks,
          deliveryRemarks: order.deliveryRemarks,
          proofUrl: order.proofUrl,
          audits: order.audits || []
        }));
      })
    );
  }

  /**
   * Mark material as delivered
   */
  markDelivered(formData: MaterialTransferFormData): Observable<MaterialTransfer> {
    const payload = {
      ...formData,
      status: 'Material Delivered'
    };
    
    return this.apiService.put<ApiResponse<MaterialTransfer>>(
      `${ENDPOINTS.ORDERS.BASE}/${formData.orderId}/material-delivered`,
      payload
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to mark material as delivered');
      })
    );
  }

  /**
   * Quick mark delivered (simplified version without remarks/proof)
   */
  quickMarkDelivered(orderId: number, deliveryDate: string): Observable<MaterialTransfer> {
    const payload = {
      orderId,
      deliveryDate,
      status: 'Material Delivered'
    };

    return this.apiService.post<ApiResponse<MaterialTransfer>>(
      `${ENDPOINTS.ORDERS.BASE}/${orderId}/quick-delivered`,
      payload
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to mark as delivered');
      })
    );
  }

  /**
   * Update material delivery
   */
  updateMaterialDelivery(deliveryId: number, formData: MaterialDeliveryFormData): Observable<any> {
    const payload = {
      orderId: formData.orderId,
      deliveryDate: formData.deliveryDate,
      deliveredById: formData.deliveredById,
      remarks: formData.remarks || '',
      deliveryStatus: formData.deliveryStatus,
      updatedBy: formData.createdBy // Using createdBy field as updatedBy
    };

    return this.apiService.put<ApiResponse<any>>(
      `${ENDPOINTS.MATERIAL_DELIVERIES.BASE}/${deliveryId}`,
      payload
    ).pipe(
      map(response => {
        // Handle both success field and message-only responses
        if (response.success !== false && (response.success === true || response.message)) {
          return response.data || response;
        }
        throw new Error(response.message || 'Failed to update material delivery');
      })
    );
  }

  /**
   * Get material transfers by date (for Material Send Day Board)
   */
  getTransfersByDate(date: string): Observable<MaterialTransfer[]> {
    return this.apiService.get<ApiResponse<MaterialTransfer[]>>(`${ENDPOINTS.ORDERS.BASE}?materialSendDate=${date}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Upload proof file for material transfer
   */
  uploadProof(orderId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiService.post<ApiResponse<{ url: string }>>(
      `${ENDPOINTS.ORDERS.BASE}/${orderId}/upload-proof`,
      formData
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.url;
        }
        throw new Error(response.message || 'Failed to upload proof');
      })
    );
  }

  /**
   * Assign material delivery
   */
  assignMaterialDelivery(formData: MaterialDeliveryFormData): Observable<any> {
    console.log('Posting to MaterialDeliveries API:', formData);
    return this.apiService.post<any>(
      ENDPOINTS.MATERIAL_DELIVERIES.CREATE,
      formData
    ).pipe(
      map(response => {
        console.log('MaterialDeliveries API Response:', response);
        // Handle both wrapped and unwrapped responses
        if (response && response.success !== undefined) {
          if (response.success) {
            return response.data || response;
          }
          throw new Error(response.message || 'Failed to assign material delivery');
        }
        // If response doesn't have success field, return it directly
        return response;
      })
    );
  }

  /**
   * Get all material deliveries
   * @param deliveryStatus Optional filter by delivery status (e.g., 'Assigned', 'Delivered')
   * @param deliveredById Optional filter by delivered by user ID
   */
  getMaterialDeliveries(deliveryStatus?: string, deliveredById?: number): Observable<MaterialDelivery[]> {
    let url = ENDPOINTS.MATERIAL_DELIVERIES.LIST;
    const params: string[] = [];
    
    if (deliveryStatus) {
      params.push(`deliveryStatus=${deliveryStatus}`);
    }
    
    if (deliveredById) {
      params.push(`deliveredById=${deliveredById}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('Material deliveries response:', response);
        // Handle both wrapped responses and direct data
        if (response && response.data) {
          return response.data;
        }
        return response || [];
      })
    );
  }

  /**
   * Get non-admin users for delivery assignment (all active users except admin)
   */
  getDeliveryUsers(): Observable<DeliveryUser[]> {
    return this.apiService.get<any>('/Users/non-admin?isActive=Y').pipe(
      map(response => {
        console.log('Delivery users response:', response);
        // Handle both wrapped responses and direct data
        if (response && response.data) {
          return response.data;
        }
        return response || [];
      })
    );
  }

  /**
   * Mark a material delivery as delivered
   */
  markMaterialDelivered(deliveryId: number, deliveredById: number, remarks: string): Observable<any> {
    console.log('Marking delivery as delivered:', { deliveryId, deliveredById, remarks });
    return this.apiService.post<any>(
      `${ENDPOINTS.MATERIAL_DELIVERIES.BASE}/${deliveryId}/mark-delivered`,
      { deliveredById, remarks }
    ).pipe(
      map(response => {
        console.log('Mark delivered API Response:', response);
        // Handle both wrapped and unwrapped responses
        if (response && response.success !== undefined) {
          if (response.success) {
            return response.data || response;
          }
          throw new Error(response.message || 'Failed to mark delivery as delivered');
        }
        // If response doesn't have success field, return it directly
        return response;
      })
    );
  }
}
