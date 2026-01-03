import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { ItemService, Item, ItemFormData } from '../../services/item.service';
import { CategoryService, Category } from '../../services/category.service';
import { BrandService, Brand } from '../../services/brand.service';
import { SizeService, Size } from '../../services/size.service';
import { SpecificationService, Specification } from '../../services/specification.service';
import { ItemGroupService, ItemGroup } from '../../services/item-group.service';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent, SearchableDropdownComponent],
  templateUrl: './item.component.html',
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
export class ItemComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  items: Item[] = [];
  loading: boolean = true;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingItem: Item | null = null;
  viewItem: Item | null = null;

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  itemToDelete: Item | null = null;

  // Form data
  formData: ItemFormData = {
    name: '',
    shortname: '',
    brandId: null,
    categoryId: null,
    itemGroupId: null,
    specificationId: null,
    sizeId: null,
    material: '',
    model: '',
    description: '',
    price: 0,
    status: 'Active',
    isActive: 'Y'
  };

  // Dropdown options
  groupOptions: Brand[] = [];
  categoryOptions: Category[] = [];
  itemGroupOptions: ItemGroup[] = [];
  sizeOptions: Size[] = [];
  specificationOptions: Specification[] = [];

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Name', field: 'name', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 190 },
    { headerName: 'Size', field: 'sizeName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 260 },
    { headerName: 'Brand', field: 'brandName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 160 },
    { headerName: 'Item Group', field: 'itemGroupName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 150 },
    { headerName: 'Model/Part No.', field: 'model', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 180 },
    {
      headerName: 'Price',
      field: 'price',
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(2) : ''),
      flex: 1,
      minWidth: 90
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const status = params.value;
        const colorClass = status === 'Active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800';
        return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">${status}</span>`;
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
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-center w-full h-full space-x-1';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'flex items-center justify-center text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200';
        editBtn.title = 'Edit';
        editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`;
        editBtn.onclick = () => this.handleEditItem(params.data);

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.onclick = () => this.viewItem = params.data;

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

  // Action items for dropdown
  actionItems: ActionItem[][] = [
    [
      { label: 'Add New Item', icon: 'add', onClick: () => this.openCreateItem() },
      { label: 'Refresh', icon: 'refresh', onClick: () => this.handleRefresh() }
    ],
    [
      { label: 'Export to Excel', icon: 'export', onClick: () => this.handleExportExcel() }
    ],
    [
      { label: 'Bulk Delete', icon: 'delete', onClick: () => this.handleBulkDelete(), badge: 'Soon' }
    ]
  ];

  constructor(
    private itemService: ItemService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private sizeService: SizeService,
    private specificationService: SpecificationService,
    private itemGroupService: ItemGroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load items
    this.fetchItems();
    // Load dropdown options
    this.fetchCategories();
    this.fetchBrands();
    this.fetchItemGroups();
    this.fetchSizes();
    this.fetchSpecifications();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridReady = true;
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
      }
    }, 100);
  }

  fetchItems(): void {
    this.loading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.itemService.getAllItems(true).subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.items = data.map((item: any) => ({
          ...item,
          id: item.itemId || item.id,
          status: item.isActive === 'Y' ? 'Active' : 'Inactive'
        }));
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Failed to fetch items:', error);
        this.items = [];
        this.loading = false;
        this.hasError = true;
        this.errorMessage = 'Failed to fetch items.';
      }
    });
  }

  fetchCategories(): void {
    this.categoryService.getAllCategories('Y').subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.categoryOptions = data.map((cat: any) => ({
          categoryId: cat.categoryId || cat.id,
          name: cat.name,
          status: cat.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: cat.isActive
        }));
      },
      error: (error) => {
        console.error('Failed to fetch categories:', error);
        this.categoryOptions = [];
      }
    });
  }

  fetchBrands(): void {
    this.brandService.getAllBrands(true).subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.groupOptions = data.map((brand: any) => ({
          brandId: brand.brandId || brand.id,
          name: brand.name,
          status: brand.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: brand.isActive
        }));
      },
      error: (error) => {
        console.error('Failed to fetch brands:', error);
        this.groupOptions = [];
      }
    });
  }

  fetchItemGroups(): void {
    this.itemGroupService.getAllItemGroups('Y').subscribe({
      next: (response) => {
        this.itemGroupOptions = response;
      },
      error: (error) => {
        console.error('Failed to fetch item groups:', error);
        this.itemGroupOptions = [];
      }
    });
  }

  fetchSizes(): void {
    this.sizeService.getAllSizes('Y').subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.sizeOptions = data.map((size: any) => ({
          sizeId: size.sizeId || size.id,
          name: size.name,
          status: size.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: size.isActive
        }));
      },
      error: (error) => {
        console.error('Failed to fetch sizes:', error);
        this.sizeOptions = [];
      }
    });
  }

  fetchSpecifications(): void {
    this.specificationService.getAllSpecifications('Y').subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.specificationOptions = data.map((spec: any) => ({
          specificationId: spec.specificationId || spec.id,
          name: spec.name,
          status: spec.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: spec.isActive
        }));
      },
      error: (error) => {
        console.error('Failed to fetch specifications:', error);
        this.specificationOptions = [];
      }
    });
  }

  handleRefresh(): void {
    this.fetchItems();
  }

  retryFetch(): void {
    this.fetchItems();
  }

  handleExportExcel(): void {
    const headers = ['Name', 'Short Name', 'Specification', 'Size', 'Material', 'Brand', 'Category', 'Model/Part No.', 'Description', 'Price', 'Created Date', 'Status'];
    const rows = this.items.map((item) => [
      item.name,
      item.shortname || '',
      item.specificationName || '',
      item.sizeName || '',
      item.material || '',
      item.brandName,
      item.categoryName,
      item.model || '',
      (item.description || '').replace(/"/g, '""'),
      item.price,
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
      item.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map((c: any) => `"${String(c)}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `items_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Data exported successfully!');
  }

  handleBulkDelete(): void {
    console.log('Bulk delete functionality coming soon!');
  }

  openCreateItem(): void {
    this.editingItem = null;
    this.formData = {
      name: '',
      shortname: '',
      brandId: null,
      categoryId: null,
      itemGroupId: null,
      specificationId: null,
      sizeId: null,
      material: '',
      model: '',
      description: '',
      price: 0,
      status: 'Active',
      isActive: 'Y'
    };
    this.isModalOpen = true;
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingItem = null;
    this.formData = {
      name: '',
      shortname: '',
      brandId: null,
      categoryId: null,
      itemGroupId: null,
      specificationId: null,
      sizeId: null,
      material: '',
      model: '',
      description: '',
      price: 0,
      status: 'Active',
      isActive: 'Y'
    };
  }

  handleEditItem(item: Item): void {
    this.editingItem = item;
    this.formData = {
      name: item.name || '',
      shortname: item.shortname || '',
      brandId: item.brandId || null,
      categoryId: item.categoryId || null,
      itemGroupId: item.itemGroupId || null,
      specificationId: item.specificationId || null,
      sizeId: item.sizeId || null,
      material: item.material || '',
      model: item.model || '',
      description: item.description || '',
      price: item.price || 0,
      status: item.status || 'Active',
      isActive: item.isActive || 'Y'
    };
    this.isModalOpen = true;
  }

  confirmDelete(item: Item): void {
    this.itemToDelete = item;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.itemToDelete = null;
    this.showDeleteConfirm = false;
  }

  handleDeleteItem(): void {
    if (!this.itemToDelete) return;

    const id = this.itemToDelete.id;
    
    this.itemService.deleteItem(id!).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.id !== id);
        this.showDeleteConfirm = false;
        this.itemToDelete = null;
        console.log('Item deleted successfully!');
      },
      error: (error) => {
        console.warn('API delete failed, removing from local data:', error);
        // For demo mode, just remove from local array
        this.items = this.items.filter((i) => i.id !== id);
        this.showDeleteConfirm = false;
        this.itemToDelete = null;
      }
    });
  }

  isSaveDisabled(): boolean {
    return !this.formData.name?.trim() || 
           !this.formData.shortname?.trim() || 
           !this.formData.brandId || 
           !this.formData.categoryId || 
           this.formData.price == null || 
           this.formData.price < 0;
  }

  handleSaveItem(): void {
    // Validation
    if (!this.formData.name?.trim() || !this.formData.shortname?.trim() || 
        !this.formData.brandId || !this.formData.categoryId || 
        this.formData.price == null || this.formData.price < 0) {
      console.error('All required fields must be filled!');
      return;
    }

    // Set isActive based on status
    this.formData.isActive = this.formData.status === 'Active' ? 'Y' : 'N';

    this.loading = true;

    if (this.editingItem) {
      // Update existing item
      this.itemService.updateItem(this.editingItem.id!, this.formData).subscribe({
        next: () => {
          console.log('Item updated successfully!');
          this.fetchItems();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API update failed, updating local data:', error);
          // For demo mode, update local array
          const index = this.items.findIndex((i) => i.id === this.editingItem!.id);
          if (index > -1) {
            this.items[index] = {
              ...this.items[index],
              name: this.formData.name,
              shortname: this.formData.shortname,
              brandId: this.formData.brandId!,
              brandName: this.groupOptions.find(g => g.brandId === this.formData.brandId)?.name || this.items[index].brandName,
              categoryId: this.formData.categoryId!,
              categoryName: this.categoryOptions.find(c => c.categoryId === this.formData.categoryId)?.name || this.items[index].categoryName,
              itemGroupId: this.formData.itemGroupId || undefined,
              itemGroupName: this.itemGroupOptions.find(ig => ig.itemGroupId === this.formData.itemGroupId)?.name,
              specificationId: this.formData.specificationId || undefined,
              specificationName: this.specificationOptions.find(s => s.specificationId === this.formData.specificationId)?.name,
              sizeId: this.formData.sizeId || undefined,
              sizeName: this.sizeOptions.find(s => s.sizeId === this.formData.sizeId)?.name,
              material: this.formData.material,
              model: this.formData.model,
              description: this.formData.description,
              price: this.formData.price,
              status: this.formData.status,
              isActive: this.formData.isActive
            };
            this.items = [...this.items];
          }
          this.handleCloseModal();
          this.loading = false;
        }
      });
    } else {
      // Create new item
      this.itemService.createItem(this.formData).subscribe({
        next: () => {
          console.log('Item created successfully!');
          this.fetchItems();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API create failed, adding to local data:', error);
          // For demo mode, add to local array
          const newId = this.items.length ? Math.max(...this.items.map((i) => i.id || 0)) + 1 : 1;
          const today = new Date().toISOString().split('T')[0];
          const newItem: Item = {
            id: newId,
            itemId: newId,
            name: this.formData.name,
            shortname: this.formData.shortname,
            brandId: this.formData.brandId!,
            brandName: this.groupOptions.find(g => g.brandId === this.formData.brandId)?.name || '',
            categoryId: this.formData.categoryId!,
            categoryName: this.categoryOptions.find(c => c.categoryId === this.formData.categoryId)?.name || '',
            itemGroupId: this.formData.itemGroupId || undefined,
            itemGroupName: this.itemGroupOptions.find(ig => ig.itemGroupId === this.formData.itemGroupId)?.name,
            specificationId: this.formData.specificationId || undefined,
            specificationName: this.specificationOptions.find(s => s.specificationId === this.formData.specificationId)?.name,
            sizeId: this.formData.sizeId || undefined,
            sizeName: this.sizeOptions.find(s => s.sizeId === this.formData.sizeId)?.name,
            material: this.formData.material,
            model: this.formData.model,
            description: this.formData.description,
            price: this.formData.price,
            createdAt: today,
            status: this.formData.status,
            isActive: this.formData.isActive
          };
          this.items = [...this.items, newItem];
          this.handleCloseModal();
          this.loading = false;
        }
      });
    }
  }

  validatePrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Remove negative sign if present
    if (value.startsWith('-')) {
      value = value.substring(1);
      input.value = value;
    }
    
    // Ensure only two decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
        input.value = value;
      }
    }
    
    // Update the form data with the current value (convert to number)
    this.formData.price = parseFloat(input.value) || 0;
  }

  toggleStatus(): void {
    this.formData.status = this.formData.status === 'Active' ? 'Inactive' : 'Active';
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate(['/' + page]);
  }

  closeViewItem(): void {
    this.viewItem = null;
  }
}
