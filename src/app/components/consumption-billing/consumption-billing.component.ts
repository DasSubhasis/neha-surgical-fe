import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { 
  ConsumptionBillingService, 
  Order, 
  ConsumptionItem, 
  BillingItem, 
  Attachment,
  ItemGroup,
  Item 
} from '../../services/consumption-billing.service';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { ItemService, Item as ItemMaster } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';
import { ItemGroupService, ItemGroup as ItemGroupMaster } from '../../services/item-group.service';
import { SpecificationService, Specification } from '../../services/specification.service';
import { SizeService, Size } from '../../services/size.service';

ModuleRegistry.registerModules([AllCommunityModule]);

// Item Groups reference data
const ITEM_GROUPS: ItemGroup[] = [
  {
    id: "g1",
    name: "Spine Implants",
    items: [
      { id: "i1", name: "Pedicle Screws" },
      { id: "i2", name: "Polyaxial Screws" },
      { id: "i3", name: "Monoaxial Screws" },
      { id: "i4", name: "Cannulated Screws" },
      { id: "i5", name: "Cervical Screws" },
      { id: "i6", name: "Titanium Rods" },
      { id: "i7", name: "Cobalt-Chromium Rods" },
      { id: "i8", name: "PEEK Cages" },
      { id: "i9", name: "Titanium Cages" },
      { id: "i10", name: "Cervical Cages" },
      { id: "i11", name: "PLIF Cages" },
      { id: "i12", name: "TLIF Cages" },
      { id: "i13", name: "ALIF Cages" },
      { id: "i14", name: "OLIF Cages" },
      { id: "i15", name: "Expandable Cages" },
      { id: "i16", name: "Corpectomy Cages" },
    ],
  },
  {
    id: "g2",
    name: "Cervical Implants",
    items: [
      { id: "i17", name: "Anterior Cervical Plates" },
      { id: "i18", name: "Posterior Cervical Plates" },
      { id: "i19", name: "Standard Cervical Screws" },
      { id: "i20", name: "Variable Angle Screws" },
      { id: "i21", name: "Cervical Interbody Cages" },
      { id: "i22", name: "Cervical Disc Replacements" },
      { id: "i23", name: "Cervical Spacer" },
      { id: "i24", name: "Posterior Cervical Fixation Systems" },
      { id: "i25", name: "Cervical Hooks" },
    ],
  },
  {
    id: "g3",
    name: "Dorsolumbar Implants",
    items: [
      { id: "i26", name: "Pedicle Screw Systems" },
      { id: "i27", name: "Posterior Fixation Systems" },
      { id: "i28", name: "Lumbar Rods" },
      { id: "i29", name: "Thoracolumbar Plates" },
      { id: "i30", name: "TLIF Cages" },
      { id: "i31", name: "ALIF Cages" },
      { id: "i32", name: "PLIF Cages" },
      { id: "i33", name: "Expandable Lumbar Cages" },
      { id: "i34", name: "Vertebral Body Replacement Implants" },
    ],
  },
];

// Items by group mapping
const ITEMS_BY_GROUP: { [key: string]: Item[] } = {
  'g1': ITEM_GROUPS[0].items.map(it => ({ ...it, unit: 'pcs', group: 'g1' })),
  'g2': ITEM_GROUPS[1].items.map(it => ({ ...it, unit: 'pcs', group: 'g2' })),
  'g3': ITEM_GROUPS[2].items.map(it => ({ ...it, unit: 'pcs', group: 'g3' }))
};

@Component({
  selector: 'app-consumption-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, ActionDropdownComponent, SearchableDropdownComponent],
  templateUrl: './consumption-billing.component.html',
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
export class ConsumptionBillingComponent implements OnInit {
  // Data
  orders: Order[] = [];
  billableOrders: Order[] = [];
  availableItems: ItemMaster[] = [];
  selectedItemId: number | null = null;
  newItemQuantity: number = 1;

  // Cascading dropdown data
  itemGroupList: ItemGroupMaster[] = [];
  specificationList: Specification[] = [];
  sizeList: Size[] = [];
  filteredItems: any[] = [];

  // Selected filter values
  selectedItemGroupId: number | null = null;
  selectedSpecificationId: number | null = null;
  selectedSizeId: number | null = null;
  
  // Modal States
  isConsumptionModalOpen = false;
  isMapToBillingModalOpen = false;
  isBillingModalOpen = false;
  isPreviewModalOpen = false;
  isViewModalOpen = false;
  
  // Selected Data
  selectedOrder: Order | null = null;
  selectedItemGroups: string[] = [];
  consumptionItems: any[] = []; // Freshly added items for consumption
  uploadedImages: { file: File; preview: string }[] = []; // Images with preview URLs
  
  // Consumption Data
  consRows: ConsumptionItem[] = [];
  manualConsName = '';
  manualConsQty = 1;
  manualConsUnit = 'pcs';
  noConsumption = false;
  
  // Billing Data
  billRows: BillingItem[] = [];
  mappedConsumptionIds: Set<string> = new Set();
  manualBillName = '';
  manualBillQty = 1;
  manualBillRate = 0;
  
  // Common Data
  attachments: Attachment[] = [];
  remarks = '';
  
  // Loading States
  isLoading = false;
  isSaving = false;
  
  // AG Grid
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
  };

  // Action dropdown items
  actionItems: ActionItem[][] = [
    [
      {
        label: 'Refresh',
        icon: 'refresh',
        onClick: () => this.refreshData()
      }
    ]
  ];

  // Reference data
  itemGroups = ITEM_GROUPS;
  itemsByGroup = ITEMS_BY_GROUP;

  constructor(
    private consumptionBillingService: ConsumptionBillingService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private itemService: ItemService,
    private authService: AuthService,
    private itemGroupService: ItemGroupService,
    private specificationService: SpecificationService,
    private sizeService: SizeService
  ) {
    this.initializeColumnDefs();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadAvailableItems();
  }

  private initializeColumnDefs(): void {
    this.columnDefs = [
      { headerName: 'Doctor', field: 'doctorName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 150 },
      { headerName: 'Hospital', field: 'hospitalName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 150 },
      { headerName: 'Op Date', field: 'operationDate', sortable: true, filter: 'agDateColumnFilter', width: 120, minWidth: 120 },
      { headerName: 'Op Time', field: 'operationTime', sortable: true, filter: 'agTextColumnFilter', width: 100, minWidth: 100 },
      {
        headerName: 'Status',
        field: 'status',
        sortable: true,
        filter: 'agTextColumnFilter',
        width: 180,
        minWidth: 180,
        cellRenderer: (params: any) => {
          const status = params.value;
          let colorClass = 'bg-gray-100 text-gray-800';
          if (status === 'Completed (Not Billed)') colorClass = 'bg-yellow-100 text-yellow-800';
          else if (status === 'Completed') colorClass = 'bg-green-100 text-green-800';
          return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">${status}</span>`;
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
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
        headerClass: 'ag-center-aligned-header ag-header-small-font',
        cellRenderer: (params: any) => {
          const container = document.createElement('div');
          container.className = 'flex items-center justify-center w-full h-full space-x-1';
          
          // Consumption button
          const consBtn = document.createElement('button');
          consBtn.className = 'flex items-center justify-center text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded';
          consBtn.title = 'Consumption Entry';
          consBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
          consBtn.addEventListener('click', () => this.handleOpenConsumption(params.data));
          
          // View button
          const viewBtn = document.createElement('button');
          viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded';
          viewBtn.title = 'View';
          viewBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
          viewBtn.addEventListener('click', () => this.handleViewOrder(params.data));
          
          container.appendChild(consBtn);
          container.appendChild(viewBtn);
          
          return container;
        }
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.consumptionBillingService.getBillableOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.billableOrders = orders;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.toastService.error('Failed to load orders');
        this.isLoading = false;
      }
    });
  }

  refreshData(): void {
    this.toastService.info('Refreshed');
    this.loadData();
  }

  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }

  // ============ Consumption Entry Methods ============
  
  handleOpenConsumption(order: Order): void {
    this.selectedOrder = order;
    this.selectedItemGroups = order.itemGroups || [];
    this.consumptionItems = []; // Start with empty array for fresh items
    this.consRows = [];
    this.billRows = [];
    this.attachments = order.attachments || [];
    this.remarks = '';
    this.noConsumption = false;
    this.selectedItemGroupId = null;
    this.selectedSpecificationId = null;
    this.selectedSizeId = null;
    this.selectedItemId = null;
    this.newItemQuantity = 1;
    this.filteredItems = [];
    this.uploadedImages = [];
    this.isConsumptionModalOpen = true;
    this.loadCascadingDropdownData();
  }

  closeConsumptionModal(): void {
    this.isConsumptionModalOpen = false;
    this.selectedOrder = null;
    this.consRows = [];
    this.selectedItemGroups = [];
    this.consumptionItems = [];
    this.selectedItemGroupId = null;
    this.selectedSpecificationId = null;
    this.selectedSizeId = null;
    this.selectedItemId = null;
    this.newItemQuantity = 1;
    this.filteredItems = [];
    // Clean up blob URLs
    this.uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    this.uploadedImages = [];
  }

  removeOrderItem(index: number): void {
    this.consumptionItems = this.consumptionItems.filter((_, i) => i !== index);
  }

  loadAvailableItems(): void {
    this.itemService.getAllItems(true).subscribe({
      next: (items) => {
        this.availableItems = items;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.toastService.error('Failed to load items');
      }
    });
  }

  addNewItem(): void {
    if (!this.selectedItemId || !this.selectedOrder) {
      this.toastService.error('Please select an item');
      return;
    }

    const selectedItem = this.availableItems.find(item => item.id === this.selectedItemId || item.itemId === this.selectedItemId);
    if (!selectedItem) {
      this.toastService.error('Selected item not found');
      return;
    }

    // Check if item already exists
    const itemExists = this.consumptionItems.some(item => item.name === selectedItem.name);
    if (itemExists) {
      this.toastService.error('Item already exists in the list');
      return;
    }

    // Add item to the consumption items list
    const newItem = {
      id: String(selectedItem.id || selectedItem.itemId || 0),
      name: selectedItem.name,
      manual: true,
      isGroup: false,
      quantity: this.newItemQuantity || 1
    };

    this.consumptionItems.push(newItem);
    this.toastService.success('Item added successfully');
    
    // Reset form
    this.selectedItemId = null;
    this.newItemQuantity = 1;
  }

  validateQuantity(): void {
    this.newItemQuantity = Math.floor(Math.abs(this.newItemQuantity || 1));
    if (this.newItemQuantity < 1) {
      this.newItemQuantity = 1;
    }
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Validate file types (only images)
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        this.toastService.error('Only image files are allowed');
      }
      
      // Add valid files with preview URLs to uploadedImages
      validFiles.forEach(file => {
        this.uploadedImages.push({
          file: file,
          preview: URL.createObjectURL(file)
        });
      });
      
      // Reset input
      input.value = '';
    }
  }

  removeImage(index: number): void {
    // Revoke the blob URL to prevent memory leak
    if (this.uploadedImages[index]) {
      URL.revokeObjectURL(this.uploadedImages[index].preview);
    }
    this.uploadedImages.splice(index, 1);
  }

  onItemGroupChange(itemGroupId: any): void {
    this.selectedItemGroupId = itemGroupId ? Number(itemGroupId) : null;
    this.selectedItemId = null;
    this.loadFilteredItems();
  }

  onSpecificationChange(specificationId: any): void {
    this.selectedSpecificationId = specificationId ? Number(specificationId) : null;
    this.selectedItemId = null;
    this.loadFilteredItems();
  }

  onSizeChange(sizeId: any): void {
    this.selectedSizeId = sizeId ? Number(sizeId) : null;
    this.selectedItemId = null;
    this.loadFilteredItems();
  }

  loadFilteredItems(): void {
    // Load items with any combination of filters
    if (!this.selectedItemGroupId && !this.selectedSpecificationId && !this.selectedSizeId) {
      this.filteredItems = [];
      return;
    }

    this.itemService.getFilteredItems(
      this.selectedItemGroupId || undefined,
      this.selectedSpecificationId || undefined,
      this.selectedSizeId || undefined
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.filteredItems = response.data.map((item: any) => ({
            id: item.itemId,
            name: item.displayName
          }));
        } else {
          this.filteredItems = [];
        }
      },
      error: (error) => {
        console.error('Error loading filtered items:', error);
        this.toastService.error('Failed to load items');
        this.filteredItems = [];
      }
    });
  }

  loadCascadingDropdownData(): void {
    // Load Item Groups
    this.itemGroupService.getAllItemGroups('Y').subscribe({
      next: (groups) => {
        this.itemGroupList = groups;
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
        this.toastService.error('Failed to load item groups');
      }
    });

    // Load Specifications
    this.specificationService.getAllSpecifications('Y').subscribe({
      next: (specs) => {
        this.specificationList = specs;
      },
      error: (error) => {
        console.error('Error loading specifications:', error);
        this.toastService.error('Failed to load specifications');
      }
    });

    // Load Sizes
    this.sizeService.getAllSizes('Y').subscribe({
      next: (sizes) => {
        this.sizeList = sizes;
      },
      error: (error) => {
        console.error('Error loading sizes:', error);
        this.toastService.error('Failed to load sizes');
      }
    });
  }

  onItemGroupsChange(): void {
    if (!this.selectedItemGroups || this.selectedItemGroups.length === 0) return;
    
    const manualRows = this.consRows.filter(r => r.manual);
    const existingMap = new Map(this.consRows.map(r => [r.id, r]));
    
    const groupItems: ConsumptionItem[] = this.selectedItemGroups.flatMap(gid => 
      (this.itemsByGroup[gid] || []).map(it => ({
        id: it.id,
        name: it.name,
        unit: it.unit || 'pcs',
        group: gid,
        qtyConsumed: existingMap.get(it.id)?.qtyConsumed || 0,
        remarks: existingMap.get(it.id)?.remarks || ''
      }))
    );
    
    const merged: ConsumptionItem[] = [...groupItems];
    manualRows.forEach(m => {
      if (!merged.find(x => x.id === m.id)) merged.push(m);
    });
    
    this.consRows = merged;
  }

  handleItemGroupChange(event: Event, groupId: string): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selectedItemGroups.includes(groupId)) {
        this.selectedItemGroups.push(groupId);
      }
    } else {
      this.selectedItemGroups = this.selectedItemGroups.filter(id => id !== groupId);
    }
    this.onItemGroupsChange();
  }

  handleSelectAllConsumption(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      // Select all
      const records = this.selectedOrder?.consumptionRecords || [];
      records.forEach(c => {
        if (!this.mappedConsumptionIds.has(c.id)) {
          this.toggleConsumptionMapping(c);
        }
      });
    } else {
      // Deselect all
      this.billRows = [];
      this.mappedConsumptionIds.clear();
    }
  }

  updateConsQty(idx: number, qty: string): void {
    this.consRows = this.consRows.map((r, i) => 
      i === idx ? { ...r, qtyConsumed: Math.max(0, Number(qty)) } : r
    );
  }

  updateConsRemarks(idx: number, remarks: string): void {
    this.consRows = this.consRows.map((r, i) => 
      i === idx ? { ...r, remarks: remarks.slice(0, 250) } : r
    );
  }

  updateConsUnit(idx: number, unit: string): void {
    this.consRows = this.consRows.map((r, i) => 
      i === idx ? { ...r, unit } : r
    );
  }

  removeConsRow(idx: number): void {
    this.consRows = this.consRows.filter((_, i) => i !== idx);
  }

  addManualConsItem(): void {
    const name = (this.manualConsName || '').trim();
    if (!name) {
      this.toastService.error('Item name required');
      return;
    }
    if (Number(this.manualConsQty) <= 0) {
      this.toastService.error('Quantity must be > 0');
      return;
    }
    
    const newRow: ConsumptionItem = {
      id: `m-${Date.now()}`,
      name,
      unit: this.manualConsUnit || 'pcs',
      group: null,
      qtyConsumed: Number(this.manualConsQty),
      remarks: '',
      manual: true
    };
    
    this.consRows = [newRow, ...this.consRows];
    this.manualConsName = '';
    this.manualConsQty = 1;
    this.manualConsUnit = 'pcs';
  }

  handleCapture(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      this.attachments = [{ id: `att-${Date.now()}`, data, name: file.name }, ...this.attachments];
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  removeAttachment(id: string): void {
    this.attachments = this.attachments.filter(a => a.id !== id);
  }

  handleSaveConsumption(): void {
    if (!this.selectedOrder) {
      this.toastService.error('Select order');
      return;
    }
    
    // Validate that there are items to consume
    if (this.consumptionItems.length === 0) {
      this.toastService.error('Please add at least one consumption item');
      return;
    }
    
    // Get current user
    const currentUser = this.authService.currentUser;
    if (!currentUser || !currentUser.email) {
      this.toastService.error('User not authenticated');
      return;
    }
    
    // Prepare consumed items from consumptionItems
    const consumedItems = this.consumptionItems.map(item => ({
      id: String(item.id),
      name: item.name,
      quantity: item.quantity || 0,
      type: item.manual ? 'Manual' : 'Auto'
    }));
    
    // Convert images to base64
    this.isSaving = true;
    const imagePromises = this.uploadedImages.map(img => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(img.file);
      });
    });
    
    Promise.all(imagePromises).then(base64Images => {
      // Prepare the consumption request
      const consumptionRequest = {
        orderId: this.selectedOrder!.orderId,
        itemGroupId: this.selectedItemGroupId || 0,
        itemGroupName: this.selectedOrder!.itemGroups && this.selectedOrder!.itemGroups.length > 0 
          ? this.selectedOrder!.itemGroups.join(', ') 
          : '',
        consumedItems: consumedItems,
        images: base64Images,
        createdBy: currentUser.email
      };
      
      // Call the API
      this.consumptionBillingService.saveConsumption(consumptionRequest).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.toastService.success('Consumption saved successfully');
          
          // Update selected order with consumption records
          if (this.selectedOrder) {
            this.selectedOrder = {
              ...this.selectedOrder,
              consumptionRecords: consumedItems.map(item => ({
                id: item.id,
                name: item.name,
                unit: 'pcs',
                qty: item.quantity,
                remarks: ''
              }))
            };
          }
          
          // Initialize billing rows from consumed items
          const consumedBillingRows = (this.selectedOrder?.consumptionRecords || []).map(c => ({
            id: `b-${c.id}`,
            srcConsumptionId: c.id,
            name: c.name,
            unit: c.unit,
            qty: c.qty,
            rate: 0,
            amount: 0,
            fromConsumption: true
          }));
          
          this.billRows = consumedBillingRows;
          this.mappedConsumptionIds = new Set(consumedBillingRows.map(b => b.srcConsumptionId!));
          
          // Close consumption modal
          this.isConsumptionModalOpen = false;
          
          // Refresh the AG Grid to get updated orders
          this.loadData();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error saving consumption:', error);
          this.toastService.error(error.message || 'Failed to save consumption');
        }
      });
    }).catch(error => {
      this.isSaving = false;
      console.error('Error converting images:', error);
      this.toastService.error('Failed to process images');
    });
  }

  // ============ Map to Billing Methods ============
  
  closeMapToBillingModal(): void {
    this.isMapToBillingModalOpen = false;
  }

  toggleConsumptionMapping(consumptionItem: any): void {
    const billRow = this.billRows.find(b => b.srcConsumptionId === consumptionItem.id);
    
    if (billRow) {
      // Remove from billing
      this.billRows = this.billRows.filter(b => b.srcConsumptionId !== consumptionItem.id);
      this.mappedConsumptionIds.delete(consumptionItem.id);
    } else {
      // Add to billing
      const newBillRow: BillingItem = {
        id: `b-${consumptionItem.id}`,
        srcConsumptionId: consumptionItem.id,
        name: consumptionItem.name,
        unit: consumptionItem.unit,
        qty: consumptionItem.qty,
        rate: 0,
        amount: 0,
        fromConsumption: true
      };
      this.billRows = [newBillRow, ...this.billRows];
      this.mappedConsumptionIds.add(consumptionItem.id);
    }
  }

  handleSaveMapToBilling(): void {
    if (this.billRows.length === 0) {
      this.toastService.error('Map or add at least one billing item');
      return;
    }
    
    this.isMapToBillingModalOpen = false;
    this.isBillingModalOpen = true;
  }

  // ============ Billing Methods ============
  
  handleOpenBilling(order: Order): void {
    this.selectedOrder = order;
    this.selectedItemGroups = [];
    this.billRows = order.billingRecords?.map(b => ({
      id: b.id || `b-${Date.now()}`,
      name: b.name,
      unit: b.unit,
      qty: b.qty || 0,
      rate: b.rate || 0,
      amount: (b.qty || 0) * (b.rate || 0)
    })) || [];
    this.consRows = [];
    this.attachments = [];
    this.remarks = order.remarks || '';
    this.isConsumptionModalOpen = false;
    this.isBillingModalOpen = true;
  }

  closeBillingModal(): void {
    this.isBillingModalOpen = false;
    this.selectedOrder = null;
    this.billRows = [];
  }

  updateBillQty(idx: number, qty: string): void {
    const q = Math.max(0, Number(qty));
    this.billRows = this.billRows.map((r, i) => {
      if (i === idx) {
        const amount = q * (r.rate || 0);
        return { ...r, qty: q, amount };
      }
      return r;
    });
  }

  updateBillRate(idx: number, rate: string): void {
    const rt = Math.max(0, Number(rate));
    this.billRows = this.billRows.map((r, i) => {
      if (i === idx) {
        const amount = (r.qty || 0) * rt;
        return { ...r, rate: rt, amount };
      }
      return r;
    });
  }

  addManualBillingItem(): void {
    const name = (this.manualBillName || '').trim();
    if (!name) {
      this.toastService.error('Item name required');
      return;
    }
    if (Number(this.manualBillQty) <= 0) {
      this.toastService.error('Quantity must be > 0');
      return;
    }
    if (Number(this.manualBillRate) < 0) {
      this.toastService.error('Rate must be ≥ 0');
      return;
    }
    
    const newRow: BillingItem = {
      id: `mb-${Date.now()}`,
      name,
      unit: 'pcs',
      qty: Number(this.manualBillQty),
      rate: Number(this.manualBillRate),
      amount: Number(this.manualBillQty) * Number(this.manualBillRate),
      manual: true
    };
    
    this.billRows = [newRow, ...this.billRows];
    this.manualBillName = '';
    this.manualBillQty = 1;
    this.manualBillRate = 0;
  }

  removeBillingItem(idx: number): void {
    this.billRows = this.billRows.filter((_, i) => i !== idx);
  }

  handleSaveBilling(): void {
    if (!this.selectedOrder) {
      this.toastService.error('Select order');
      return;
    }
    if (this.billRows.length === 0) {
      this.toastService.error('At least one billing item required');
      return;
    }
    
    const invalidRows = this.billRows.filter(b => Number(b.qty) <= 0 || Number(b.rate) < 0);
    if (invalidRows.length > 0) {
      this.toastService.error('All items must have Qty > 0 and Rate ≥ 0');
      return;
    }
    
    this.toastService.success('Billing finalized — Order status set to "Ready for Billing"');
    this.isBillingModalOpen = false;
    this.selectedOrder = null;
    this.billRows = [];
    this.remarks = '';
    this.loadData();
  }

  openPreview(): void {
    this.isPreviewModalOpen = true;
  }

  closePreviewModal(): void {
    this.isPreviewModalOpen = false;
  }

  printBilling(): void {
    window.print();
  }

  get billingSubtotal(): number {
    return this.billRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  get billingGST(): number {
    return this.billingSubtotal * 0.18; // 18% GST
  }

  get billingGrandTotal(): number {
    return this.billingSubtotal + this.billingGST;
  }

  // ============ View Modal Methods ============
  
  handleViewOrder(order: Order): void {
    this.selectedOrder = order;
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedOrder = null;
  }

  // ============ Utility Methods ============
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const min = String(minutes).padStart(2, '0');
    return `${day}-${month}-${year} ${String(hour12).padStart(2, '0')}:${min} ${ampm}`;
  }

  formatOperationDateTime(dateStr: string, timeStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let timeFormatted = '';
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const min = minutes || '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      timeFormatted = ` ${String(hour12).padStart(2, '0')}:${min} ${ampm}`;
    }
    
    return `${day}-${month}-${year}${timeFormatted}`;
  }

  getCurrentDate(): string {
    return this.formatDate(new Date().toISOString());
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate([`/${page}`]);
  }
}
