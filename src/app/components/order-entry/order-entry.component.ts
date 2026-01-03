import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { OrderService, Order, OrderFormData, OrderItem, ItemGroup } from '../../services/order.service';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { HospitalService, Hospital } from '../../services/hospital.service';
import { ItemGroupService, ItemGroup as ItemGroupType } from '../../services/item-group.service';
import { ItemService, Item } from '../../services/item.service';
import { UserService } from '../../services/user.service';
import { ConfigService } from '../../services/config.service';
import { ToastService } from '../../services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-order-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent, SearchableDropdownComponent],
  templateUrl: './order-entry.component.html',
  styles: [`
    :host ::ng-deep .ag-header-small-font .ag-header-cell-label {
      font-size: 12px !important;
      font-weight: 500 !important;
    }
    :host ::ng-deep .ag-center-aligned-header .ag-header-cell-label {
      justify-content: center !important;
    }
  `]
})
export class OrderEntryComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  orders: Order[] = [];
  doctors: Doctor[] = [];
  hospitals: Hospital[] = [];
  itemGroups: ItemGroupType[] = [];
  allItems: Item[] = [];
  
  loading: boolean = false;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingOrder: Order | null = null;
  viewOrder: Order | null = null;
  viewGroupItemsData: ItemGroup | null = null;

  // Form data
  formData: OrderFormData = {
    orderDate: this.getCurrentDate(),
    doctorId: null,
    hospitalId: null,
    operationDate: this.getCurrentDate(),
    operationTime: '09:00',
    materialSendDate: this.getCurrentDate(),
    itemGroups: [],
    items: [],
    remarks: '',
    createdBy: 'current.user@example.com'
  };

  // Items summary for modal
  itemsSummary: OrderItem[] = [];
  selectedItemGroupIds: (number | undefined)[] = [];
  selectedAdditionalItemId: number | null = null;

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  orderToDelete: Order | null = null;

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { 
      headerName: 'Order No', 
      field: 'orderNo', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      flex: 1, 
      minWidth: 140 
    },
    { 
      headerName: 'Order Date', 
      field: 'orderDate', 
      sortable: true, 
      filter: 'agDateColumnFilter', 
      width: 120, 
      minWidth: 120,
      valueFormatter: (params: any) => this.formatDate(params.value)
    },
    { 
      headerName: 'Doctor', 
      field: 'doctorName', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      flex: 1, 
      minWidth: 150 
    },
    { 
      headerName: 'Hospital', 
      field: 'hospitalName', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      flex: 1, 
      minWidth: 150 
    },
    { 
      headerName: 'Op Date', 
      field: 'operationDate', 
      sortable: true, 
      filter: 'agDateColumnFilter', 
      width: 120, 
      minWidth: 120,
      valueFormatter: (params: any) => this.formatDate(params.value)
    },
    { 
      headerName: 'Material Send', 
      field: 'materialSendDate', 
      sortable: true, 
      filter: 'agDateColumnFilter', 
      width: 130,
      minWidth: 130,
      valueFormatter: (params: any) => this.formatDate(params.value)
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      width: 100, 
      minWidth: 100,
      cellRenderer: (params: any) => {
        const status = params.value;
        let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full ';
        
        if (status === 'Draft') {
          className += 'bg-yellow-100 text-yellow-800';
        } else if (status === 'Sent') {
          className += 'bg-green-100 text-green-800';
        } else {
          className += 'bg-gray-100 text-gray-800';
        }
        
        const span = document.createElement('span');
        span.className = className;
        span.textContent = status;
        return span;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 120,
      minWidth: 120,
      maxWidth: 120,
      resizable: false,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
      headerClass: 'ag-center-aligned-header ag-header-small-font',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-center w-full h-full space-x-1';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'flex items-center justify-center text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200';
        editBtn.title = 'Edit';
        editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`;
        editBtn.addEventListener('click', () => this.handleEdit(params.data));

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="#52a447" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.addEventListener('click', () => this.handleView(params.data));

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'flex items-center justify-center text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
        deleteBtn.addEventListener('click', () => this.confirmDelete(params.data));

        container.appendChild(editBtn);
        container.appendChild(viewBtn);
        container.appendChild(deleteBtn);
        
        return container;
      }
    }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
    headerClass: 'ag-header-small-font'
  };

  actionItems: ActionItem[][] = [
    [
      {
        label: 'Add New Order',
        icon: 'add',
        onClick: () => this.handleCreate()
      },
      {
        label: 'Refresh',
        icon: 'refresh',
        onClick: () => this.fetchOrders()
      }
    ],
    [
      {
        label: 'Export to Excel',
        icon: 'export',
        onClick: () => this.handleExportCSV()
      }
    ]
  ];

  constructor(
    private orderService: OrderService,
    private doctorService: DoctorService,
    private hospitalService: HospitalService,
    private itemGroupService: ItemGroupService,
    private itemService: ItemService,
    private userService: UserService,
    private configService: ConfigService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchOrders();
    this.fetchDoctors();
    this.fetchHospitals();
    this.fetchItemGroups();
    this.fetchAllItems();
  }

  private getCurrentDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  formatTime(timeString: string | undefined): string {
    if (!timeString) return '';
    return timeString;
  }

  getItemGroupNames(itemGroupNames: string[]): string {
    if (!itemGroupNames || itemGroupNames.length === 0) return 'N/A';
    return itemGroupNames.join(', ');
  }

  fetchOrders(): void {
    this.loading = true;
    this.hasError = false;
    
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
        if (this.gridReady && this.gridApi) {
          this.gridApi.setGridOption('rowData', this.orders);
        }
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.errorMessage = error.message || 'Failed to load orders. Please try again.';
        this.hasError = true;
        this.loading = false;
      }
    });
  }

  fetchDoctors(): void {
    this.doctorService.getAllDoctors('Y').subscribe({
      next: (data) => {
        this.doctors = data;
      },
      error: (error) => {
        console.error('Error fetching doctors:', error);
      }
    });
  }

  fetchHospitals(): void {
    this.hospitalService.getAllHospitals('Y').subscribe({
      next: (data) => {
        this.hospitals = data;
      },
      error: (error) => {
        console.error('Error fetching hospitals:', error);
      }
    });
  }

  fetchItemGroups(): void {
    this.itemGroupService.getAllItemGroups('Y').subscribe({
      next: (data) => {
        this.itemGroups = data;
      },
      error: (error) => {
        console.error('Error fetching item groups:', error);
      }
    });
  }

  fetchAllItems(): void {
    this.itemService.getAllItems(true).subscribe({
      next: (data) => {
        this.allItems = data;
      },
      error: (error) => {
        console.error('Error fetching all items:', error);
      }
    });
  }

  retryFetch(): void {
    this.fetchOrders();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridReady = true;
    params.api.sizeColumnsToFit();
  }

  handleCreate(): void {
    this.editingOrder = null;
    this.formData = {
      orderDate: this.getCurrentDate(),
      doctorId: null,
      hospitalId: null,
      operationDate: this.getCurrentDate(),
      operationTime: '09:00',
      materialSendDate: this.getCurrentDate(),
      itemGroups: [],
      items: [],
      remarks: '',
      createdBy: 'current.user@example.com'
    };
    this.itemsSummary = [];
    this.selectedItemGroupIds = [];
    this.isModalOpen = true;
  }

  handleEdit(order: Order): void {
    this.editingOrder = order;
    this.formData = {
      orderDate: order.orderDate,
      doctorId: order.doctorId,
      hospitalId: order.hospitalId,
      operationDate: order.operationDate,
      operationTime: order.operationTime,
      materialSendDate: order.materialSendDate,
      itemGroups: order.itemGroups || [],
      items: order.items || [],
      remarks: order.remarks || '',
      createdBy: order.createdBy || 'current.user@example.com'
    };
    this.itemsSummary = order.items || [];
    this.selectedItemGroupIds = (order.itemGroups || []).map(id => parseInt(id)).filter(id => !isNaN(id));
    this.isModalOpen = true;
  }

  handleView(order: Order): void {
    this.viewOrder = order;
  }

  confirmDelete(order: Order): void {
    this.orderToDelete = order;
    this.showDeleteConfirm = true;
  }

  handleDeleteOrder(): void {
    if (!this.orderToDelete) return;
    
    this.orderService.deleteOrder(this.orderToDelete.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.orders = this.orders.filter(o => o.id !== this.orderToDelete!.id);
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', this.orders);
          }
          this.showDeleteConfirm = false;
          this.orderToDelete = null;
          this.toastService.success('Order deleted successfully');
        } else {
          this.toastService.error(response.message || 'Failed to delete order');
        }
      },
      error: (error) => {
        console.error('Error deleting order:', error);
        this.toastService.error('Failed to delete order');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.orderToDelete = null;
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingOrder = null;
    this.resetForm();
  }

  closeViewOrder(): void {
    this.viewOrder = null;
  }

  resetForm(): void {
    this.formData = {
      orderDate: this.getCurrentDate(),
      doctorId: null,
      hospitalId: null,
      operationDate: this.getCurrentDate(),
      operationTime: '09:00',
      materialSendDate: this.getCurrentDate(),
      itemGroups: [],
      items: [],
      remarks: '',
      createdBy: 'current.user@example.com'
    };
    this.itemsSummary = [];
    this.selectedItemGroupIds = [];
  }

  onItemGroupSelectionChange(): void {
    // Fetch items for all selected item groups
    if (this.selectedItemGroupIds.length === 0) {
      // Keep only manual items if no item groups selected
      const manualRows = this.itemsSummary.filter(i => i.manual);
      this.itemsSummary = [...manualRows];
      this.formData.itemGroups = [];
      return;
    }

    // Fetch items for each selected item group
    const itemGroupRequests = this.selectedItemGroupIds.map(itemGroupId => 
      this.itemService.getItemsByItemGroup(itemGroupId!)
    );

    forkJoin(itemGroupRequests).subscribe({
      next: (itemGroupsItems: Item[][]) => {
        // Flatten all items from all item groups
        const allItems: OrderItem[] = [];
        
        itemGroupsItems.forEach((items, index) => {
          const itemGroupId = this.selectedItemGroupIds[index];
          items.forEach(item => {
            allItems.push({
              id: item.itemId?.toString() || item.id?.toString() || '',
              name: item.name,
              isGroup: false,
              manual: false
            });
          });
        });

        // Keep manual items
        const manualRows = this.itemsSummary.filter(i => i.manual);
        
        this.itemsSummary = [...allItems, ...manualRows];
        this.formData.itemGroups = this.selectedItemGroupIds.map(id => id?.toString() || '').filter(id => id);
      },
      error: (error) => {
        console.error('Error fetching item group items:', error);
        // Keep manual items on error
        const manualRows = this.itemsSummary.filter(i => i.manual);
        this.itemsSummary = [...manualRows];
      }
    });
  }

  addManualItem(): void {
    if (!this.selectedAdditionalItemId) return;
    
    // Check if item already exists in summary
    const exists = this.itemsSummary.some(item => 
      !item.manual && item.id === this.selectedAdditionalItemId!.toString()
    );
    if (exists) {
      this.selectedAdditionalItemId = null;
      return;
    }
    
    // Find the selected item from allItems
    const selectedItem = this.allItems.find(item => item.itemId === this.selectedAdditionalItemId);
    if (!selectedItem || !selectedItem.itemId) return;
    
    const manualItem: OrderItem = {
      id: selectedItem.itemId.toString(),
      name: selectedItem.name,
      isGroup: false,
      manual: true
    };
    
    this.itemsSummary.push(manualItem);
    this.selectedAdditionalItemId = null;
  }

  removeSummaryItem(id: string): void {
    this.itemsSummary = this.itemsSummary.filter(i => i.id !== id);
  }

  viewGroupItems(groupId: string): void {
    // Not applicable anymore since we're showing individual items
    // This method can be removed or left for future use
  }

  closeGroupItemsModal(): void {
    this.viewGroupItemsData = null;
  }

  onOperationDateChange(): void {
    if (!this.formData.operationDate) return;
    
    // Auto-set material send date to one day before operation date
    const opDate = new Date(this.formData.operationDate);
    opDate.setDate(opDate.getDate() - 1);
    
    const year = opDate.getFullYear();
    const month = String(opDate.getMonth() + 1).padStart(2, '0');
    const day = String(opDate.getDate()).padStart(2, '0');
    this.formData.materialSendDate = `${year}-${month}-${day}`;
  }

  handleSaveOrder(): void {
    if (!this.validateForm()) return;
    
    const orderData: OrderFormData = {
      ...this.formData,
      items: this.itemsSummary
    };
    
    if (this.editingOrder) {
      this.orderService.updateOrder(this.editingOrder.id, orderData).subscribe({
        next: (response) => {
          console.log('Update Order Response:', response);
          
          // Handle response - backend might return data directly or wrapped in ApiResponse
          let isSuccess = false;
          
          // Check if response has ApiResponse structure
          if (response && typeof response === 'object' && 'success' in response) {
            isSuccess = response.success === true;
          } else if (response && typeof response === 'object' && 'id' in response) {
            // Backend returned order directly without wrapper
            isSuccess = true;
          }
          
          if (isSuccess) {
            this.handleCloseModal();
            this.fetchOrders(); // Refresh grid with updated data
            this.toastService.success('Order updated successfully');
          } else {
            const errorMsg = (response as any)?.message || 'Failed to update order';
            console.warn('Update order failed:', { response, isSuccess });
            this.toastService.error(errorMsg);
          }
        },
        error: (error) => {
          console.error('Error updating order:', error);
          this.toastService.error(error.message || 'Failed to update order');
        }
      });
    } else {
      this.orderService.createOrder(orderData).subscribe({
        next: (response: any) => {
          console.log('Create Order Response:', response);
          
          // Handle response - backend might return data directly or wrapped in ApiResponse
          let isSuccess = false;
          
          // Check if response has ApiResponse structure with success field
          if (response && typeof response === 'object' && 'success' in response) {
            isSuccess = response.success === true;
          } 
          // Check if response has message and data fields (success pattern)
          else if (response && typeof response === 'object' && 'data' in response && 'message' in response) {
            isSuccess = true;
          } 
          // Backend returned order directly without wrapper
          else if (response && typeof response === 'object' && 'id' in response) {
            isSuccess = true;
          }
          
          if (isSuccess) {
            this.handleCloseModal();
            this.fetchOrders(); // Refresh grid with updated data
            this.toastService.success('Order created successfully');
          } else {
            const errorMsg = response?.message || 'Failed to create order';
            console.warn('Create order failed:', { response, isSuccess });
            this.toastService.error(errorMsg);
          }
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.toastService.error(error.message || 'Failed to create order');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.doctorId) {
      this.toastService.warning('Doctor is required');
      return false;
    }
    if (!this.formData.hospitalId) {
      this.toastService.warning('Hospital is required');
      return false;
    }
    if (!this.formData.operationDate) {
      this.toastService.warning('Operation Date is required');
      return false;
    }
    return true;
  }

  handleExportCSV(): void {
    const headers = ['Order No', 'Order Date', 'Doctor', 'Hospital', 'Op Date', 'Op Time', 'Material Send', 'Items', 'Remarks', 'Status'];
    const rows = this.orders.map(o => [
      o.orderNo,
      o.orderDate,
      o.doctorName,
      o.hospitalName,
      o.operationDate,
      o.operationTime,
      o.materialSendDate,
      o.items.map(i => i.name).join('; '),
      o.remarks || '',
      o.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${this.getCurrentDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate([`/${page}`]);
  }
}
