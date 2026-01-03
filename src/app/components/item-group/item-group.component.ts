import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { ItemGroupService, ItemGroup, ItemGroupFormData } from '../../services/item-group.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-item-group',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './item-group.component.html',
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
export class ItemGroupComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  itemGroups: ItemGroup[] = [];
  loading: boolean = false;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingItemGroup: ItemGroup | null = null;
  viewItemGroup: ItemGroup | null = null;

  // Form data
  formData: ItemGroupFormData = {
    name: '',
    description: '',
    isActive: 'Y'
  };

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  itemGroupToDelete: ItemGroup | null = null;

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Name', field: 'name', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 200 },
    { headerName: 'Description', field: 'description', sortable: true, filter: 'agTextColumnFilter', flex: 2, minWidth: 300 },
    { 
      headerName: 'Status', 
      field: 'isActive', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      width: 100,
      cellRenderer: (params: any) => {
        const isActive = params.value === 'Y';
        const span = document.createElement('span');
        span.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        span.textContent = isActive ? 'Active' : 'Inactive';
        return span;
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
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'flex items-center justify-center text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200';
        editBtn.title = 'Edit';
        editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`;
        editBtn.onclick = () => this.openEditItemGroup(params.data);

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.onclick = () => this.viewItemGroup = params.data;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'flex items-center justify-center text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;
        deleteBtn.onclick = () => this.confirmDelete(params.data);

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
        label: 'Add New Item Group',
        icon: `<svg class="text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>`,
        onClick: () => this.openCreateItemGroup()
      },
      {
        label: 'Refresh',
        icon: `<svg class="text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>`,
        onClick: () => this.fetchItemGroups()
      }
    ]
  ];

  constructor(
    private itemGroupService: ItemGroupService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchItemGroups();
  }

  fetchItemGroups(): void {
    this.loading = true;
    this.hasError = false;
    
    this.itemGroupService.getAllItemGroups().subscribe({
      next: (data) => {
        this.itemGroups = data;
        this.loading = false;
        if (this.gridReady && this.gridApi) {
          this.gridApi.setGridOption('rowData', this.itemGroups);
        }
      },
      error: (error) => {
        console.error('Error fetching item groups:', error);
        this.errorMessage = error.message || 'Failed to load item groups. Please try again.';
        this.hasError = true;
        this.loading = false;
      }
    });
  }

  retryFetch(): void {
    this.fetchItemGroups();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridReady = true;
    params.api.sizeColumnsToFit();
  }

  openCreateItemGroup(): void {
    this.editingItemGroup = null;
    this.formData = {
      name: '',
      description: '',
      isActive: 'Y'
    };
    this.isModalOpen = true;
  }

  openEditItemGroup(itemGroup: ItemGroup): void {
    this.editingItemGroup = itemGroup;
    this.formData = {
      name: itemGroup.name,
      description: itemGroup.description,
      isActive: itemGroup.isActive
    };
    this.isModalOpen = true;
  }

  confirmDelete(itemGroup: ItemGroup): void {
    this.itemGroupToDelete = itemGroup;
    this.showDeleteConfirm = true;
  }

  handleDeleteItemGroup(): void {
    if (!this.itemGroupToDelete) return;
    
    this.itemGroupService.deleteItemGroup(this.itemGroupToDelete.itemGroupId).subscribe({
      next: (response) => {
        this.itemGroups = this.itemGroups.filter(ig => ig.itemGroupId !== this.itemGroupToDelete!.itemGroupId);
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.itemGroups);
        }
        this.showDeleteConfirm = false;
        this.itemGroupToDelete = null;
        this.toastService.success('Item group deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting item group:', error);
        this.toastService.error(error.message || 'Failed to delete item group');
        this.showDeleteConfirm = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.itemGroupToDelete = null;
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingItemGroup = null;
    this.resetForm();
  }

  closeViewItemGroup(): void {
    this.viewItemGroup = null;
  }

  resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      isActive: 'Y'
    };
  }

  handleSaveItemGroup(): void {
    if (!this.validateForm()) return;
    
    if (this.editingItemGroup) {
      this.itemGroupService.updateItemGroup(this.editingItemGroup.itemGroupId, this.formData).subscribe({
        next: (response) => {
          console.log('Update ItemGroup Response:', response);
          
          let updatedItemGroup: ItemGroup | null = null;
          let isSuccess = false;
          
          if (response && typeof response === 'object' && 'data' in response) {
            updatedItemGroup = response.data || null;
            isSuccess = true;
          } else if (response && typeof response === 'object' && 'itemGroupId' in response) {
            isSuccess = true;
            updatedItemGroup = response as any;
          }
          
          if (isSuccess && updatedItemGroup) {
            const index = this.itemGroups.findIndex(ig => ig.itemGroupId === this.editingItemGroup!.itemGroupId);
            if (index !== -1) {
              this.itemGroups[index] = updatedItemGroup;
              if (this.gridApi) {
                this.gridApi.setGridOption('rowData', this.itemGroups);
              }
            }
            this.handleCloseModal();
            this.toastService.success('Item group updated successfully');
          } else {
            const errorMsg = (response as any)?.message || 'Failed to update item group';
            this.toastService.error(errorMsg);
          }
        },
        error: (error) => {
          console.error('Error updating item group:', error);
          this.toastService.error(error.message || 'Failed to update item group');
        }
      });
    } else {
      this.itemGroupService.createItemGroup(this.formData).subscribe({
        next: (response) => {
          console.log('Create ItemGroup Response:', response);
          
          let itemGroupData: ItemGroup | null = null;
          let isSuccess = false;
          
          if (response && typeof response === 'object' && 'data' in response) {
            itemGroupData = response.data || null;
            isSuccess = true;
          } else if (response && typeof response === 'object' && 'itemGroupId' in response) {
            isSuccess = true;
            itemGroupData = response as any;
          }
          
          if (isSuccess && itemGroupData) {
            this.itemGroups = [itemGroupData, ...this.itemGroups];
            if (this.gridApi) {
              this.gridApi.setGridOption('rowData', this.itemGroups);
            }
            this.handleCloseModal();
            this.toastService.success('Item group created successfully');
          } else {
            const errorMsg = (response as any)?.message || 'Failed to create item group';
            this.toastService.error(errorMsg);
          }
        },
        error: (error) => {
          console.error('Error creating item group:', error);
          this.toastService.error(error.message || 'Failed to create item group');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.name || this.formData.name.trim() === '') {
      this.toastService.warning('Name is required');
      return false;
    }
    return true;
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate([`/${page}`]);
  }
}
