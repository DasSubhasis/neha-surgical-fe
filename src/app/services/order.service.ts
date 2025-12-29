import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ApiResponse } from './api.service';

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
  orderNo: string;
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
  private orders: Order[] = [
    {
      id: 1,
      orderNo: 'ORD-2024-001',
      orderDate: '2024-12-20',
      doctorId: 1,
      doctorName: 'Dr. Rajesh Kumar',
      hospitalId: 1,
      hospitalName: 'Apollo Hospital',
      operationDate: '2024-12-25',
      operationTime: '10:00',
      materialSendDate: '2024-12-23',
      itemGroups: ['Orthopedic Implants', 'Surgical Instruments'],
      items: [
        { id: '1', name: 'Hip Replacement Kit', isGroup: true },
        { id: '2', name: 'Bone Saw', manual: true }
      ],
      remarks: 'Urgent surgery - patient is critical',
      createdBy: 'Admin',
      status: 'Pending',
      audits: [
        { when: '2024-12-20 09:00', by: 'Admin', action: 'Created' }
      ]
    },
    {
      id: 2,
      orderNo: 'ORD-2024-002',
      orderDate: '2024-12-21',
      doctorId: 2,
      doctorName: 'Dr. Priya Sharma',
      hospitalId: 2,
      hospitalName: 'Max Healthcare',
      operationDate: '2024-12-26',
      operationTime: '14:30',
      materialSendDate: '2024-12-24',
      itemGroups: ['Cardiology Equipment'],
      items: [
        { id: '3', name: 'Cardiac Stent Set', isGroup: true },
        { id: '4', name: 'Angioplasty Balloon', manual: true }
      ],
      remarks: 'Standard cardiac procedure',
      createdBy: 'Admin',
      status: 'Confirmed',
      audits: [
        { when: '2024-12-21 11:30', by: 'Admin', action: 'Created' },
        { when: '2024-12-21 15:00', by: 'Manager', action: 'Confirmed' }
      ]
    },
    {
      id: 3,
      orderNo: 'ORD-2024-003',
      orderDate: '2024-12-22',
      doctorId: 3,
      doctorName: 'Dr. Amit Patel',
      hospitalId: 1,
      hospitalName: 'Apollo Hospital',
      operationDate: '2024-12-27',
      operationTime: '09:00',
      materialSendDate: '2024-12-25',
      itemGroups: ['Neurosurgery Tools'],
      items: [
        { id: '5', name: 'Craniotomy Set', isGroup: true },
        { id: '6', name: 'Micro Scissors', manual: true }
      ],
      remarks: 'Brain tumor surgery',
      createdBy: 'Admin',
      status: 'Dispatched',
      audits: [
        { when: '2024-12-22 08:00', by: 'Admin', action: 'Created' },
        { when: '2024-12-22 10:00', by: 'Manager', action: 'Confirmed' },
        { when: '2024-12-23 14:00', by: 'Warehouse', action: 'Dispatched' }
      ]
    },
    {
      id: 4,
      orderNo: 'ORD-2024-004',
      orderDate: '2024-12-23',
      doctorId: 4,
      doctorName: 'Dr. Sunita Reddy',
      hospitalId: 3,
      hospitalName: 'Fortis Hospital',
      operationDate: '2024-12-28',
      operationTime: '11:00',
      materialSendDate: '2024-12-26',
      itemGroups: ['Laparoscopy Equipment'],
      items: [
        { id: '7', name: 'Laparoscopic Camera', isGroup: true },
        { id: '8', name: 'Grasping Forceps', manual: true }
      ],
      remarks: 'Minimally invasive surgery',
      createdBy: 'Admin',
      status: 'Completed',
      audits: [
        { when: '2024-12-23 09:00', by: 'Admin', action: 'Created' },
        { when: '2024-12-23 12:00', by: 'Manager', action: 'Confirmed' },
        { when: '2024-12-24 10:00', by: 'Warehouse', action: 'Dispatched' },
        { when: '2024-12-28 16:00', by: 'System', action: 'Completed' }
      ]
    }
  ];

  private itemGroups: ItemGroup[] = [
    {
      id: '1',
      name: 'Orthopedic Implants',
      items: [
        { id: '101', name: 'Hip Replacement Kit' },
        { id: '102', name: 'Knee Implant Set' },
        { id: '103', name: 'Spinal Cage System' }
      ]
    },
    {
      id: '2',
      name: 'Surgical Instruments',
      items: [
        { id: '201', name: 'Bone Saw' },
        { id: '202', name: 'Surgical Drill' },
        { id: '203', name: 'Retractor Set' }
      ]
    },
    {
      id: '3',
      name: 'Cardiology Equipment',
      items: [
        { id: '301', name: 'Cardiac Stent Set' },
        { id: '302', name: 'Angioplasty Balloon' },
        { id: '303', name: 'Guide Wire Kit' }
      ]
    },
    {
      id: '4',
      name: 'Neurosurgery Tools',
      items: [
        { id: '401', name: 'Craniotomy Set' },
        { id: '402', name: 'Micro Scissors' },
        { id: '403', name: 'Neural Electrode' }
      ]
    },
    {
      id: '5',
      name: 'Laparoscopy Equipment',
      items: [
        { id: '501', name: 'Laparoscopic Camera' },
        { id: '502', name: 'Grasping Forceps' },
        { id: '503', name: 'Trocar Set' }
      ]
    }
  ];

  private nextOrderId = 5;

  getOrders(): Observable<any[]> {
    return of([...this.orders]).pipe(delay(300));
  }

  getOrder(id: string | number): Observable<any> {
    const order = this.orders.find(o => o.id === Number(id));
    return of(order).pipe(delay(200));
  }

  createOrder(orderData: any): Observable<ApiResponse> {
    const newOrder: Order = {
      id: this.nextOrderId++,
      orderNo: `ORD-2024-${String(this.nextOrderId).padStart(3, '0')}`,
      ...orderData,
      status: 'Pending',
      audits: [
        { 
          when: new Date().toISOString(), 
          by: orderData.createdBy || 'Admin', 
          action: 'Created' 
        }
      ]
    };

    this.orders = [newOrder, ...this.orders];

    return of({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    }).pipe(delay(300));
  }

  updateOrder(id: string | number, orderData: any): Observable<ApiResponse> {
    const index = this.orders.findIndex(o => o.id === Number(id));
    
    if (index !== -1) {
      const updatedOrder: Order = {
        ...this.orders[index],
        ...orderData,
        audits: [
          ...this.orders[index].audits,
          { 
            when: new Date().toISOString(), 
            by: orderData.createdBy || 'Admin', 
            action: 'Updated' 
          }
        ]
      };
      
      this.orders[index] = updatedOrder;

      return of({
        success: true,
        data: updatedOrder,
        message: 'Order updated successfully'
      }).pipe(delay(300));
    }

    return of({
      success: false,
      message: 'Order not found'
    }).pipe(delay(300));
  }

  deleteOrder(id: string | number): Observable<ApiResponse> {
    const index = this.orders.findIndex(o => o.id === Number(id));
    
    if (index !== -1) {
      this.orders.splice(index, 1);
      
      return of({
        success: true,
        message: 'Order deleted successfully'
      }).pipe(delay(300));
    }

    return of({
      success: false,
      message: 'Order not found'
    }).pipe(delay(300));
  }

  getAllItemGroups(): Observable<ItemGroup[]> {
    return of([...this.itemGroups]).pipe(delay(200));
  }
}
