import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import {
  PaymentCollectionService,
  PaymentCollection,
  PaymentFormData,
  Doctor,
  Hospital,
  User
} from '../../services/payment-collection.service';
import { ToastService } from '../../services/toast.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActionDropdownComponent, ActionItem } from '../action-dropdown/action-dropdown.component';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-payment-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, BreadcrumbComponent, ActionDropdownComponent],
  templateUrl: './payment-collection.component.html',
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
export class PaymentCollectionComponent implements OnInit {
  // Data
  payments: PaymentCollection[] = [];
  doctors: Doctor[] = [];
  hospitals: Hospital[] = [];
  users: User[] = [];
  currentUser: User | null = null;

  // Modal States
  isModalOpen = false;
  isViewModalOpen = false;
  editingPayment: PaymentCollection | null = null;
  viewRow: PaymentCollection | null = null;

  // Form Data
  form: PaymentFormData = {
    collectionDate: this.getCurrentDate(),
    collectedBy: '',
    doctorId: null,
    hospitalId: null,
    amount: 0,
    remarks: '',
    createdBy: 'current.user@example.com'
  };

  // Loading State
  isLoading = false;

  // AG Grid
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
  };

  // Action dropdown items
  actionItems: ActionItem[][] = [];

  constructor(
    private paymentCollectionService: PaymentCollectionService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.initializeColumnDefs();
  }

  ngOnInit(): void {
    this.loadData();
    this.initializeActionItems();
  }

  private initializeColumnDefs(): void {
    this.columnDefs = [
      { headerName: 'ID', field: 'collectionId', sortable: true, filter: 'agNumberColumnFilter', width: 80, minWidth: 80 },
      { headerName: 'Collection Date', field: 'collectionDate', sortable: true, filter: 'agDateColumnFilter', width: 140, minWidth: 140 },
      { headerName: 'Doctor', field: 'doctorName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 150 },
      { headerName: 'Hospital', field: 'hospitalName', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 150 },
      {
        headerName: 'Amount (₹)',
        field: 'amount',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 120,
        minWidth: 120,
        cellRenderer: (params: any) => `₹ ${(params.value || 0).toLocaleString('en-IN')}`
      },
      { headerName: 'Collected By', field: 'collectedBy', sortable: true, filter: 'agTextColumnFilter', flex: 1, minWidth: 140 },
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
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
        headerClass: 'ag-center-aligned-header ag-header-small-font',
        cellRenderer: (params: any) => {
          const container = document.createElement('div');
          container.className = 'flex items-center justify-center w-full h-full space-x-1';

          // Edit button
          const editBtn = document.createElement('button');
          editBtn.className = 'flex items-center justify-center text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded';
          editBtn.title = 'Edit';
          editBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>';
          editBtn.addEventListener('click', () => this.handleEdit(params.data));

          // View button
          const viewBtn = document.createElement('button');
          viewBtn.className = 'flex items-center justify-center text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded';
          viewBtn.title = 'View';
          viewBtn.innerHTML = '<svg class="w-4 h-4" fill="#52a447" viewBox="0 0 640 640"><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>';
          viewBtn.addEventListener('click', () => this.handleView(params.data));

          // Delete button
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'flex items-center justify-center text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded';
          deleteBtn.title = 'Delete';
          deleteBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
          deleteBtn.addEventListener('click', () => this.handleDelete(params.data.collectionId, `#${params.data.collectionId}`));

          container.appendChild(editBtn);
          container.appendChild(viewBtn);
          container.appendChild(deleteBtn);

          return container;
        }
      }
    ];
  }

  private initializeActionItems(): void {
    this.actionItems = [
      [
        {
          label: 'Add Payment Collection',
          onClick: () => this.handleCreate()
        },
        {
          label: 'Refresh',
          onClick: () => this.refreshData()
        }
      ],
      [
        {
          label: 'Export to Excel',
          onClick: () => this.handleExportCSV()
        }
      ]
    ];
  }

  loadData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.paymentCollectionService.getAllPayments().toPromise(),
      this.paymentCollectionService.getDoctors().toPromise(),
      this.paymentCollectionService.getHospitals().toPromise(),
      this.paymentCollectionService.getUsers().toPromise()
    ]).then(([payments, doctors, hospitals, users]) => {
      this.payments = payments || [];
      this.doctors = doctors || [];
      this.hospitals = hospitals || [];
      this.users = users || [];
      this.currentUser = this.users[0] || null;
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.toastService.error('Failed to load payment collections');
      this.isLoading = false;
    });
  }

  refreshData(): void {
    this.toastService.info('Refreshed');
    this.loadData();
  }

  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }

  handleCreate(): void {
    this.editingPayment = null;
    this.form = {
      collectionDate: this.getCurrentDate(),
      collectedBy: this.currentUser?.email || '',
      doctorId: null,
      hospitalId: null,
      amount: 0,
      remarks: '',
      createdBy: 'current.user@example.com'
    };
    this.isModalOpen = true;
  }

  handleEdit(payment: PaymentCollection): void {
    this.editingPayment = payment;
    this.form = {
      collectionDate: payment.collectionDate,
      collectedBy: payment.collectedBy,
      doctorId: payment.doctorId,
      hospitalId: payment.hospitalId,
      amount: payment.amount,
      remarks: payment.remarks || '',
      createdBy: payment.createdBy || 'current.user@example.com'
    };
    this.isModalOpen = true;
  }

  handleView(payment: PaymentCollection): void {
    this.viewRow = payment;
    this.isViewModalOpen = true;
  }

  handleDelete(id: number, displayText: string): void {
    if (confirm(`Delete payment collection #${id}?`)) {
      this.paymentCollectionService.deletePayment(id).subscribe({
        next: () => {
          this.payments = this.payments.filter(p => p.collectionId !== id);
          this.toastService.success('Payment collection deleted');
        },
        error: (error) => {
          console.error('Error deleting payment:', error);
          this.toastService.error('Failed to delete payment collection');
        }
      });
    }
  }

  handleExportCSV(): void {
    const headers = ['ID', 'Collection Date', 'Doctor', 'Hospital', 'Amount', 'Collected By', 'Remarks'];
    const csvData = this.payments.map(p => [
      p.collectionId,
      p.collectionDate,
      p.doctorName,
      p.hospitalName,
      p.amount,
      p.collectedBy,
      p.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell ?? '')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-collections_${this.getCurrentDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Exported');
  }

  validateForm(): boolean {
    if (!this.form.doctorId) {
      this.toastService.error('Doctor is required');
      return false;
    }
    if (!this.form.hospitalId) {
      this.toastService.error('Hospital is required');
      return false;
    }
    if (!this.form.collectionDate) {
      this.toastService.error('Collection Date is required');
      return false;
    }
    
    const collDate = new Date(this.form.collectionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (collDate > today) {
      this.toastService.error('Collection Date cannot be in the future');
      return false;
    }
    
    if (!this.form.amount || this.form.amount <= 0) {
      this.toastService.error('Amount must be greater than 0');
      return false;
    }
    if (!this.form.collectedBy?.trim()) {
      this.toastService.error('Collected By is required');
      return false;
    }
    if (this.form.remarks && this.form.remarks.length > 250) {
      this.toastService.error('Remarks cannot exceed 250 characters');
      return false;
    }
    return true;
  }

  handleSave(): void {
    if (!this.validateForm()) return;

    const doctorName = this.doctors.find(d => d.id === this.form.doctorId)?.name || '';
    const hospitalName = this.hospitals.find(h => h.id === this.form.hospitalId)?.name || '';

    if (this.editingPayment) {
      // For update, only send fields that changed
      const updateData: Partial<PaymentFormData> = {};
      if (this.form.collectionDate !== this.editingPayment.collectionDate) {
        updateData.collectionDate = this.form.collectionDate;
      }
      if (this.form.collectedBy !== this.editingPayment.collectedBy) {
        updateData.collectedBy = this.form.collectedBy;
      }
      if (this.form.doctorId !== this.editingPayment.doctorId) {
        updateData.doctorId = this.form.doctorId;
      }
      if (this.form.hospitalId !== this.editingPayment.hospitalId) {
        updateData.hospitalId = this.form.hospitalId;
      }
      if (this.form.amount !== this.editingPayment.amount) {
        updateData.amount = this.form.amount;
      }
      if (this.form.remarks !== this.editingPayment.remarks) {
        updateData.remarks = this.form.remarks;
      }

      this.paymentCollectionService.updatePayment(this.editingPayment.collectionId, updateData).subscribe({
        next: () => {
          this.toastService.success('Payment collection updated');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          this.toastService.error('Failed to update payment collection');
        }
      });
    } else {
      this.paymentCollectionService.createPayment(this.form).subscribe({
        next: () => {
          this.toastService.success('Payment collection recorded');
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          this.toastService.error('Failed to record payment collection');
        }
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingPayment = null;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.viewRow = null;
  }

  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate([`/${page}`]);
  }
}
