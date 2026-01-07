import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<string>();

  openMenus: { [key: string]: boolean } = {};
  activeRoute: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Get initial route
    this.updateActiveRoute(this.router.url);

    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveRoute(event.url);
      });
  }

  updateActiveRoute(url: string): void {
    // Remove leading slash and extract route key
    const route = url.split('/')[1] || 'dashboard';
    this.activeRoute = route;

    // Auto-expand parent menu if submenu item is active
    this.menuItems.forEach(item => {
      if (item.submenu.some(sub => sub.key === this.activeRoute)) {
        this.openMenus[item.key] = true;
      }
    });
  }

  isMenuActive(menuKey: string): boolean {
    return this.activeRoute === menuKey;
  }

  menuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Home', icon: 'home', submenu: [] },
    {
      key: 'master-data', label: 'Master Data', icon: 'database', submenu: [        
        { key: 'doctor', label: 'Doctor', icon: 'user-nurse' },
        { key: 'hospital', label: 'Hospital', icon: 'hospital' },
        { key: 'brand', label: 'Brand', icon: 'tag' },
        { key: 'specification', label: 'Specification', icon: 'list' },
        { key: 'size', label: 'Size', icon: 'ruler' },
        { key: 'category', label: 'Category', icon: 'folder' },
        { key: 'item-group', label: 'Item Group', icon: 'boxes' },
        { key: 'item', label: 'Items', icon: 'sitemap' }
        
      ]
    },
    {
      key: 'order', label: 'Transactions', icon: 'receipt', submenu: [
        { key: 'order-entry', label: 'Order Entry', icon: 'plus-circle' },
        { key: 'assistant-assignment', label: 'Assistant Assignment', icon: 'handshake' },
        { key: 'material-transfer', label: 'Material Send', icon: 'truck' },
        { key: 'material-delivery', label: 'Material Delivery', icon: 'shipping-fast' },
        { key: 'assistant-operations', label: 'Assistant Operations', icon: 'hospital-user' },
        { key: 'consumption-billing', label: 'Consumption & Billing', icon: 'file-invoice' },
        { key: 'payment-collection', label: 'Payment Collection', icon: 'hand-holding-dollar' }
      ]
    },
    {
      key: 'reports', label: 'Reports', icon: 'chart-pie', submenu: [
        { key: 'order-reminder', label: 'Upcoming Orders', icon: 'clock' }
      ]
    },
    {
      key: 'settings', label: 'Settings', icon: 'user-cog', submenu: [
        { key: 'user', label: 'User', icon: 'users' },
        { key: 'role', label: 'Role', icon: 'shield' },
        { key: 'menu', label: 'Menu', icon: 'bars' }
      ]
    },
  ];

  toggleSubmenu(menuKey: string): void {
    this.openMenus[menuKey] = !this.openMenus[menuKey];
  }

  handleMenuClick(menuKey: string): void {
    this.activeRoute = menuKey;
    this.pageChange.emit(menuKey);
  }

  onBackdropClick(): void {
    this.toggle.emit();
  }

  isSubmenuOpen(menuKey: string): boolean {
    return this.openMenus[menuKey] || false;
  }
}
