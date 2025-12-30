import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../../../components/action-dropdown/action-dropdown.component';
import { MenuService, Menu, MenuFormData, ImportRow } from '../../../services/menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './menu.component.html',
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
export class MenuComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  menus: Menu[] = [];
  parentMenuOptions: Menu[] = [];
  loading: boolean = false;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingMenu: Menu | null = null;
  viewMenu: Menu | null = null;

  // Import preview state
  importPreviewOpen: boolean = false;
  importRows: ImportRow[] = [];

  // Form data
  formData: MenuFormData = {
    menuName: '',
    menuPath: '',
    menuIcon: '',
    parentMenuId: null,
    sortOrder: 1,
    status: 'Active',
    isActive: 'Y'
  };

  // Inline matches for duplicate detection
  inlineMatches: Menu[] = [];

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  menuToDelete: Menu | null = null;

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Menu Name', field: 'menuName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 200 },
    { headerName: 'Path', field: 'menuPath', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 180 },
    { headerName: 'Icon', field: 'menuIcon', sortable: true, filter: 'agTextColumnFilter', flex: 0.7, minWidth: 120 },
    { 
      headerName: 'Parent Menu', 
      field: 'parentMenuId',
      sortable: true, 
      filter: 'agTextColumnFilter',
      flex: 0.8,
      minWidth: 150,
      valueGetter: (params: any) => {
        return this.getParentMenuName(params.data.parentMenuId);
      }
    },
    { 
      headerName: 'Sort Order', 
      field: 'sortOrder', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 110,
      minWidth: 110,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Status',
      field: 'isActive',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const isActive = params.value === 'Y';
        return `<span class="${isActive ? 'text-green-700 font-semibold' : 'text-gray-500'}">${isActive ? 'Active' : 'Inactive'}</span>`;
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
        editBtn.onclick = () => this.openEditMenu(params.data);
        
        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
        viewBtn.onclick = () => this.viewMenu = params.data;
        
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
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1
  };

  actionItems: ActionItem[][] = [
    [
      { label: 'Create New', icon: 'plus', onClick: () => this.openCreateMenu() },
      { label: 'Import', icon: 'upload', onClick: () => this.triggerImport() },
      { label: 'Export', icon: 'download', onClick: () => this.exportToCSV() }
    ]
  ];

  constructor(
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchMenus();
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

  onBreadcrumbNavigate(route: string): void {
    this.router.navigate([route]);
  }

  fetchMenus(): void {
    this.loading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.menuService.getAllMenus(true).subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.menus = data.map((menu: any) => ({
          id: menu.menuId || menu.id,
          menuId: menu.menuId || menu.id,
          menuName: menu.menuName,
          menuPath: menu.menuPath,
          menuIcon: menu.menuIcon,
          parentMenuId: menu.parentMenuId,
          sortOrder: menu.sortOrder,
          isActive: menu.isActive,
          status: menu.isActive === 'Y' ? 'Active' : 'Inactive',
          createdAt: menu.createdAt,
          subMenus: menu.subMenus || []
        }));
        this.parentMenuOptions = this.menus.filter(m => !m.parentMenuId);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch menus:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Failed to load menus. Please try again.';
        this.menus = [];
        this.loading = false;
      }
    });
  }

  retryFetch(): void {
    this.fetchMenus();
  }

  exportToCSV(): void {
    const headers = ['Menu Name', 'Path', 'Icon', 'Sort Order', 'Status', 'Created At'];
    const rows = this.menus.map(m => [
      m.menuName,
      m.menuPath,
      m.menuIcon || '',
      m.sortOrder,
      m.status || (m.isActive === 'Y' ? 'Active' : 'Inactive'),
      m.createdAt || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `menus_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  }

  openCreateMenu(): void {
    this.editingMenu = null;
    this.formData = {
      menuName: '',
      menuPath: '',
      menuIcon: '',
      parentMenuId: null,
      sortOrder: (this.menus.length > 0 ? Math.max(...this.menus.map(m => m.sortOrder || 0)) + 1 : 1),
      status: 'Active',
      isActive: 'Y'
    };
    this.inlineMatches = [];
    this.isModalOpen = true;
  }

  openEditMenu(menu: Menu): void {
    this.editingMenu = menu;
    this.formData = {
      menuName: menu.menuName,
      menuPath: menu.menuPath,
      menuIcon: menu.menuIcon || '',
      parentMenuId: menu.parentMenuId || null,
      sortOrder: menu.sortOrder,
      status: menu.isActive === 'Y' ? 'Active' : 'Inactive',
      isActive: menu.isActive
    };
    this.inlineMatches = [];
    this.isModalOpen = true;
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingMenu = null;
    this.formData = {
      menuName: '',
      menuPath: '',
      menuIcon: '',
      parentMenuId: null,
      sortOrder: 1,
      status: 'Active',
      isActive: 'Y'
    };
    this.inlineMatches = [];
  }

  onFormChange(): void {
    if (this.formData.menuName && this.formData.menuName.trim().length >= 2) {
      this.inlineMatches = this.menus.filter(m => {
        const excludeId = this.editingMenu?.id || this.editingMenu?.menuId;
        if (excludeId && m.id === excludeId) return false;
        return m.menuName && m.menuName.trim().toLowerCase().includes(this.formData.menuName.trim().toLowerCase());
      });
    } else {
      this.inlineMatches = [];
    }
  }

  toggleStatus(): void {
    this.formData.isActive = this.formData.isActive === 'Y' ? 'N' : 'Y';
    this.formData.status = this.formData.isActive === 'Y' ? 'Active' : 'Inactive';
  }

  checkDuplicate(name: string, excludeId: number | null): Menu | null {
    const lowerName = name.trim().toLowerCase();
    const found = this.menus.find(m => {
      if (excludeId && m.id === excludeId) return false;
      return m.menuName && m.menuName.trim().toLowerCase() === lowerName;
    });
    
    return found || null;
  }

  handleSaveMenu(): void {
    // Mandatory checks
    if (!this.formData.menuName?.trim()) {
      console.error('Menu name is mandatory');
      return;
    }

    if (!this.formData.menuPath?.trim()) {
      console.error('Menu path is mandatory');
      return;
    }

    const dup = this.checkDuplicate(
      this.formData.menuName, 
      this.editingMenu?.id || null
    );

    if (dup) {
      console.error('Duplicate found:', dup);
      this.viewMenu = dup;
      return;
    }

    this.persistMenu();
  }

  persistMenu(): void {
    this.loading = true;

    if (this.editingMenu) {
      // Update existing menu
      this.menuService.updateMenu(this.editingMenu.id!, this.formData).subscribe({
        next: () => {
          console.log('Menu updated successfully!');
          this.fetchMenus();
          this.handleCloseModal();
        },
        error: (error) => {
          console.error('Failed to update menu:', error);
          this.handleCloseModal();
          this.loading = false;
        }
      });
    } else {
      // Create new menu
      this.menuService.createMenu(this.formData).subscribe({
        next: () => {
          console.log('Menu created successfully!');
          this.fetchMenus();
          this.handleCloseModal();
        },
        error: (error) => {
          console.error('Failed to create menu:', error);
          this.handleCloseModal();
          this.loading = false;
        }
      });
    }
  }

  // Import functionality
  triggerImport(): void {
    const fileInput = document.getElementById('menu-import-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  handleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = this.parseCSV(text);
      this.prepareImportPreview(parsed);
      input.value = '';
    };
    reader.readAsText(file);
  }

  parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  prepareImportPreview(rows: any[]): void {
    this.importRows = rows.map((row, idx) => {
      const menuName = row['Menu Name'] || row['menuName'] || '';
      const duplicates: string[] = [];

      // Check against existing data
      const existing = this.menus.find(m => 
        m.menuName?.trim().toLowerCase() === menuName.trim().toLowerCase()
      );
      if (existing) {
        duplicates.push(`Existing: ${existing.menuName}`);
      }

      // Check against other rows in import
      const withinFile = rows.find((r, i) => 
        i !== idx && 
        (r['Menu Name'] || r['menuName'] || '').trim().toLowerCase() === menuName.trim().toLowerCase()
      );
      if (withinFile) {
        duplicates.push('Within file');
      }

      return {
        index: idx + 1,
        row: {
          menuName: menuName,
          menuPath: row['Path'] || row['menuPath'] || '',
          menuIcon: row['Icon'] || row['menuIcon'] || '',
          sortOrder: parseInt(row['Sort Order'] || row['sortOrder'] || '1'),
          isActive: (row['Status'] || row['isActive'] || 'Active').toLowerCase().includes('active') ? 'Y' : 'N'
        },
        isDuplicate: duplicates.length > 0,
        duplicateAgainst: duplicates,
        action: duplicates.length > 0 ? 'skip' : 'add'
      };
    });

    this.importPreviewOpen = true;
  }

  toggleImportAction(index: number, action: string): void {
    const item = this.importRows.find(r => r.index === index);
    if (item) {
      item.action = action as 'add' | 'merge' | 'skip';
    }
  }

  getDuplicateCount(): number {
    return this.importRows.filter(r => r.isDuplicate).length;
  }

  closeImportPreview(): void {
    this.importPreviewOpen = false;
    this.importRows = [];
  }

  commitImport(): void {
    console.log('Committing import...', this.importRows);
    // Implementation would handle add/merge/skip logic
    this.closeImportPreview();
    this.fetchMenus();
  }

  // Delete functionality
  confirmDelete(menu: Menu): void {
    this.menuToDelete = menu;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.menuToDelete = null;
    this.showDeleteConfirm = false;
  }

  handleDeleteMenu(): void {
    if (!this.menuToDelete?.id) return;

    const id = this.menuToDelete.id;
    this.loading = true;

    this.menuService.deleteMenu(id).subscribe({
      next: () => {
        console.log('Menu deleted successfully');
        this.menus = this.menus.filter(m => m.id !== id);
        this.cancelDelete();
        this.loading = false;
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this.menus = this.menus.filter(m => m.id !== id);
        this.cancelDelete();
        this.loading = false;
      }
    });
  }

  closeViewMenu(): void {
    this.viewMenu = null;
  }

  isSaveDisabled(): boolean {
    return !this.formData.menuName?.trim() || !this.formData.menuPath?.trim();
  }

  getParentMenuName(parentId: number | null): string {
    if (!parentId) return 'None';
    const parent = this.menus.find(m => m.id === parentId || m.menuId === parentId);
    return parent?.menuName || 'Unknown';
  }
}
