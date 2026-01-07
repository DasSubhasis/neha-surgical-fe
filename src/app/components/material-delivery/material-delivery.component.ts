import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent } from '../action-dropdown/action-dropdown.component';
import { ToastService } from '../../services/toast.service';
import { MaterialTransferService, MaterialTransfer, MaterialTransferFormData, MaterialDelivery, DeliveryUser } from '../../services/material-transfer.service';
import { OrderService, Order } from '../../services/order.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-material-delivery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    BreadcrumbComponent,
    ActionDropdownComponent
  ],
  templateUrl: './material-delivery.component.html',
  styles: [`
    :host ::ng-deep .ag-header-small-font .ag-header-cell-label {
      font-size: 12px !important;
      font-weight: 500 !important;
    }
    :host ::ng-deep .ag-overlay-no-rows-center {
      padding: 50px;
      font-size: 14px;
      color: #6b7280;
    }
    :host ::ng-deep .ag-root-wrapper {
      min-height: 400px;
    }
  `]
})
export class MaterialDeliveryComponent implements OnInit {
  // Grid data
  deliveries: MaterialDelivery[] = [];
  loading = false;
  hasError = false;

  // Modals
  viewDeliveryRow: (MaterialDelivery & { itemsSummary: any[] }) | null = null;
  viewRowLoading = false;

  // AG Grid configuration
  columnDefs: ColDef[] = [
    {
      headerName: 'Order No',
      field: 'orderNo',
      sortable: true,
      filter: 'agTextColumnFilter',
      minWidth: 130,
      flex: 1
    },
    {
      headerName: 'Delivery Date',
      field: 'deliveryDate',
      sortable: true,
      filter: 'agDateColumnFilter',
      minWidth: 120
    },
    {
      headerName: 'Delivered By',
      field: 'deliveredBy',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1,
      minWidth: 150
    },
    {
      headerName: 'Status',
      field: 'deliveryStatus',
      width: 130,
      cellRenderer: (params: any) => {
        const status = params.value;
        let colorClass = 'bg-gray-100 text-gray-800';
        
        if (status === 'Delivered') {
          colorClass = 'bg-green-100 text-green-800';
        } else if (status === 'Assigned') {
          colorClass = 'bg-blue-100 text-blue-800';
        } else if (status === 'Pending') {
          colorClass = 'bg-yellow-100 text-yellow-800';
        }
        
        return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">${status}</span>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 90,
      pinned: 'right',
      cellRenderer: (params: any) => {
        return `
          <div class="flex items-center justify-center h-full">
            <button class="view-delivery-btn flex items-center justify-center text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded" title="View Details">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640">
                <path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/>
              </svg>
            </button>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        if (target.closest('.view-delivery-btn')) {
          this.viewOrderDetails(params.data.deliveryId);
        }
      }
    }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false
  };

  gridOptions: GridOptions = {
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 25, 50],
    domLayout: 'normal',
    rowSelection: {
      mode: 'singleRow',
      enableClickSelection: false,
      checkboxes: false
    },
    animateRows: true,
    overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No records found</span>'
  };

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
    private router: Router
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
    const rows = this.deliveries.map(t => [
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

  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
