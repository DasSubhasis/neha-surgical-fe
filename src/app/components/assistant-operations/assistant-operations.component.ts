import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  AssistantOperationsService, 
  AssistantOrder, 
  Assistant, 
  CheckInOutFormData, 
  AssignAssistantFormData,
  Coordinates,
  TimelineEntry,
  OrderDetail,
  OrderItem
} from '../../services/assistant-operations.service';
import { SubAssistantAssignmentService, SubAssistantAssignment, SubAssistantAssignmentFormData } from '../../services/sub-assistant-assignment.service';
import { ItemGroupService } from '../../services/item-group.service';
import { ItemService } from '../../services/item.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
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
  gpsAccuracy: number | null = null;
  checkForm: CheckInOutFormData & { coords: Coordinates | null; locationAddress?: string } = {
    orderId: 0,
    type: 'checkin',
    comments: '',
    coords: null,
    locationAddress: undefined,
    timestamp: new Date().toISOString()
  };
  
  viewRow: AssistantOrder | null = null;
  fullOrderDetails: OrderDetail | null = null;
  itemsSummary: any[] = [];
  isViewModalOpen = false;
  isProcessModalOpen = false;
  processOrderRow: AssistantOrder | null = null;
  isAssignModalOpen = false;
  isFilterModalOpen = false;
  expandedGroups: Map<string, boolean> = new Map();
  assignForm: AssignAssistantFormData = {
    orderId: 0,
    assistantId: 0,
    reportingTime: ''
  };
  
  searchTerm = '';
  filterStatus: 'Assigned' | 'In Operation' | 'Completed (Pre-Billing)' = 'Assigned';
  activeTab: 'Assigned' | 'In Operation' | 'Completed (Pre-Billing)' = 'Assigned';
  
  // Tab counts
  assignedCount: number = 0;
  inOperationCount: number = 0;
  completedCount: number = 0;
  
  // Sub-Assistant Assignment
  isSubAssignModalOpen = false;
  selectedOrderForSubAssign: AssistantOrder | null = null;
  subAssignments: SubAssistantAssignment[] = [];
  subAssignForm: SubAssistantAssignmentFormData = {
    assignmentId: 0,
    orderId: 0,
    subAssistantId: 0
  };
  isLoadingSubAssignments = false;
  
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
        label: 'Filter',
        icon: 'filter',
        onClick: () => this.openFilterModal()
      },
      {
        label: 'Refresh',
        icon: 'refresh',
        onClick: () => this.refreshData()
      }
    ]
  ];

  constructor(
    private assistantOpsService: AssistantOperationsService,
    private subAssistantService: SubAssistantAssignmentService,
    private itemGroupService: ItemGroupService,
    private itemService: ItemService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // Switch between tabs
  switchTab(tab: 'Assigned' | 'In Operation' | 'Completed (Pre-Billing)'): void {
    this.activeTab = tab;
    this.filterStatus = tab;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.toastService.error('User not authenticated');
      this.isLoading = false;
      return;
    }

    const assignedId = currentUser.systemUserId || 0;
    
    // Load orders filtered by status and assignedId
    this.assistantOpsService.getOrders(this.filterStatus, assignedId).subscribe({
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

    // Load counts for all tabs
    this.assistantOpsService.getOrders('Assigned', assignedId).subscribe({
      next: (orders) => {
        this.assignedCount = orders.length;
      },
      error: (error) => {
        console.error('Error loading assigned count:', error);
      }
    });

    this.assistantOpsService.getOrders('In Operation', assignedId).subscribe({
      next: (orders) => {
        this.inOperationCount = orders.length;
      },
      error: (error) => {
        console.error('Error loading in-operation count:', error);
      }
    });

    this.assistantOpsService.getOrders('Completed (Pre-Billing)', assignedId).subscribe({
      next: (orders) => {
        this.completedCount = orders.length;
      },
      error: (error) => {
        console.error('Error loading completed count:', error);
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

  // Filtered orders based on search (status filtering is handled by API)
  get filteredOrders(): AssistantOrder[] {
    if (!this.searchTerm.trim()) {
      return this.orders;
    }
    
    return this.orders.filter(order => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.hospitalName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.doctorName.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });
  }

  // Handle status filter change - refetch data from API
  onStatusFilterChange(): void {
    this.loadData();
  }

  // Filter Modal Methods
  openFilterModal(): void {
    this.isFilterModalOpen = true;
  }

  closeFilterModal(): void {
    this.isFilterModalOpen = false;
  }

  applyAndCloseFilter(): void {
    this.loadData();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'Assigned';
    this.loadData();
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchTerm.trim()) count++;
    if (this.filterStatus !== 'Assigned') count++;
    return count;
  }

  // Get assistant name by ID
  getAssistantName(assistantId: number | null): string {
    if (!assistantId) return 'Not Assigned';
    const assistant = this.assistants.find(a => a.id === assistantId);
    return assistant ? assistant.name : 'Not Assigned';
  }

  // Open check-in/out modal
  async openCheckModal(order: AssistantOrder, type: 'checkin' | 'checkout'): Promise<void> {
    this.selectedOrderRow = order;
    this.gpsAccuracy = null;
    this.checkForm = {
      orderId: order.id,
      type,
      comments: '',
      coords: null,
      timestamp: new Date().toISOString()
    };
    this.isCheckModalOpen = true;
    
    // Capture GPS coordinates immediately when modal opens
    try {
      const position = await this.getHighAccuracyPosition();
      if (position) {
        this.checkForm.coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.gpsAccuracy = position.coords.accuracy;
        console.log('GPS captured with accuracy:', this.gpsAccuracy, 'meters');
        
        // Fetch address from coordinates
        this.checkForm.locationAddress = 'Fetching address...';
        this.cdr.detectChanges();
        
        const address = await this.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        this.checkForm.locationAddress = address;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('Failed to capture GPS:', error);
      this.toastService.warning('GPS location could not be captured');
    }
  }

  // Reverse geocode coordinates to get address
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NehasurgicalApp/1.0' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Address unavailable';
    }
  }

  // Get high accuracy GPS position
  private getHighAccuracyPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,  // Force GPS usage
        timeout: 15000,            // 15 seconds timeout
        maximumAge: 0              // No cached data
      };

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.error('GPS Error:', error.message);
          resolve(null);
        },
        options
      );
    });
  }

  // Retry GPS capture for better accuracy
  async retryGPSCapture(): Promise<void> {
    this.gpsAccuracy = null;
    this.checkForm.coords = null;
    this.checkForm.locationAddress = undefined;
    this.cdr.detectChanges();
    
    this.toastService.info('Recapturing GPS location...');
    
    try {
      const position = await this.getHighAccuracyPosition();
      if (position) {
        this.checkForm.coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.gpsAccuracy = position.coords.accuracy;
        
        // Fetch address from coordinates
        this.checkForm.locationAddress = 'Fetching address...';
        this.cdr.detectChanges();
        
        const address = await this.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        this.checkForm.locationAddress = address;
        
        if (this.gpsAccuracy && this.gpsAccuracy <= 50) {
          this.toastService.success('GPS captured with good accuracy');
        } else {
          this.toastService.warning('GPS accuracy is still poor. Ensure GPS is enabled and you are outdoors.');
        }
      } else {
        this.toastService.error('Failed to capture GPS location');
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('GPS retry failed:', error);
      this.toastService.error('GPS capture failed');
    }
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

    // Get current user's assistant ID
    const currentUser = this.authService.currentUser;
    if (!currentUser || !currentUser.systemUserId) {
      this.toastService.error('User not authenticated');
      return;
    }

    this.isSaving = true;

    try {
      // Update timestamp to current time
      this.checkForm.timestamp = new Date().toISOString();

      // Record check-in/out with assistantId and location address
      this.assistantOpsService.recordCheckInOut(
        this.checkForm, 
        currentUser.systemUserId,
        this.checkForm.locationAddress
      ).subscribe({
        next: (response) => {
          console.log('Check-in/out response:', response);
          
          const message = this.checkForm.type === 'checkin' 
            ? 'Checked in successfully' 
            : 'Checked out successfully';
          this.toastService.success(message);
          
          this.isCheckModalOpen = false;
          this.selectedOrderRow = null;
          this.isSaving = false;
          
          // Refresh data to update tabs and counts
          this.loadData();
          
          // Update the processOrderRow with fresh status if modal is still open
          if (this.isProcessModalOpen && this.processOrderRow && currentUser?.systemUserId) {
            this.assistantOpsService.getAssistantOperationStatus(
              this.processOrderRow.id, 
              currentUser.systemUserId
            ).subscribe({
              next: (status) => {
                if (this.processOrderRow) {
                  this.processOrderRow = {
                    ...this.processOrderRow,
                    hasCheckedIn: status.hasCheckedIn,
                    hasCheckedOut: status.hasCheckedOut
                  };
                  console.log('Refreshed processOrderRow status after check-in/out:', status);
                  this.cdr.detectChanges();
                }
              },
              error: (error) => {
                console.error('Error refreshing status:', error);
              }
            });
            
            // Also refresh the timeline
            this.assistantOpsService.getOperationHistory(
              this.processOrderRow.id, 
              currentUser.systemUserId
            ).subscribe({
              next: (timeline) => {
                if (this.processOrderRow) {
                  this.processOrderRow = {
                    ...this.processOrderRow,
                    timeline: timeline
                  };
                  this.cdr.detectChanges();
                }
              },
              error: (error) => {
                console.error('Error refreshing timeline:', error);
              }
            });
          }
          
          // Force change detection
          this.cdr.detectChanges();
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
        coords: formData.coords,
        gpsLocation: this.checkForm.locationAddress || null
      };

      const updatedOrder = {
        ...order,
        timeline: [...order.timeline, newTimelineEntry],
        visited: formData.type === 'checkin' ? true : order.visited,
        status: formData.type === 'checkin' 
          ? 'In Operation' as const
          : 'Completed (Pre-Billing)' as const
      };

      // Also update processOrderRow if it's the same order
      if (this.processOrderRow && this.processOrderRow.id === formData.orderId) {
        this.processOrderRow = updatedOrder;
      }

      return updatedOrder;
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
    this.fullOrderDetails = null;
    this.itemsSummary = [];
    this.isViewModalOpen = true;
    
    // Fetch full order details from API
    this.assistantOpsService.getOrderDetails(order.id).subscribe({
      next: (details) => {
        console.log('Full order details received:', details);
        this.fullOrderDetails = details;
        
        // Build items summary with groups and their items (same as material-transfer)
        if (details.itemGroups && details.itemGroups.length > 0) {
          // Fetch all item groups to get their IDs
          this.itemGroupService.getAllItemGroups('Y').subscribe({
            next: (allGroups: any[]) => {
              // Create requests to fetch items for each group
              const groupItemRequests = details.itemGroups.map(groupName => {
                const matchingGroup = allGroups.find((g: any) => g.name === groupName);
                if (matchingGroup) {
                  return this.itemService.getItemsByItemGroup(matchingGroup.itemGroupId).pipe(
                    map((items: any[]) => ({
                      groupName,
                      items: items.map((item: any) => ({
                        id: String(item.itemId),
                        name: item.name,
                        manual: false,
                        isGroup: false
                      }))
                    })),
                    catchError(() => of({ groupName, items: [] }))
                  );
                }
                return of({ groupName, items: [] });
              });

              // Wait for all group items to be fetched
              if (groupItemRequests.length > 0) {
                forkJoin(groupItemRequests).subscribe({
                  next: (groupsWithItems) => {
                    // Build the items summary with groups and their items
                    const groupedItems = groupsWithItems.map(gwi => ({
                      id: '',
                      name: gwi.groupName,
                      manual: false,
                      isGroup: true,
                      items: gwi.items
                    }));

                    // Add manual items as standalone (items not in groups)
                    const standaloneItems = (details.items || []).filter(item => item.manual);

                    // Combine groups and standalone items
                    this.itemsSummary = [...groupedItems, ...standaloneItems];
                    console.log('Items summary built:', this.itemsSummary);
                  },
                  error: (error: any) => {
                    console.error('Error fetching group items:', error);
                    // Fallback: show groups without items
                    const fallbackSummary = [
                      ...(details.itemGroups || []).map(groupName => ({
                        id: '',
                        name: groupName,
                        manual: false,
                        isGroup: true,
                        items: []
                      })),
                      ...(details.items || []).filter(item => item.manual)
                    ];
                    this.itemsSummary = fallbackSummary;
                  }
                });
              } else {
                // No groups, just show manual items
                this.itemsSummary = (details.items || []).filter(item => item.manual);
              }
            },
            error: (error: any) => {
              console.error('Error fetching item groups:', error);
              // Fallback without fetching items
              this.itemsSummary = (details.items || []).filter(item => item.manual);
            }
          });
        } else {
          // No groups, just show manual items
          this.itemsSummary = (details.items || []).filter(item => item.manual);
        }
      },
      error: (error) => {
        console.error('Error fetching order details:', error);
        this.toastService.error('Failed to load order details');
      }
    });
  }

  // Show process history (check-in/check-out)
  viewProcessHistory(order: AssistantOrder): void {
    console.log('Opening process modal for order:', order);
    console.log('Order status:', order.status);
    this.processOrderRow = { ...order }; // Create a copy to avoid reference issues
    this.isProcessModalOpen = true;
    
    // Fetch operation history and status from API
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.systemUserId) {
      // Fetch both timeline and current status
      this.assistantOpsService.getOperationHistory(order.id, currentUser.systemUserId).subscribe({
        next: (timeline) => {
          // Update the processOrderRow with fetched timeline
          if (this.processOrderRow) {
            this.processOrderRow = {
              ...this.processOrderRow,
              timeline: timeline
            };
          }
        },
        error: (error) => {
          console.error('Error fetching operation history:', error);
          this.toastService.error('Failed to load operation history');
        }
      });
      
      // Fetch current assistant's operation status
      this.assistantOpsService.getAssistantOperationStatus(order.id, currentUser.systemUserId).subscribe({
        next: (status) => {
          // Update hasCheckedIn and hasCheckedOut based on actual API data
          if (this.processOrderRow) {
            this.processOrderRow = {
              ...this.processOrderRow,
              hasCheckedIn: status.hasCheckedIn,
              hasCheckedOut: status.hasCheckedOut
            };
            console.log('Updated processOrderRow with status:', this.processOrderRow);
            console.log('hasCheckedIn:', status.hasCheckedIn, 'hasCheckedOut:', status.hasCheckedOut);
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error fetching operation status:', error);
          this.toastService.error('Failed to load operation status');
        }
      });
    }
  }

  // Close view modal
  closeViewModal(): void {
    this.viewRow = null;
    this.fullOrderDetails = null;
    this.itemsSummary = [];
    this.isViewModalOpen = false;
    this.expandedGroups.clear(); // Reset expanded state
  }

  // Close process modal
  closeProcessModal(): void {
    this.processOrderRow = null;
    this.isProcessModalOpen = false;
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
    const hours24 = d.getHours();
    const hours = String(hours24).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    if (format === 'DD MMM YYYY') {
      return `${day} ${month} ${year}`;
    } else if (format === 'DD-MMM-YYYY hh:mm AM/PM') {
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const displayHours = hours24 % 12 || 12;
      return `${day}-${month}-${year} ${displayHours}:${minutes} ${ampm}`;
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

  // Format operation date and time together
  formatOperationDateTime(dateStr: string, timeStr?: string): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      if (timeStr) {
        // Parse time string (assuming HH:mm format)
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = String(minutes).padStart(2, '0');
        
        return `${day}-${month}-${year} ${String(displayHours).padStart(2, '0')}:${displayMinutes} ${ampm}`;
      }
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateStr;
    }
  }

  // ============ Sub-Assistant Assignment Methods ============
  
  // Open sub-assistant assignment modal
  openSubAssignModal(order: AssistantOrder): void {
    this.selectedOrderForSubAssign = order;
    this.isSubAssignModalOpen = true;
    
    // Reset form
    this.subAssignForm = {
      assignmentId: 0, // Will be set from API response if needed
      orderId: order.id,
      subAssistantId: 0
    };
    
    // Load existing sub-assignments for this order
    this.loadSubAssignments(order.id);
  }

  // Close sub-assistant modal
  closeSubAssignModal(): void {
    this.isSubAssignModalOpen = false;
    this.selectedOrderForSubAssign = null;
    this.subAssignments = [];
    this.subAssignForm = {
      assignmentId: 0,
      orderId: 0,
      subAssistantId: 0
    };
  }

  // Load sub-assignments for an order
  loadSubAssignments(orderId: number): void {
    this.isLoadingSubAssignments = true;
    this.subAssistantService.getSubAssistantAssignments(orderId).subscribe({
      next: (assignments) => {
        console.log('Sub-assignments loaded:', assignments);
        this.subAssignments = assignments;
        this.isLoadingSubAssignments = false;
        
        // Set assignmentId if we have assignments
        if (assignments.length > 0) {
          this.subAssignForm.assignmentId = assignments[0].assignmentId;
        }
      },
      error: (error) => {
        console.error('Error loading sub-assignments:', error);
        this.toastService.error(error.message || 'Failed to load sub-assistants');
        this.isLoadingSubAssignments = false;
      }
    });
  }

  // Assign sub-assistant
  assignSubAssistant(): void {
    if (!this.subAssignForm.subAssistantId) {
      this.toastService.error('Please select a sub-assistant');
      return;
    }

    // Check for duplicate sub-assistant assignments
    const isDuplicate = this.subAssignments.some(
      sa => sa.subAssistantId === this.subAssignForm.subAssistantId
    );
    if (isDuplicate) {
      this.toastService.error('This assistant is already assigned to this order');
      return;
    }

    this.isSaving = true;
    
    // If we don't have assignmentId yet, we need to get it
    // For now, we'll send 0 and let the backend handle it
    const formData: SubAssistantAssignmentFormData = {
      ...this.subAssignForm,
      assignmentId: this.subAssignForm.assignmentId || 0
    };

    this.subAssistantService.assignSubAssistant(formData).subscribe({
      next: (response) => {
        console.log('Sub-assistant assigned:', response);
        this.toastService.success('Sub-assistant assigned successfully');
        
        // Reload sub-assignments
        this.loadSubAssignments(this.subAssignForm.orderId);
        
        // Reset sub-assistant selection
        this.subAssignForm.subAssistantId = 0;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error assigning sub-assistant:', error);
        this.toastService.error(error.message || 'Failed to assign sub-assistant');
        this.isSaving = false;
      }
    });
  }

  // Unassign sub-assistant
  unassignSubAssistant(subAssignment: SubAssistantAssignment): void {
    if (!confirm(`Are you sure you want to remove ${subAssignment.subAssistantName} from this order?`)) {
      return;
    }

    this.subAssistantService.unassignSubAssistant(subAssignment.subAssignmentId).subscribe({
      next: (response) => {
        console.log('Sub-assistant unassigned:', response);
        this.toastService.success('Sub-assistant removed successfully');
        
        // Reload sub-assignments
        this.loadSubAssignments(subAssignment.orderId);
      },
      error: (error) => {
        console.error('Error unassigning sub-assistant:', error);
        this.toastService.error(error.message || 'Failed to remove sub-assistant');
      }
    });
  }

  // Get available assistants for sub-assignment (exclude main assistant)
  get availableSubAssistants(): Assistant[] {
    if (!this.selectedOrderForSubAssign) {
      return this.assistants;
    }
    
    // Exclude the main assistant from the list
    return this.assistants.filter(
      assistant => assistant.id !== this.selectedOrderForSubAssign?.assignedAssistantId
    );
  }

  // Toggle group expansion
  toggleGroup(groupName: string): void {
    const isExpanded = this.expandedGroups.get(groupName) || false;
    this.expandedGroups.set(groupName, !isExpanded);
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups.get(groupName) || false;
  }

  getGroupItems(item: any): any[] {
    // Return items array from the group object (same as material-transfer)
    return item.items || [];
  }

  getIndividualItems(): any[] {
    // Return items that don't belong to any group (not isGroup items)
    return this.itemsSummary.filter(item => !item.isGroup);
  }

  hasItemGroups(): boolean {
    return this.itemsSummary && this.itemsSummary.some((item: any) => item.isGroup);
  }
}

