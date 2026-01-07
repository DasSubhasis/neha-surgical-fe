import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent } from '../action-dropdown/action-dropdown.component';
import { ToastService } from '../../services/toast.service';
import { MaterialTransferService, MaterialTransfer, MaterialTransferFormData, MaterialDelivery, DeliveryUser } from '../../services/material-transfer.service';
import { OrderService, Order } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-material-delivery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    ActionDropdownComponent
  ],
  templateUrl: './material-delivery.component.html',
  styles: []
})
export class MaterialDeliveryComponent implements OnInit {
  // Data
  deliveries: MaterialDelivery[] = [];
  filteredDeliveries: MaterialDelivery[] = [];
  loading = false;
  hasError = false;

  // Search and Filter
  searchTerm = '';
  selectedStatus = 'All';
  statusOptions = ['All', 'Delivered', 'Assigned', 'Pending'];

  // Modals
  viewDeliveryRow: (MaterialDelivery & { itemsSummary: any[] }) | null = null;
  viewRowLoading = false;
  showMarkDeliveredModal = false;
  markDeliveredRemarks = '';
  markingDelivered = false;

  actionItems = [
    [
      {
        label: 'Refresh',
        icon: `<svg class="text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
        onClick: () => this.refreshData()
      }
    ],
    [
      {
        label: 'Export to CSV',
        icon: `<svg class="text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
        onClick: () => this.exportCSV()
      }
    ]
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private materialTransferService: MaterialTransferService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.hasError = false;

    this.materialTransferService.getMaterialDeliveries().subscribe({
      next: (data) => {
        this.deliveries = data;
        this.applyFilters();
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Error fetching material deliveries:', error);
        this.toastService.error('Failed to load material deliveries');
        this.loading = false;
        this.hasError = true;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.deliveries];

    // Apply status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(d => d.deliveryStatus === this.selectedStatus);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.orderNo.toLowerCase().includes(term) ||
        d.deliveredBy.toLowerCase().includes(term) ||
        d.deliveryDate.toLowerCase().includes(term)
      );
    }

    this.filteredDeliveries = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  refreshData(): void {
    this.toastService.info('Refreshing data...');
    this.fetchData();
  }

  viewOrderDetails(deliveryId: number): void {
    const delivery = this.deliveries.find(t => t.deliveryId === deliveryId);
    if (!delivery) return;

    this.viewRowLoading = true;

    this.orderService.getOrder(delivery.orderId).subscribe({
      next: (order: Order) => {
        // Combine itemGroups and items into itemsSummary
        const itemsSummary = [
          // Add item groups as items with isGroup flag
          ...(order.itemGroups || []).map(groupName => ({
            id: '',
            name: groupName,
            manual: false,
            isGroup: true
          })),
          // Add individual items
          ...(order.items || [])
        ];

        this.viewDeliveryRow = {
          ...delivery,
          itemsSummary: itemsSummary
        };
        this.viewRowLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error fetching order details:', error);
        this.toastService.error('Failed to load order details');
        this.viewRowLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeViewModal(): void {
    this.viewDeliveryRow = null;
  }

  exportCSV(): void {
    const headers = ['Order No', 'Delivery Date', 'Delivered By', 'Status'];
    const rows = this.filteredDeliveries.map(t => [
      t.orderNo,
      t.deliveryDate,
      t.deliveredBy,
      t.deliveryStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `material_deliveries_${this.getTodayDate()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('CSV exported successfully');
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openMarkDeliveredModal(): void {
    if (!this.viewDeliveryRow) return;
    
    // Only allow marking if status is not already 'Delivered'
    if (this.viewDeliveryRow.deliveryStatus === 'Delivered') {
      this.toastService.warning('This delivery is already marked as delivered');
      return;
    }

    this.showMarkDeliveredModal = true;
    this.markDeliveredRemarks = '';
  }

  closeMarkDeliveredModal(): void {
    this.showMarkDeliveredModal = false;
    this.markDeliveredRemarks = '';
  }

  confirmMarkDelivered(): void {
    if (!this.viewDeliveryRow) return;

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.toastService.error('User not authenticated');
      return;
    }

    const deliveredBy = currentUser.name || currentUser.email;
    const deliveryId = this.viewDeliveryRow.deliveryId;

    this.markingDelivered = true;

    this.materialTransferService.markMaterialDelivered(
      deliveryId,
      deliveredBy,
      this.markDeliveredRemarks || 'Delivery completed'
    ).subscribe({
      next: (response) => {
        this.toastService.success('Material delivery marked as delivered successfully');
        this.closeMarkDeliveredModal();
        this.closeViewModal();
        this.fetchData(); // Refresh the list
        this.markingDelivered = false;
      },
      error: (error) => {
        console.error('Error marking delivery:', error);
        this.toastService.error(error.message || 'Failed to mark delivery as delivered');
        this.markingDelivered = false;
      }
    });
  }
}
