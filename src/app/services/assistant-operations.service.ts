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
  gpsLocation: string | null;
  assistantId?: number;  // ID of the assistant who performed this action
  assistantName?: string;  // Name of the assistant (optional)
}

export interface OrderItem {
  id: string;
  name: string;
  manual: string | null;
  isGroup: string | null;
  quantity: number;
}

export interface OrderAudit {
  when: string;
  by: string;
  action: string;
}

export interface OrderDetail {
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
  audits: OrderAudit[];
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
  status: 'Assigned' | 'Scheduled' | 'In Operation' | 'Completed (Pre-Billing)';
  visited: boolean;
  timeline: TimelineEntry[];
  hasCheckedIn?: boolean;  // Whether current assistant has checked in
  hasCheckedOut?: boolean; // Whether current assistant has checked out
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

export interface AssistantOperationsPayload {
  orderId: number;
  assistantId: number;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsLocation: string | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  notes: string;
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

  // Map UI status to API status format (replace spaces with hyphens and lowercase after first word)
  private mapStatusToApi(status: string): string {
    // Special case: Keep "Completed (Pre-Billing)" as-is for API
    if (status === 'Completed (Pre-Billing)') {
      return 'Completed (Pre-Billing)';
    }
    
    // First replace spaces with hyphens: "In Operation" -> "In-Operation"
    // Then lowercase everything after the first character: "In-operation"
    const parts = status.split(/\s+/);
    if (parts.length === 1) {
      return status; // "Assigned" stays "Assigned"
    }
    // Keep first word as-is, lowercase the rest
    return parts[0] + '-' + parts.slice(1).join('-').toLowerCase();
  }

  // Map API status to UI status format (replace hyphens with spaces and handle parentheses)
  private mapStatusFromApi(status: string): string {
    // Handle special case for Completed-(pre-billing) -> Completed (Pre-Billing)
    if (status.toLowerCase() === 'completed-(pre-billing)') {
      return 'Completed (Pre-Billing)';
    }
    // Handle general case: replace hyphens with spaces and capitalize properly
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Get all orders with assistant assignments
  getOrders(status?: string, assignedId?: number): Observable<AssistantOrder[]> {
    let url = ENDPOINTS.ORDERS.LIST;
    const params: string[] = [];
    
    if (status) {
      // Convert status to API format (e.g., "In Operation" -> "In-operation")
      const apiStatus = this.mapStatusToApi(status);
      params.push(`status=${apiStatus}`);
    }
    
    if (assignedId) {
      params.push(`assignedId=${assignedId}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    console.log('Fetching assistant orders from:', url);
    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('Assistant orders raw response:', response);
        // Handle both wrapped responses and direct data
        const data = response?.data || response || [];
        
        // Map the API response to AssistantOrder interface
        return data.map((order: any) => {
          const timeline = order.timeline || [];
          // Check if current assistant has checked in/out based on timeline
          // Filter timeline by current assistant ID if assistantId is provided in timeline entries
          const hasCheckedIn = timeline.some((entry: TimelineEntry) => 
            entry.type === 'Check In' && 
            (entry.assistantId === undefined || entry.assistantId === null || entry.assistantId === assignedId)
          );
          const hasCheckedOut = timeline.some((entry: TimelineEntry) => 
            entry.type === 'Check Out' && 
            (entry.assistantId === undefined || entry.assistantId === null || entry.assistantId === assignedId)
          );
          
          return {
            id: order.orderId || order.id,
            orderNo: order.orderNo,
            doctorName: order.doctorName,
            hospitalName: order.hospitalName,
            operationDate: order.operationDate,
            operationTime: order.operationTime,
            materialSendDate: order.materialSendDate,
            reportingTime: order.reportingTime || 'Not Set',
            assignedAssistantId: order.assignedAssistantId || null,
            assignedAssistantName: order.assignedAssistantName || null,
            // Convert API status back to UI format (e.g., "In-operation" -> "In Operation")
            status: order.status ? this.mapStatusFromApi(order.status) : 'Assigned',
            visited: order.visited || false,
            timeline: timeline,
            hasCheckedIn: hasCheckedIn,
            hasCheckedOut: hasCheckedOut
          };
        });
      })
    );
  }

  // Get all assistants
  getAssistants(): Observable<Assistant[]> {
    console.log('Fetching assistants...');
    return this.apiService.get<any>(ENDPOINTS.ASSISTANT_ASSIGNMENTS.ASSISTANTS).pipe(
      map(response => {
        console.log('Assistants raw response:', response);
        // Handle both wrapped responses and direct data
        const data = response?.data || response || [];
        
        // Map to Assistant interface
        return data.map((assistant: any) => ({
          id: assistant.systemUserId || assistant.id,
          name: assistant.fullName || assistant.name
        }));
      })
    );
  }

  // Record check-in or check-out using new API format
  recordCheckInOut(formData: CheckInOutFormData, assistantId: number, locationAddress?: string): Observable<any> {
    console.log('Recording check-in/out:', formData);
    
    // Build payload according to API schema
    const payload: AssistantOperationsPayload = {
      orderId: formData.orderId,
      assistantId: assistantId,
      gpsLatitude: formData.coords?.lat || null,
      gpsLongitude: formData.coords?.lng || null,
      gpsLocation: locationAddress || null,
      checkinTime: formData.type === 'checkin' ? formData.timestamp : null,
      checkoutTime: formData.type === 'checkout' ? formData.timestamp : null,
      notes: formData.comments
    };
    
    console.log('Sending payload to API:', payload);
    return this.apiService.post<any>(ENDPOINTS.ASSISTANT_OPERATIONS.BASE, payload);
  }

  // Get operation history (check-in/check-out records) for an order
  getOperationHistory(orderId: number, assistantId: number): Observable<TimelineEntry[]> {
    const url = `${ENDPOINTS.ASSISTANT_OPERATIONS.BASE}?orderId=${orderId}&assistantId=${assistantId}`;
    console.log('Fetching operation history from:', url);
    
    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('Operation history raw response:', response);
        const data = response?.data || response || [];
        
        // Map API response to TimelineEntry array
        const timeline: TimelineEntry[] = [];
        
        data.forEach((record: any) => {
          // Add check-in entry if exists
          if (record.checkinTime) {
            timeline.push({
              when: record.checkinTime,
              type: 'Check In',
              comments: record.notes || '',
              coords: record.gpsLatitude && record.gpsLongitude ? {
                lat: record.gpsLatitude,
                lng: record.gpsLongitude
              } : null,
              gpsLocation: record.gpsLocation || null
            });
          }
          
          // Add check-out entry if exists
          if (record.checkoutTime) {
            timeline.push({
              when: record.checkoutTime,
              type: 'Check Out',
              comments: record.notes || '',
              coords: record.gpsLatitude && record.gpsLongitude ? {
                lat: record.gpsLatitude,
                lng: record.gpsLongitude
              } : null,
              gpsLocation: record.gpsLocation || null
            });
          }
        });
        
        // Sort by timestamp descending (newest first)
        return timeline.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
      })
    );
  }

  // Get current assistant's operation status for a specific order
  getAssistantOperationStatus(orderId: number, assistantId: number): Observable<{ hasCheckedIn: boolean; hasCheckedOut: boolean }> {
    const url = `${ENDPOINTS.ASSISTANT_OPERATIONS.BASE}?orderId=${orderId}&assistantId=${assistantId}`;
    
    return this.apiService.get<any>(url).pipe(
      map(response => {
        const data = response?.data || response || [];
        
        // Check if there's any record with checkinTime or checkoutTime
        const hasCheckedIn = data.some((record: any) => record.checkinTime !== null);
        const hasCheckedOut = data.some((record: any) => record.checkoutTime !== null);
        
        return { hasCheckedIn, hasCheckedOut };
      })
    );
  }

  // Assign assistant to order
  assignAssistant(formData: AssignAssistantFormData): Observable<any> {
    console.log('Assigning assistant:', formData);
    const endpoint = ENDPOINTS.ASSISTANT_ASSIGNMENTS.ASSIGN;
    
    return this.apiService.post<any>(endpoint, formData);
  }

  // Get full order details by order ID
  getOrderDetails(orderId: number): Observable<OrderDetail> {
    const url = `${ENDPOINTS.ORDERS.LIST}/${orderId}`;
    console.log('Fetching order details from:', url);
    
    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('Order details raw response:', response);
        const data = response?.data || response;
        return data;
      })
    );
  }

  // Capture GPS coordinates with maximum accuracy
  captureCoordinates(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return resolve(null);
      }

      // High accuracy options for best GPS precision
      const options: PositionOptions = {
        enableHighAccuracy: true,  // Use GPS instead of network/WiFi
        timeout: 15000,            // Increased timeout for better accuracy
        maximumAge: 0              // Don't use cached position, get fresh location
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('GPS coordinates captured:', coords);
          console.log('Accuracy:', position.coords.accuracy, 'meters');
          console.log('Altitude:', position.coords.altitude);
          console.log('Altitude Accuracy:', position.coords.altitudeAccuracy);
          resolve(coords);
        },
        (error) => {
          console.error('Error capturing GPS:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          resolve(null);
        },
        options
      );
    });
  }
}
