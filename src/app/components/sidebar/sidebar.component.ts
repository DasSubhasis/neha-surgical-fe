import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SubMenuItem {
  key: string;
  label: string;
  icon: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  submenu: SubMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  @Input() isOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<string>();

  openMenus: { [key: string]: boolean } = {};

  menuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Home', icon: 'home', submenu: [] },
    {
      key: 'master-data', label: 'Master Data', icon: 'database', submenu: [
        { key: 'item', label: 'Items', icon: 'sitemap' },
        { key: 'doctor', label: 'Doctor', icon: 'user-nurse' },
        { key: 'hospital', label: 'Hospital', icon: 'hospital' },
        { key: 'brand', label: 'Brand', icon: 'tag' },
        { key: 'specification', label: 'Specification', icon: 'list' },
        { key: 'size', label: 'Size', icon: 'ruler' },
        { key: 'category', label: 'Category', icon: 'folder' },
        { key: 'user', label: 'User', icon: 'users' }
      ]
    },
    {
      key: 'order', label: 'Order Collection', icon: 'shopping-cart', submenu: [
        { key: 'order-entry', label: 'Order Entry', icon: 'plus-circle' },
        { key: 'order-reminder', label: 'Upcoming Orders', icon: 'clock' }
      ]
    },
    {
      key: 'assignment', label: 'Order Assignment', icon: 'folder-tree', submenu: [
        { key: 'assistant-assignment', label: 'Assistant Assignment', icon: 'handshake' }
      ]
    },
    {
      key: 'transfer', label: 'Material Movement', icon: 'arrows-exchange', submenu: [
        { key: 'material-transfer', label: 'Material Transfer', icon: 'truck' }
      ]
    },
    {
      key: 'operations', label: 'Assistant Operations', icon: 'clipboard', submenu: [
        { key: 'assistant-operations', label: 'Assistant Operations', icon: 'hospital-user' }
      ]
    },
    {
      key: 'billing', label: 'Consumption & Billing', icon: 'receipt', submenu: [
        { key: 'consumption-billing', label: 'Consumption & Billing', icon: 'file-invoice' }
      ]
    },
    {
      key: 'payment', label: 'Payment Collection', icon: 'money-bill', submenu: [
        { key: 'payment-collection', label: 'Payment Collection', icon: 'hand-holding-dollar' }
      ]
    },
    { key: 'reports', label: 'Reports', icon: 'chart-pie', submenu: [] }
  ];

  toggleSubmenu(menuKey: string): void {
    this.openMenus[menuKey] = !this.openMenus[menuKey];
  }

  handleMenuClick(menuKey: string): void {
    this.pageChange.emit(menuKey);
  }

  onBackdropClick(): void {
    this.toggle.emit();
  }

  isSubmenuOpen(menuKey: string): boolean {
    return this.openMenus[menuKey] || false;
  }
}
