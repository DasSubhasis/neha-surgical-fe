import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { RoleService, Role, RoleFormData, ImportRow } from '../../services/role.service';
import { MenuService, Menu } from '../../services/menu.service';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './role.component.html',
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
export class RoleComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  roles: Role[] = [];
  loading: boolean = false;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Menus
  availableMenus: Menu[] = [];
  selectedMenus: number[] = [];

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingRole: Role | null = null;
  viewRole: Role | null = null;

  // Import preview state
  importPreviewOpen: boolean = false;
  importRows: ImportRow[] = [];

  // Form data
  formData: RoleFormData = {
    name: '',
    description: '',
    status: 'Active',
    isActive: 'Y'
  };

  // Inline matches for duplicate detection
  inlineMatches: Role[] = [];

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  roleToDelete: Role | null = null;

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Role Name', field: 'name', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 200 },
    { headerName: 'Description', field: 'description', sortable: true, filter: 'agTextColumnFilter', flex: 2, minWidth: 250 },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 100,
      cellRenderer: (params: any) => {
        const status = params.data.isActive === 'Y' ? 'Active' : 'Inactive';
        const colorClass = status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        return `<span class="px-2 py-1 text-xs font-medium ${colorClass} rounded-full">${status}</span>`;
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
        editBtn.onclick = () => this.openEditRole(params.data);

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.onclick = () => this.viewRole = params.data;

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
      { label: 'Add New Role', icon: 'add', onClick: () => this.openCreateRole() },
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
    private roleService: RoleService,
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMenus();
    this.fetchRoles();
  }

  loadMenus(): void {
    this.menuService.getAllMenus(true).subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || [];
        this.availableMenus = data.map((menu: any) => ({
          id: menu.menuId || menu.id,
          menuId: menu.menuId || menu.id,
          menuName: menu.menuName,
          menuPath: menu.menuPath,
          menuIcon: menu.menuIcon,
          parentMenuId: menu.parentMenuId,
          sortOrder: menu.sortOrder,
          isActive: menu.isActive,
          subMenus: menu.subMenus || []
        }));
      },
      error: (error) => {
        console.error('Failed to load menus:', error);
      }
    });
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

  fetchRoles(): void {
    this.loading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.roleService.getAllRoles('Y').subscribe({
      next: (roles) => {
        this.roles = roles.map((role: any) => ({
          id: role.roleId || role.id,
          name: role.name,
          description: role.description,
          status: role.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: role.isActive,
          createdAt: role.createdAt
        }));
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Failed to fetch roles:', error);
        this.loading = false;
        this.roles = [];
        this.hasError = true;
        this.errorMessage = 'Failed to fetch roles.';
      }
    });
  }

  handleRefresh(): void {
    this.fetchRoles();
  }

  retryFetch(): void {
    this.fetchRoles();
  }

  handleExportExcel(): void {
    const headers = ['Role Name', 'Description', 'Status', 'Created At'];
    const rows = this.roles.map(r => [
      r.name,
      r.description,
      r.status,
      r.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roles_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Data exported successfully!');
  }

  handleBulkDelete(): void {
    console.log('Bulk delete functionality coming soon!');
  }

  openCreateRole(): void {
    this.editingRole = null;
    this.formData = {
      name: '',
      description: '',
      status: 'Active',
      isActive: 'Y'
    };
    this.selectedMenus = [];
    this.isModalOpen = true;
    this.inlineMatches = [];
  }

  openEditRole(role: Role): void {
    this.editingRole = role;
    this.formData = {
      name: role.name || '',
      description: role.description || '',
      status: role.status || 'Active',
      isActive: role.isActive || 'Y'
    };
    this.selectedMenus = []; // TODO: Load from role.menus when API supports it
    this.isModalOpen = true;
    this.inlineMatches = [];
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingRole = null;
    this.formData = {
      name: '',
      description: '',
      status: 'Active',
      isActive: 'Y'
    };
    this.selectedMenus = [];
    this.inlineMatches = [];
  }

  confirmDelete(role: Role): void {
    this.roleToDelete = role;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.roleToDelete = null;
    this.showDeleteConfirm = false;
  }

  handleDeleteRole(): void {
    if (!this.roleToDelete) return;

    const id = this.roleToDelete.id;
    
    this.roleService.deleteRole(id!).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r.id !== id);
        this.showDeleteConfirm = false;
        this.roleToDelete = null;
        console.log('Role deleted successfully!');
      },
      error: (error) => {
        console.warn('API delete failed, removing from local data:', error);
        this.roles = this.roles.filter(r => r.id !== id);
        this.showDeleteConfirm = false;
        this.roleToDelete = null;
      }
    });
  }

  onFormChange(): void {
    if (!this.formData.name) {
      this.inlineMatches = [];
      return;
    }

    this.inlineMatches = this.roles.filter(r => {
      return r.name.toLowerCase().includes(this.formData.name.trim().toLowerCase());
    }).slice(0, 5);
  }

  isSaveDisabled(): boolean {
    return !this.formData.name?.trim();
  }

  checkDuplicate(name: string, excludeId: number | null = null): Role | null {
    if (!name) return null;
    
    const lowerName = name.trim().toLowerCase();
    
    const found = this.roles.find(r => {
      if (excludeId && r.id === excludeId) return false;
      return r.name && r.name.trim().toLowerCase() === lowerName;
    });
    
    return found || null;
  }

  handleSaveRole(): void {
    if (!this.formData.name?.trim()) {
      console.error('Role name is mandatory');
      return;
    }

    const dup = this.checkDuplicate(
      this.formData.name, 
      this.editingRole?.id || null
    );

    if (dup) {
      console.error('Duplicate found:', dup);
      this.viewRole = dup;
      return;
    }

    this.persistRole();
  }

  persistRole(): void {
    this.loading = true;

    if (this.editingRole) {
      this.roleService.updateRole(this.editingRole.id!, this.formData).subscribe({
        next: () => {
          console.log('Role updated successfully!');
          this.fetchRoles();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API update failed, updating local data:', error);
          const index = this.roles.findIndex(r => r.id === this.editingRole!.id);
          if (index > -1) {
            this.roles[index] = {
              ...this.roles[index],
              name: this.formData.name,
              description: this.formData.description,
              status: this.formData.isActive === 'Y' ? 'Active' : 'Inactive',
              isActive: this.formData.isActive
            };
            this.roles = [...this.roles];
          }
          this.handleCloseModal();
          this.loading = false;
        }
      });
    } else {
      this.roleService.createRole(this.formData).subscribe({
        next: () => {
          console.log('Role created successfully!');
          this.fetchRoles();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API create failed, adding to local data:', error);
          const newId = this.roles.length ? Math.max(...this.roles.map(r => r.id || 0)) + 1 : 1;
          const newRole: Role = {
            id: newId,
            name: this.formData.name,
            description: this.formData.description,
            status: this.formData.isActive === 'Y' ? 'Active' : 'Inactive',
            isActive: this.formData.isActive,
            createdAt: new Date().toISOString().split('T')[0]
          };
          this.roles = [newRole, ...this.roles];
          this.handleCloseModal();
          this.loading = false;
        }
      });
    }
  }

  // Menu selection methods
  isMenuSelected(menuId: number): boolean {
    return this.selectedMenus.includes(menuId);
  }

  toggleMenu(menuId: number): void {
    const index = this.selectedMenus.indexOf(menuId);
    if (index > -1) {
      this.selectedMenus.splice(index, 1);
    } else {
      this.selectedMenus.push(menuId);
    }
  }

  isParentMenuFullySelected(parentMenu: Menu): boolean {
    if (!parentMenu.subMenus || parentMenu.subMenus.length === 0) {
      return this.isMenuSelected(parentMenu.menuId || parentMenu.id!);
    }
    const allSubMenuIds = parentMenu.subMenus.map(sm => sm.menuId || sm.id!);
    return this.isMenuSelected(parentMenu.menuId || parentMenu.id!) && 
           allSubMenuIds.every(id => this.selectedMenus.includes(id));
  }

  isParentMenuPartiallySelected(parentMenu: Menu): boolean {
    if (!parentMenu.subMenus || parentMenu.subMenus.length === 0) {
      return false;
    }
    const allSubMenuIds = parentMenu.subMenus.map(sm => sm.menuId || sm.id!);
    const selectedCount = allSubMenuIds.filter(id => this.selectedMenus.includes(id)).length;
    const parentSelected = this.isMenuSelected(parentMenu.menuId || parentMenu.id!);
    return (parentSelected || selectedCount > 0) && selectedCount < allSubMenuIds.length;
  }

  toggleParentMenu(parentMenu: Menu): void {
    const parentId = parentMenu.menuId || parentMenu.id!;
    const isFullySelected = this.isParentMenuFullySelected(parentMenu);
    
    if (isFullySelected) {
      // Deselect parent and all submenus
      const index = this.selectedMenus.indexOf(parentId);
      if (index > -1) this.selectedMenus.splice(index, 1);
      
      if (parentMenu.subMenus) {
        parentMenu.subMenus.forEach(subMenu => {
          const subId = subMenu.menuId || subMenu.id!;
          const subIndex = this.selectedMenus.indexOf(subId);
          if (subIndex > -1) this.selectedMenus.splice(subIndex, 1);
        });
      }
    } else {
      // Select parent and all submenus
      if (!this.selectedMenus.includes(parentId)) {
        this.selectedMenus.push(parentId);
      }
      
      if (parentMenu.subMenus) {
        parentMenu.subMenus.forEach(subMenu => {
          const subId = subMenu.menuId || subMenu.id!;
          if (!this.selectedMenus.includes(subId)) {
            this.selectedMenus.push(subId);
          }
        });
      }
    }
  }

  getParentMenus(): Menu[] {
    return this.availableMenus.filter(m => !m.parentMenuId);
  }

  selectAllMenus(): void {
    this.selectedMenus = [];
    this.availableMenus.forEach(menu => {
      const menuId = menu.menuId || menu.id!;
      this.selectedMenus.push(menuId);
    });
  }

  clearAllMenus(): void {
    this.selectedMenus = [];
  }

  // Import functionality
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
    if (!lines.length) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const rows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const cols = this.splitCSVLine(lines[i]);
      if (!cols.length) continue;
      const obj: any = {};
      headers.forEach((h, idx) => obj[h] = cols[idx] ? cols[idx].trim().replace(/^"|"$/g, '') : '');
      rows.push(obj);
    }
    return rows;
  }

  splitCSVLine(line: string): string[] {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; cur += ch; continue; }
      if (ch === ',' && !inQuotes) { res.push(cur); cur = ''; continue; }
      cur += ch;
    }
    res.push(cur);
    return res.map(s => s.replace(/^"|"$/g, ''));
  }

  prepareImportPreview(parsedRows: any[]): void {
    const mapped: ImportRow[] = parsedRows.map((r, idx) => {
      const row = {
        name: r['role name'] || r['name'] || r['role'] || '',
        description: r['description'] || ''
      };
      return { index: idx + 1, row, isDuplicate: false, duplicateAgainst: [], action: 'add' as const };
    });

    const afterDup = mapped.map(item => {
      const name = item.row.name;
      const lowerName = name ? name.trim().toLowerCase() : null;
      const dupAgainst: (number | string)[] = this.roles
        .filter(r => lowerName && r.name && r.name.trim().toLowerCase() === lowerName)
        .map(r => r.id!);
      return { ...item, isDuplicate: dupAgainst.length > 0, duplicateAgainst: dupAgainst };
    });

    for (let i = 0; i < afterDup.length; i++) {
      for (let j = i + 1; j < afterDup.length; j++) {
        const a = afterDup[i].row, b = afterDup[j].row;
        if (a.name && b.name && a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) {
          afterDup[i].isDuplicate = true;
          afterDup[j].isDuplicate = true;
          afterDup[i].duplicateAgainst.push(`file-${afterDup[j].index}`);
          afterDup[j].duplicateAgainst.push(`file-${afterDup[i].index}`);
        }
      }
    }

    const withActions = afterDup.map(r => ({ ...r, action: (r.isDuplicate ? 'skip' : 'add') as 'add' | 'merge' | 'skip' }));
    this.importRows = withActions;
    this.importPreviewOpen = true;
  }

  toggleImportAction(idx: number, action: 'add' | 'merge' | 'skip'): void {
    this.importRows = this.importRows.map(r => r.index === idx ? { ...r, action } : r);
  }

  commitImport(): void {
    const toAdd: ImportRow[] = [];
    const toMerge: ImportRow[] = [];
    
    this.importRows.forEach(item => {
      if (item.action === 'add') toAdd.push(item);
      if (item.action === 'merge' && item.duplicateAgainst.length) toMerge.push(item);
    });

    const newRoles = [...this.roles];
    
    toMerge.forEach(item => {
      const existingId = item.duplicateAgainst.find(x => typeof x === 'number' || !String(x).startsWith('file-'));
      if (existingId && typeof existingId === 'number') {
        const idx = newRoles.findIndex(r => r.id === existingId);
        if (idx > -1) {
          newRoles[idx] = { 
            ...newRoles[idx], 
            name: item.row.name || newRoles[idx].name,
            description: item.row.description || newRoles[idx].description
          };
        }
      }
    });

    let nextId = newRoles.length ? Math.max(...newRoles.map(r => r.id || 0)) + 1 : 1;
    let added = 0, merged = toMerge.length, skipped = 0;
    
    toAdd.forEach(item => {
      const dup = this.checkDuplicate(item.row.name);
      if (dup) { skipped++; return; }
      newRoles.unshift({
        id: nextId++,
        name: item.row.name,
        description: item.row.description,
        status: 'Active',
        isActive: 'Y',
        createdAt: new Date().toISOString().split('T')[0]
      });
      added++;
    });

    this.roles = newRoles;
    console.log(`Imported ${added} added, ${merged} merged, ${this.importRows.length - added - merged} skipped`);
    this.importPreviewOpen = false;
    this.importRows = [];
  }

  closeImportPreview(): void {
    this.importPreviewOpen = false;
    this.importRows = [];
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate(['/' + page]);
  }

  closeViewRole(): void {
    this.viewRole = null;
  }

  toggleStatus(): void {
    this.formData.isActive = this.formData.isActive === 'Y' ? 'N' : 'Y';
    this.formData.status = this.formData.isActive === 'Y' ? 'Active' : 'Inactive';
  }

  getDuplicateCount(): number {
    return this.importRows.filter(r => r.isDuplicate).length;
  }
}
