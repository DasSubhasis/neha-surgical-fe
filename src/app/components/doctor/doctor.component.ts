import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';
import { DoctorService, Doctor, DoctorFormData } from '../../services/doctor.service';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './doctor.component.html',
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
export class DoctorComponent implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  doctors: Doctor[] = [];
  loading: boolean = true;
  gridReady: boolean = false;
  private gridApi!: GridApi;

  // Error state
  errorMessage: string = '';
  hasError: boolean = false;

  // Modal states
  isModalOpen: boolean = false;
  editingDoctor: Doctor | null = null;
  viewDoctor: Doctor | null = null;

  // Form data
  formData: DoctorFormData = {
    doctorName: '',
    contactNo: '',
    email: '',
    identifier: '',
    dob: '',
    doa: '',
    specialization: '',
    registrationNumber: '',
    location: '',
    remarks: '',
    isActive: 'Y'
  };

  // Inline matches for duplicate detection
  inlineMatches: Doctor[] = [];

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  doctorToDelete: Doctor | null = null;

  // AG Grid column definitions
  columnDefs: ColDef[] = [
    { headerName: 'Doctor Name', field: 'name', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 180 },
    { headerName: 'Identifier', field: 'identifier', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 120 },
    { headerName: 'Contact No', field: 'contact', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 120 },
    { headerName: 'Specialization', field: 'specialization', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 180 },
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
        editBtn.onclick = () => this.handleEditDoctor(params.data);

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex items-center justify-center text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200';
        viewBtn.title = 'View';
        viewBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`;
        viewBtn.onclick = () => this.viewDoctor = params.data;

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
      { label: 'Add New Doctor', icon: 'add', onClick: () => this.openCreateDoctor() },
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
    private doctorService: DoctorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchDoctors();
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

  fetchDoctors(): void {
    this.loading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.doctorService.getAllDoctors('Y').subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.result || (response as any)?.items || [];
        this.doctors = data.map((doc: any) => ({
          id: doc.doctorId || doc.id,
          doctorName: doc.doctorName,
          contactNo: doc.contactNo,
          name: doc.doctorName,
          contact: doc.contactNo,
          email: doc.email,
          dob: doc.dob,
          doa: doc.doa,
          specialization: doc.specialization,
          identifier: doc.identifier,
          remarks: doc.remarks,
          status: doc.isActive === 'Y' ? 'Active' : 'Inactive',
          isActive: doc.isActive
        } as any));
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Failed to fetch doctors:', error);
        this.loading = false;
        this.hasError = true;
        this.doctors = [];
        
        // Set appropriate error message
        if (error.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please check your network connection and try again.';
        } else if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view this data.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Server error occurred. Please try again later.';
        } else {
          this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
      }
    });
  }

  handleRefresh(): void {
    this.fetchDoctors();
  }

  retryFetch(): void {
    this.fetchDoctors();
  }

  handleExportExcel(): void {
    const headers = ['Doctor Name', 'Identifier', 'Contact No', 'Email', 'Specialization', 'Status'];
    const rows = this.doctors.map((d: any) => [
      d.name || d.doctorName,
      d.identifier || '',
      d.contact || d.contactNo || '',
      d.email || '',
      d.specialization || '',
      d.status || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `doctors_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Data exported successfully!');
  }

  handleBulkDelete(): void {
    console.log('Bulk delete functionality coming soon!');
  }

  openCreateDoctor(): void {
    this.editingDoctor = null;
    this.formData = {
      doctorName: '',
      contactNo: '',
      email: '',
      identifier: '',
      dob: '',
      doa: '',
      specialization: '',
      registrationNumber: '',
      location: '',
      remarks: '',
      isActive: 'Y'
    };
    this.isModalOpen = true;
    this.inlineMatches = [];
  }

  handleCloseModal(): void {
    this.isModalOpen = false;
    this.editingDoctor = null;
    this.formData = {
      doctorName: '',
      contactNo: '',
      email: '',
      identifier: '',
      dob: '',
      doa: '',
      specialization: '',
      registrationNumber: '',
      location: '',
      remarks: '',
      isActive: 'Y'
    };
    this.inlineMatches = [];
  }

  handleEditDoctor(doctor: any): void {
    this.editingDoctor = doctor;
    this.formData = {
      doctorName: doctor.name || doctor.doctorName,
      contactNo: doctor.contact || doctor.contactNo,
      email: doctor.email || '',
      identifier: doctor.identifier || '',
      dob: doctor.dob || '',
      doa: doctor.doa || '',
      specialization: doctor.specialization || '',
      registrationNumber: doctor.registrationNumber || '',
      location: doctor.location || '',
      remarks: doctor.remarks || '',
      isActive: doctor.isActive || 'Y'
    };
    this.isModalOpen = true;
    this.inlineMatches = [];
  }

  confirmDelete(doctor: any): void {
    this.doctorToDelete = doctor;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.doctorToDelete = null;
    this.showDeleteConfirm = false;
  }

  handleDeleteDoctor(): void {
    if (!this.doctorToDelete) return;

    const id = this.doctorToDelete.id;
    
    this.doctorService.deleteDoctor(id!).subscribe({
      next: () => {
        this.doctors = this.doctors.filter((d: any) => d.id !== id);
        this.showDeleteConfirm = false;
        this.doctorToDelete = null;
        console.log('Doctor deleted successfully!');
      },
      error: (error) => {
        console.warn('API delete failed, removing from local data:', error);
        // For demo mode, just remove from local array
        this.doctors = this.doctors.filter((d: any) => d.id !== id);
        this.showDeleteConfirm = false;
        this.doctorToDelete = null;
      }
    });
  }

  onFormChange(): void {
    // Inline duplicate detection
    if (!this.formData.doctorName && !this.formData.contactNo) {
      this.inlineMatches = [];
      return;
    }

    this.inlineMatches = this.doctors.filter((d: any) => {
      const name = d.name || d.doctorName || '';
      const contact = d.contact || d.contactNo || '';
      return (
        (this.formData.doctorName && name.toLowerCase().includes(this.formData.doctorName.toLowerCase())) ||
        (this.formData.contactNo && contact.includes(this.formData.contactNo))
      );
    }).slice(0, 5);
  }

  isValidContact(contact: string): boolean {
    return /^[6-9]\d{9}$/.test(String(contact));
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isSaveDisabled(): boolean {
    return !this.formData.doctorName?.trim() || 
           !this.formData.contactNo?.trim() || 
           !this.isValidContact(this.formData.contactNo) || 
           (this.formData.email && !this.isValidEmail(this.formData.email)) || 
           !this.formData.specialization?.trim() || 
           !this.formData.identifier?.trim();
  }

  checkDuplicate(name: string, contact: string, excludeId: number | null = null): Doctor | null {
    if (!name && !contact) return null;
    
    const lowerName = name ? name.trim().toLowerCase() : null;
    const strContact = contact ? String(contact) : null;
    
    const found = this.doctors.find((d: any) => {
      if (excludeId && d.id === excludeId) return false;
      const dName = (d.name || d.doctorName || '').trim().toLowerCase();
      const dContact = String(d.contact || d.contactNo || '');
      const sameName = lowerName && dName === lowerName;
      const sameContact = strContact && dContact === strContact;
      return sameName || sameContact;
    });
    
    return found || null;
  }

  handleSaveDoctor(): void {
    // Mandatory checks
    if (!this.formData.doctorName?.trim() || !this.formData.contactNo?.trim()) {
      console.error('Name and Contact are mandatory');
      return;
    }
    if (!this.isValidContact(this.formData.contactNo)) {
      console.error('Invalid contact number');
      return;
    }
    if (this.formData.email && !this.isValidEmail(this.formData.email)) {
      console.error('Invalid email');
      return;
    }
    if (!this.formData.specialization?.trim()) {
      console.error('Specialization is mandatory');
      return;
    }
    if (!this.formData.identifier?.trim()) {
      console.error('Identifier is mandatory');
      return;
    }

    const dup = this.checkDuplicate(
      this.formData.doctorName, 
      this.formData.contactNo, 
      this.editingDoctor?.id || null
    );

    if (dup) {
      console.error('Duplicate found:', dup);
      this.viewDoctor = dup as any;
      return;
    }

    this.persistDoctor();
  }

  persistDoctor(): void {
    this.loading = true;

    if (this.editingDoctor) {
      // Update existing doctor
      this.doctorService.updateDoctor(this.editingDoctor.id!, this.formData).subscribe({
        next: () => {
          console.log('Doctor updated successfully!');
          this.fetchDoctors();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API update failed, updating local data:', error);
          // For demo mode, update local array
          const index = this.doctors.findIndex((d: any) => d.id === this.editingDoctor!.id);
          if (index > -1) {
            this.doctors[index] = {
              ...this.doctors[index],
              ...this.formData,
              name: this.formData.doctorName,
              contact: this.formData.contactNo,
              status: this.formData.isActive === 'Y' ? 'Active' : 'Inactive'
            } as any;
            this.doctors = [...this.doctors];
          }
          this.handleCloseModal();
          this.loading = false;
        }
      });
    } else {
      // Create new doctor
      this.doctorService.createDoctor(this.formData).subscribe({
        next: () => {
          console.log('Doctor created successfully!');
          this.fetchDoctors();
          this.handleCloseModal();
        },
        error: (error) => {
          console.warn('API create failed, adding to local data:', error);
          // For demo mode, add to local array
          const newId = Math.max(...this.doctors.map((d: any) => d.id || 0)) + 1;
          const newDoctor = {
            id: newId,
            ...this.formData,
            name: this.formData.doctorName,
            contact: this.formData.contactNo,
            status: this.formData.isActive === 'Y' ? 'Active' : 'Inactive'
          };
          this.doctors = [newDoctor as any, ...this.doctors];
          this.handleCloseModal();
          this.loading = false;
        }
      });
    }
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate(['/' + page]);
  }

  closeViewDoctor(): void {
    this.viewDoctor = null;
  }

  toggleStatus(): void {
    this.formData.isActive = this.formData.isActive === 'Y' ? 'N' : 'Y';
  }
}
