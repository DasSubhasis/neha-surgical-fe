import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  AssistantOperationsService, 
  AssistantOrder, 
  Assistant, 
  CheckInOutFormData, 
  AssignAssistantFormData,
  Coordinates,
  TimelineEntry 
} from '../../services/assistant-operations.service';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent } from '../action-dropdown/action-dropdown.component';

@Component({
  selector: 'app-assistant-operations',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './assistant-operations.component.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AssistantOperationsComponent implements OnInit {
  // Data
  orders: AssistantOrder[] = [];
  assistants: Assistant[] = [];
  
  // UI States
  selectedOrderRow: AssistantOrder | null = null;
  isCheckModalOpen = false;
  checkForm: CheckInOutFormData & { coords: Coordinates | null } = {
    orderId: 0,
    type: 'checkin',
    comments: '',
    coords: null,
    timestamp: new Date().toISOString()
  };
  
  viewRow: AssistantOrder | null = null;
  isAssignModalOpen = false;
  assignForm: AssignAssistantFormData = {
    orderId: 0,
    assistantId: 0,
    reportingTime: ''
  };
  
  searchTerm = '';
  filterStatus: 'all' | 'Scheduled' | 'In Operation' | 'Completed (Pre-Billing)' = 'all';
  
  // Loading states
  isLoading = false;
  isRefreshing = false;
  isSaving = false;

  // Pull to refresh states
  pullStartY = 0;
  pullDistance = 0;
  isPulling = false;
  pullThreshold = 80;

  // Action dropdown items
  actionItems = [
    [
      {
        label: 'Refresh',
        icon: `<svg class="text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>`,
        onClick: () => this.refreshData()
      }
    ]
  ];

  constructor(
    private assistantOpsService: AssistantOperationsService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load orders and assistants
    this.assistantOpsService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.toastService.error('Failed to load orders');
        this.isLoading = false;
      }
    });

    this.assistantOpsService.getAssistants().subscribe({
      next: (assistants) => {
        this.assistants = assistants;
      },
      error: (error) => {
        console.error('Error loading assistants:', error);
      }
    });
  }

  async refreshData(): Promise<void> {
    this.isRefreshing = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Minimum refresh time for UX
      this.loadData();
      this.toastService.success('Data refreshed!');
    } catch (error) {
      this.toastService.error('Failed to refresh data');
    } finally {
      this.isRefreshing = false;
    }
  }

  // Filtered orders based on search and status
  get filteredOrders(): AssistantOrder[] {
    return this.orders.filter(order => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.hospitalName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.doctorName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.filterStatus === 'all' || order.status === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Get assistant name by ID
  getAssistantName(assistantId: number | null): string {
    if (!assistantId) return 'Not Assigned';
    const assistant = this.assistants.find(a => a.id === assistantId);
    return assistant ? assistant.name : 'Not Assigned';
  }

  // Open check-in/out modal
  openCheckModal(order: AssistantOrder, type: 'checkin' | 'checkout'): void {
    this.selectedOrderRow = order;
    this.checkForm = {
      orderId: order.id,
      type,
      comments: '',
      coords: null,
      timestamp: new Date().toISOString()
    };
    this.isCheckModalOpen = true;
  }

  // Save check-in/out
  async handleCheckSave(): Promise<void> {
    if (!this.checkForm.orderId) {
      this.toastService.error('Order missing');
      return;
    }

    if (!this.checkForm.comments?.trim()) {
      this.toastService.error('Comments are required');
      return;
    }

    this.isSaving = true;

    try {
      // Capture GPS coordinates
      const coords = await this.assistantOpsService.captureCoordinates();
      this.checkForm.coords = coords;
      this.checkForm.timestamp = new Date().toISOString();

      // Record check-in/out
      this.assistantOpsService.recordCheckInOut(this.checkForm).subscribe({
        next: (response) => {
          // Update local order
          this.updateOrderAfterCheck(this.checkForm);
          
          const message = this.checkForm.type === 'checkin' 
            ? 'Checked in successfully' 
            : 'Checked out successfully';
          this.toastService.success(message);
          
          this.isCheckModalOpen = false;
          this.selectedOrderRow = null;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Check-in/out error:', error);
          this.toastService.error(error.message || 'Failed to record check-in/out');
          this.isSaving = false;
        }
      });
    } catch (error) {
      this.toastService.error('An error occurred');
      this.isSaving = false;
    }
  }

  // Update order after check-in/out
  private updateOrderAfterCheck(formData: CheckInOutFormData): void {
    this.orders = this.orders.map(order => {
      if (order.id !== formData.orderId) return order;

      const newTimelineEntry: TimelineEntry = {
        when: formData.timestamp,
        type: formData.type === 'checkin' ? 'Check In' : 'Check Out',
        comments: formData.comments,
        coords: formData.coords
      };

      return {
        ...order,
        timeline: [...order.timeline, newTimelineEntry],
        visited: formData.type === 'checkin' ? true : order.visited,
        status: formData.type === 'checkin' 
          ? 'In Operation' 
          : 'Completed (Pre-Billing)'
      };
    });
  }

  // Open assign assistant modal
  openAssignModal(order?: AssistantOrder): void {
    if (order) {
      this.assignForm = {
        orderId: order.id,
        assistantId: order.assignedAssistantId || 0,
        reportingTime: order.reportingTime || ''
      };
    } else {
      this.assignForm = {
        orderId: 0,
        assistantId: 0,
        reportingTime: ''
      };
    }
    this.isAssignModalOpen = true;
  }

  // Save assistant assignment
  handleAssignSave(): void {
    if (!this.assignForm.orderId || !this.assignForm.assistantId) {
      this.toastService.error('Order and assistant required');
      return;
    }

    this.isSaving = true;

    this.assistantOpsService.assignAssistant(this.assignForm).subscribe({
      next: (response) => {
        // Update local order
        this.orders = this.orders.map(order => 
          order.id === this.assignForm.orderId
            ? { 
                ...order, 
                assignedAssistantId: this.assignForm.assistantId,
                reportingTime: this.assignForm.reportingTime || order.reportingTime
              }
            : order
        );

        const assistantName = this.getAssistantName(this.assignForm.assistantId);
        this.toastService.success(`Assigned to ${assistantName}`);
        
        this.isAssignModalOpen = false;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Assignment error:', error);
        this.toastService.error(error.message || 'Failed to assign assistant');
        this.isSaving = false;
      }
    });
  }

  // View order details
  viewOrderDetails(order: AssistantOrder): void {
    this.viewRow = order;
  }

  // Close view modal
  closeViewModal(): void {
    this.viewRow = null;
  }

  // Get unique timeline entries by type
  getUniqueTimeline(order: AssistantOrder | null, type: 'checkin' | 'checkout'): TimelineEntry[] {
    if (!order || !Array.isArray(order.timeline)) return [];

    const normalizedType = type === 'checkin' ? 'Check In' : 'Check Out';
    const filtered = order.timeline.filter(t => t.type === normalizedType);

    // Remove duplicates
    const seen = new Set<string>();
    return filtered.filter(t => {
      const key = `${t.when}|${t.comments}|${t.coords?.lat || ''}|${t.coords?.lng || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Format date
  formatDate(date: string, format: string = 'DD MMM YYYY'): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    
    if (format === 'DD MMM YYYY') {
      return `${day} ${month} ${year}`;
    }
    return date;
  }

  // Format datetime
  formatDateTime(datetime: string, format: string = 'DD MMM YYYY'): string {
    const d = new Date(datetime);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    if (format === 'DD MMM YYYY') {
      return `${day} ${month} ${year}`;
    } else if (format === 'HH:mm') {
      return `${hours}:${minutes}`;
    } else if (format === 'YYYY-MM-DD HH:mm:ss') {
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return datetime;
  }

  // Get current timestamp
  getCurrentTimestamp(): string {
    return this.formatDateTime(new Date().toISOString(), 'YYYY-MM-DD HH:mm:ss');
  }
}
