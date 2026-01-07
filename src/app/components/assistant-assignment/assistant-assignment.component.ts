import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { 
  AssistantAssignmentService, 
  AssistantAssignment, 
  Assistant, 
  ExistingAssignment 
} from '../../services/assistant-assignment.service';
import { OrderService, Order } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-assistant-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent, SearchableDropdownComponent],
  templateUrl: './assistant-assignment.component.html',
  styles: [`
    :host ::ng-deep .ag-header-small-font .ag-header-cell-label {
      font-size: 12px !important;
      font-weight: 500 !important;
    }
    :host ::ng-deep .ag-center-aligned-header .ag-header-cell-label {
      justify-content: center !important;
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
export class AssistantAssignmentComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  assignments: AssistantAssignment[] = [];
  assistants: Assistant[] = [];
  existingAssignments: ExistingAssignment[] = [];
  loading: boolean = false;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  viewRow: AssistantAssignment | null = null;
  viewRowLoading: boolean = false;
  isPendingOrdersModalOpen: boolean = false;

  // Pending orders for assignment
  pendingOrders: Order[] = [];
  viewPendingOrder: Order | null = null;
  viewPendingOrderLoading: boolean = false;
  private pendingGridApi!: GridApi;

  // Assignment modal states
  assignModalOpen: boolean = false;
  assigningOrder: Order | null = null;
  assignmentData: {
    assistantId: number | null;
    reportingDate: string;
    reportingTime: string;
    notes: string;
  } = {
    assistantId: null,
    reportingDate: this.getCurrentDate(),
    reportingTime: '09:00',
    notes: ''
  };

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Order No', field: 'orderNo', sortable: true, filter: 'agTextColumnFilter', minWidth: 170 },
    { headerName: 'Assistant Name', field: 'assistantName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 180 },
    { headerName: 'Reporting Time', field: 'reportingTime', sortable: true, filter: 'agTextColumnFilter', width: 140, minWidth: 140 },
    { 
      headerName: 'Remarks', 
      field: 'remarks', 
      sortable: false, 
      filter: false, 
      flex: 1, 
      minWidth: 180,
      tooltipField: 'remarks'
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 140,
      minWidth: 140,
      cellRenderer: (params: any) => {
        const container = document.createElement('span');
        if (params.value === 'Pending') {
          container.className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
        } else {
          container.className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
        }
        container.textContent = params.value;
        return container;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 90,
      minWidth: 90,
      maxWidth: 90,
      resizable: false,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
      headerClass: 'ag-center-aligned-header ag-header-small-font',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-center w-full h-full space-x-1';
        
        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="#52a447" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z" /></svg>`;
        viewBtn.addEventListener('click', () => {
          this.viewOrderDetails(params.data.id);
        });

        container.appendChild(viewBtn);
        
        return container;
      }
    }
  ];

  // Pending orders grid columns
  pendingOrdersColumnDefs: ColDef[] = [
    { headerName: 'Order No', field: 'orderNo', sortable: true, filter: 'agTextColumnFilter', width: 140 },
    { headerName: 'Doctor', field: 'doctorName', sortable: true, filter: 'agTextColumnFilter', width: 150 },
    { headerName: 'Hospital', field: 'hospitalName', sortable: true, filter: 'agTextColumnFilter', width: 150 },
    { headerName: 'Operation Date', field: 'operationDate', sortable: true, filter: 'agDateColumnFilter', width: 130 },
    { headerName: 'Operation Time', field: 'operationTime', sortable: true, filter: 'agTextColumnFilter', width: 130 },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 100,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
      headerClass: 'ag-center-aligned-header ag-header-small-font',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-center w-full h-full space-x-1';
        
        const assignBtn = document.createElement('button');
        assignBtn.className = 'flex items-center justify-center text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors duration-200';
        assignBtn.title = 'Assign Assistant';
        assignBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640"><path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"/></svg>`;
        assignBtn.addEventListener('click', () => this.openAssignModalFromGrid(params.data));
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View Details';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="#52a447" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.addEventListener('click', () => this.viewPendingOrderDetails(params.data));
        
        container.appendChild(assignBtn);
        container.appendChild(viewBtn);
        return container;
      }
    }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false
  };

  actionItems: ActionItem[][] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private assistantAssignmentService: AssistantAssignmentService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeActionItems();
    this.fetchData();
  }

  initializeActionItems(): void {
    this.actionItems = [
      [
        {
          label: 'Assign Assistant',
          icon: 'add',
          onClick: () => this.openPendingOrdersModal()
        },
        {
          label: 'Refresh',
          icon: 'refresh',
          onClick: () => this.fetchData()
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
  }

  fetchData(): void {
    this.loading = true;
    this.hasError = false;

    // Fetch only assigned orders for the main grid
    this.assistantAssignmentService.getAssignments('Assigned').subscribe({
      next: (data) => {
        // Filter to ensure we only show assigned orders
        this.assignments = data.filter(assignment => assignment.status === 'Assigned');
        this.loading = false;
        if (this.gridReady && this.gridApi) {
          this.gridApi.setGridOption('rowData', this.assignments);
        }
      },
      error: (error) => {
        console.error('Error fetching assignments:', error);
        this.errorMessage = error.message || 'Failed to load assignments. Please try again.';
        this.hasError = true;
        this.loading = false;
      }
    });

    // Load assistants
    this.assistantAssignmentService.getAssistants().subscribe({
      next: (data) => this.assistants = data,
      error: (error) => console.error('Error fetching assistants:', error)
    });
  }

  retryFetch(): void {
    this.fetchData();
  }

  openPendingOrdersModal(): void {
    this.isPendingOrdersModalOpen = true;
    this.fetchPendingOrders();
  }

  closePendingOrdersModal(): void {
    this.isPendingOrdersModalOpen = false;
    this.pendingOrders = [];
    this.viewPendingOrder = null;
  }

  fetchPendingOrders(): void {
    // Fetch only pending orders for the modal grid
    this.assistantAssignmentService.getAssignments('Pending').subscribe({
      next: (data) => {
        // Filter to ensure we only show pending (unassigned) orders
        this.pendingOrders = data.filter(order => order.status === 'Pending').map(assignment => ({
          id: assignment.id,
          orderNo: assignment.orderNo,
          orderDate: assignment.operationDate,
          doctorId: assignment.doctorId || 0,
          doctorName: assignment.doctorName || '',
          hospitalId: assignment.hospitalId || 0,
          hospitalName: assignment.hospitalName || '',
          operationDate: assignment.operationDate,
          operationTime: assignment.operationTime,
          materialSendDate: '',
          status: assignment.status,
          remarks: assignment.remarks,
          itemGroups: assignment.itemGroups || [],
          items: assignment.items || [],
          createdBy: '',
          audits: []
        }));
      },
      error: (error) => {
        console.error('Error fetching pending orders:', error);
        this.pendingOrders = [];
      }
    });
  }

  viewPendingOrderDetails(order: Order): void {
    // Show loading state
    this.viewPendingOrderLoading = true;
    
    // Fetch full order details immediately, don't show modal yet
    this.orderService.getOrder(order.id).subscribe({
      next: (fullOrder: Order) => {
        this.viewPendingOrder = fullOrder;
        this.viewPendingOrderLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error fetching order details:', error);
        this.toastService.error('Failed to load order details');
        this.viewPendingOrderLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    // Find the assignment data first
    const assignment = this.assignments.find(a => a.id === orderId);
    if (!assignment) return;

    // Show loading state
    this.viewRowLoading = true;
    
    // Fetch full order details immediately, don't show modal yet
    this.orderService.getOrder(orderId).subscribe({
      next: (order: Order) => {
        // Merge assignment data with order data and show modal
        this.viewRow = {
          ...assignment,
          itemGroups: order.itemGroups,
          items: order.items
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

  onPendingGridReady(params: GridReadyEvent): void {
    this.pendingGridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridReady = true;
    params.api.sizeColumnsToFit();
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate([`/${page}`]);
  }

  // Assignment modal methods for pending orders
  openAssignModalFromGrid(order: Order): void {
    this.assigningOrder = order;
    this.assignmentData = {
      assistantId: null,
      reportingDate: order.operationDate || this.getCurrentDate(),
      reportingTime: '09:00',
      notes: ''
    };
    this.assignModalOpen = true;
    this.closePendingOrdersModal(); // Close pending orders modal
  }

  closeAssignModalFromGrid(): void {
    this.assignModalOpen = false;
    this.assigningOrder = null;
    this.existingAssignments = [];
    this.assignmentData = {
      assistantId: null,
      reportingDate: this.getCurrentDate(),
      reportingTime: '09:00',
      notes: ''
    };
    // Reopen the pending orders modal
    this.openPendingOrdersModal();
  }

  onAssistantChangeFromGrid(): void {
    this.fetchExistingAssignmentsFromGrid();
  }

  onReportingDateChangeFromGrid(): void {
    this.fetchExistingAssignmentsFromGrid();
  }

  private fetchExistingAssignmentsFromGrid(): void {
    if (this.assignmentData.reportingDate) {
      this.assistantAssignmentService.getExistingAssignmentsByDate(
        this.assignmentData.assistantId,
        this.assignmentData.reportingDate
      ).subscribe({
        next: (assignments) => {
          this.existingAssignments = assignments;
        },
        error: (error) => {
          console.error('Error fetching existing assignments:', error);
          this.existingAssignments = [];
        }
      });
    } else {
      this.existingAssignments = [];
    }
  }

  handleAssignAssistantFromGrid(): void {
    if (!this.assignmentData.assistantId) {
      this.toastService.warning('Please select an assistant');
      return;
    }

    if (!this.assigningOrder) {
      return;
    }

    this.assistantAssignmentService.assignAssistant(
      this.assigningOrder.id,
      this.assignmentData.assistantId,
      this.assignmentData.reportingDate,
      this.assignmentData.reportingTime,
      this.assignmentData.notes,
      0
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(response.message || 'Assistant assigned successfully');
          this.closeAssignModalFromGrid();
          this.fetchData(); // Refresh assignments
          this.fetchPendingOrders(); // Refresh pending orders if modal is still open
        } else {
          this.toastService.error(response.message || 'Failed to assign assistant');
        }
      },
      error: (error) => {
        console.error('Error assigning assistant:', error);
        this.toastService.error('Failed to assign assistant');
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString;
  }

  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  handleExportCSV(): void {
    const headers = ['Order No', 'Patient', 'Op Date', 'Op Time', 'Assistant', 'Reporting Time', 'Remarks', 'Status'];
    const csvRows = this.assignments.map(r => [
      r.orderNo,
      r.patient,
      r.operationDate,
      r.operationTime,
      r.assistantName || '',
      r.reportingTime || '',
      (r.remarks || '').replace(/\n/g, ' '),
      r.status || ''
    ].map(c => `"${String(c ?? '')}"`).join(','));

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `assistant_assignments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Exported');
  }
}
