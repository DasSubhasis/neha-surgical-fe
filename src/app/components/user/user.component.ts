import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { UserService, User, UserFormData, ImportRow } from '../../services/user.service';
import { RoleService, Role } from '../../services/role.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './user.component.html',
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
export class UserComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  users: User[] = [];
  roles: Role[] = [];
  loading: boolean = false;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingUser: User | null = null;
  viewUser: User | null = null;

  // Import preview state
  importPreviewOpen: boolean = false;
  importRows: ImportRow[] = [];

  // Form data
  formData: UserFormData = {
    email: '',
    fullName: '',
    phone: '',
    employeeId: '',
    identifier: '',
    roleId: 0,
    status: 'Active',
    isActive: 'Y'
  };

  // Inline matches for duplicate detection
  inlineMatches: User[] = [];

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  userToDelete: User | null = null;

  // Validation
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  phonePattern = /^[6-9]\d{9}$/;

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Full Name', field: 'fullName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 150 },
    { headerName: 'Email', field: 'email', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 200 },
    { headerName: 'Phone', field: 'phone', sortable: true, filter: 'agTextColumnFilter', width: 120, minWidth: 120 },
    { 
      headerName: 'Role', 
      field: 'roleName', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      width: 130, 
      minWidth: 120,
      cellRenderer: (params: any) => {
        const roleName = params.data.roleName || 'N/A';
        return `<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">${roleName}</span>`;
      }
    },
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
        editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`;
        editBtn.onclick = () => this.openEditUser(params.data);

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.onclick = () => this.viewUser = params.data;

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
      { label: 'Add New User', icon: 'add', onClick: () => this.openCreateUser() },
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
    private userService: UserService,
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchRoles();
    this.fetchUsers();
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
    this.roleService.getAllRoles('Y').subscribe({
      next: (roles) => {
        console.log('Roles data:', roles);
        this.roles = roles.map((role: any) => ({
          id: role.roleId || role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions || [],
          status: role.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: role.isActive
        }));
        console.log('Mapped roles:', this.roles);
      },
      error: (error) => {
        console.error('Failed to fetch roles:', error);
        this.roles = [];
      }
    });
  }

  fetchUsers(): void {
    this.loading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.userService.getAllUsers('Y').subscribe({
      next: (users) => {
        this.users = users.map((user: any) => ({
          id: user.userId || user.id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          employeeId: user.employeeId,
          identifier: user.identifier,
          roleId: user.roleId,
          roleName: user.roleName || 'N/A',
          status: user.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }));
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Failed to fetch users:', error);
        this.loading = false;
        this.users = [];
        this.hasError = false;
      }
    });
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.id === roleId);
    return role?.name || 'N/A';
  }

  handleRefresh(): void {
    this.fetchRoles();
    this.fetchUsers();
  }

  retryFetch(): void {
    this.fetchUsers();
  }

  handleExportExcel(): void {
    const headers = ['Full Name', 'Email', 'Phone', 'Role', 'Status', 'Created At', 'Last Login'];
    const rows = this.users.map(u => [
      u.fullName,
      u.email,
      u.phone,
      u.roleName,
      u.status,
      u.createdAt || '',
      u.lastLogin || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Data exported successfully!');
  }

  handleBulkDelete(): void {
    console.log('Bulk delete functionality coming soon!');
  }

  openCreateUser(): void {
    this.editingUser = null;
    this.formData = {
      email: '',
      fullName: '',
      phone: '',
      employeeId: '',
      identifier: '',
      roleId: 0,
      status: 'Active',
      isActive: 'Y'
    };
    this.isModalOpen = true;
    this.inlineMatches = [];
  }

  openEditUser(user: User): void {
    this.editingUser = user;
    this.formData = {
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      employeeId: user.employeeId || '',
      identifier: user.identifier || '',
      roleId: user.roleId || 0,
      status: user.status || 'Active',
      isActive: user.isActive || 'Y'
    };
    this.isModalOpen = true;
    this.inlineMatches = [];
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingUser = null;
    this.formData = {
      email: '',
      fullName: '',
      phone: '',
      employeeId: '',
      identifier: '',
      roleId: 0,
      status: 'Active',
      isActive: 'Y'
    };
    this.inlineMatches = [];
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.userToDelete = null;
    this.showDeleteConfirm = false;
  }

  handleDeleteUser(): void {
    if (!this.userToDelete) return;

    const id = this.userToDelete.id;
    
    this.userService.deleteUser(id!).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.showDeleteConfirm = false;
        this.userToDelete = null;
        console.log('User deleted successfully!');
      },
      error: (error) => {
        console.warn('API delete failed, removing from local data:', error);
        this.users = this.users.filter(u => u.id !== id);
        this.showDeleteConfirm = false;
        this.userToDelete = null;
      }
    });
  }

  onFormChange(): void {
    if (!this.formData.email) {
      this.inlineMatches = [];
      return;
    }

    this.inlineMatches = this.users.filter(u => {
      const matchEmail = this.formData.email && u.email.toLowerCase().includes(this.formData.email.trim().toLowerCase());
      return matchEmail;
    }).slice(0, 5);
  }

  isSaveDisabled(): boolean {
    const basicValid = !!(this.formData.email?.trim() && 
                         this.formData.fullName?.trim() &&
                         this.formData.roleId > 0);
    
    if (!basicValid) return true;

    // Email validation
    if (!this.emailPattern.test(this.formData.email)) return true;

    // Phone validation (optional but must be valid if provided)
    if (this.formData.phone && !this.phonePattern.test(this.formData.phone)) return true;

    return false;
  }

  checkDuplicateEmail(email: string, excludeId: number | null = null): User | null {
    if (!email) return null;
    
    const lowerEmail = email.trim().toLowerCase();
    
    const found = this.users.find(u => {
      if (excludeId && u.id === excludeId) return false;
      return u.email && u.email.trim().toLowerCase() === lowerEmail;
    });
    
    return found || null;
  }

  handleSaveUser(): void {
    if (!this.formData.email?.trim()) {
      console.error('Email is mandatory');
      return;
    }
    if (!this.formData.fullName?.trim()) {
      console.error('Full name is mandatory');
      return;
    }
    if (!this.formData.roleId) {
      console.error('Role is mandatory');
      return;
    }

    const dupEmail = this.checkDuplicateEmail(
      this.formData.email, 
      this.editingUser?.id || null
    );

    if (dupEmail) {
      console.error('Email already exists:', dupEmail);
      this.viewUser = dupEmail;
      return;
    }

    this.persistUser();
  }

  persistUser(): void {
    this.loading = true;

    if (this.editingUser) {
      this.userService.updateUser(this.editingUser.id!, this.formData).subscribe({
        next: () => {
          console.log('User updated successfully!');
          this.fetchUsers();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API update failed, updating local data:', error);
          const index = this.users.findIndex(u => u.id === this.editingUser!.id);
          if (index > -1) {
            this.users[index] = {
              ...this.users[index],
              email: this.formData.email,
              fullName: this.formData.fullName,
              phone: this.formData.phone,
              roleId: this.formData.roleId,
              roleName: this.getRoleName(this.formData.roleId),
              status: this.formData.isActive === 'Y' ? 'Active' : 'Inactive',
              isActive: this.formData.isActive
            };
            this.users = [...this.users];
          }
          this.handleCloseModal();
          this.loading = false;
        }
      });
    } else {
      this.userService.createUser(this.formData).subscribe({
        next: () => {
          console.log('User created successfully!');
          this.fetchUsers();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API create failed, adding to local data:', error);
          const newId = this.users.length ? Math.max(...this.users.map(u => u.id || 0)) + 1 : 1;
          const newUser: User = {
            id: newId,
            username: this.formData.email.split('@')[0],
            email: this.formData.email,
            fullName: this.formData.fullName,
            phone: this.formData.phone,
            roleId: this.formData.roleId,
            roleName: this.getRoleName(this.formData.roleId),
            status: this.formData.isActive === 'Y' ? 'Active' : 'Inactive',
            isActive: this.formData.isActive,
            createdAt: new Date().toISOString().split('T')[0]
          };
          this.users = [newUser, ...this.users];
          this.handleCloseModal();
          this.loading = false;
        }
      });
    }
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
        username: r['username'] || r['user name'] || '',
        email: r['email'] || r['e-mail'] || '',
        fullName: r['full name'] || r['fullname'] || r['name'] || '',
        phone: r['phone'] || r['mobile'] || '',
        roleName: r['role'] || r['role name'] || ''
      };
      return { index: idx + 1, row, isDuplicate: false, duplicateAgainst: [], action: 'add' as const };
    });

    const afterDup = mapped.map(item => {
      const email = item.row.email;
      const lowerEmail = email ? email.trim().toLowerCase() : null;
      
      const dupAgainst: (number | string)[] = this.users
        .filter(u => {
          const matchEmail = lowerEmail && u.email && u.email.trim().toLowerCase() === lowerEmail;
          return matchEmail;
        })
        .map(u => u.id!);
      return { ...item, isDuplicate: dupAgainst.length > 0, duplicateAgainst: dupAgainst };
    });

    for (let i = 0; i < afterDup.length; i++) {
      for (let j = i + 1; j < afterDup.length; j++) {
        const a = afterDup[i].row, b = afterDup[j].row;
        const sameEmail = a.email && b.email && a.email.trim().toLowerCase() === b.email.trim().toLowerCase();
        if (sameEmail) {
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

    const newUsers = [...this.users];
    
    toMerge.forEach(item => {
      const existingId = item.duplicateAgainst.find(x => typeof x === 'number' || !String(x).startsWith('file-'));
      if (existingId && typeof existingId === 'number') {
        const idx = newUsers.findIndex(u => u.id === existingId);
        if (idx > -1) {
          newUsers[idx] = { 
            ...newUsers[idx], 
            email: item.row.email || newUsers[idx].email,
            fullName: item.row.fullName || newUsers[idx].fullName,
            phone: item.row.phone || newUsers[idx].phone
          };
        }
      }
    });

    let nextId = newUsers.length ? Math.max(...newUsers.map(u => u.id || 0)) + 1 : 1;
    let added = 0, merged = toMerge.length, skipped = 0;
    
    toAdd.forEach(item => {
      const dupEmail = this.checkDuplicateEmail(item.row.email);
      if (dupEmail) { skipped++; return; }
      
      // Try to find role by name
      const role = this.roles.find(r => r.name.toLowerCase() === item.row.roleName.toLowerCase());
      
      newUsers.unshift({
        id: nextId++,
        username: item.row.email.split('@')[0],
        email: item.row.email,
        fullName: item.row.fullName,
        phone: item.row.phone,
        roleId: role?.id || 4, // Default to Viewer if role not found
        roleName: role?.name || 'Viewer',
        status: 'Active',
        isActive: 'Y',
        createdAt: new Date().toISOString().split('T')[0]
      });
      added++;
    });

    this.users = newUsers;
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

  closeViewUser(): void {
    this.viewUser = null;
  }

  toggleStatus(): void {
    this.formData.isActive = this.formData.isActive === 'Y' ? 'N' : 'Y';
    this.formData.status = this.formData.isActive === 'Y' ? 'Active' : 'Inactive';
  }

  getDuplicateCount(): number {
    return this.importRows.filter(r => r.isDuplicate).length;
  }

  isEmailValid(): boolean {
    return this.emailPattern.test(this.formData.email);
  }

  isPhoneValid(): boolean {
    return !this.formData.phone || this.phonePattern.test(this.formData.phone);
  }
}
