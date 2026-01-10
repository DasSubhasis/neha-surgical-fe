import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ROLE_IDS } from '../../../config/api.config';

interface SubMenuItem {
  key: string;
  label: string;
  icon: string;
  allowedRoles?: number[]; // Optional: if not specified, accessible to all roles
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  submenu: SubMenuItem[];
  allowedRoles?: number[]; // Optional: if not specified, accessible to all roles
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
  currentRoleId: number | undefined;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Get current user's roleId
    const currentUser = this.authService.currentUser;
    this.currentRoleId = currentUser?.roleId;

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
    { 
      key: 'dashboard', 
      label: 'Home', 
      icon: 'home', 
      submenu: [] 
    },
    {
      key: 'master-data', 
      label: 'Master Data', 
      icon: 'database',
      allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN], // Only Admin and Manager
      submenu: [        
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
      key: 'order', 
      label: 'Transactions', 
      icon: 'receipt', 
      submenu: [
        { 
          key: 'order-entry', 
          label: 'Order Entry', 
          icon: 'plus-circle',
          allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN] // Only Admin and Manager
        },
        { 
          key: 'assistant-assignment', 
          label: 'Assistant Assignment', 
          icon: 'handshake',
          allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN] // Only Admin and Manager
        },
        { 
          key: 'material-transfer', 
          label: 'Material Send', 
          icon: 'truck',
          allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN] // Only Admin and Manager
        },
        { 
          key: 'material-delivery', 
          label: 'Material Delivery', 
          icon: 'shipping-fast',
          allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN,ROLE_IDS.DELIVERY] // Only Admin and Manager
        },
        { 
          key: 'assistant-operations', 
          label: 'Assistant Operations', 
          icon: 'hospital-user' ,
          allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN,ROLE_IDS.FIELD_ASSISTANT]
        },
        { 
          key: 'consumption-billing', 
          label: 'Consumption & Billing', 
          icon: 'file-invoice',
          allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN,ROLE_IDS.FIELD_ASSISTANT] // Only Admin and Manager
        },
      ]
    },
    {
      key: 'settings', 
      label: 'Settings', 
      icon: 'user-cog',      
      submenu: [
        { key: 'user', label: 'User', icon: 'users' , allowedRoles: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN]},
        { key: 'role', label: 'Role', icon: 'shield', allowedRoles: [ROLE_IDS.SUPER_ADMIN] },
        { key: 'menu', label: 'Menu', icon: 'bars', allowedRoles: [ROLE_IDS.SUPER_ADMIN]  }
      ]
    },
  ];

  get filteredMenuItems(): MenuItem[] {
    if (!this.currentRoleId) {
      // If no role, only show dashboard
      return this.menuItems.filter(item => item.key === 'dashboard');
    }

    return this.menuItems
      .filter(item => {
        // If no allowedRoles specified, item is accessible to all
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
          return true;
        }
        // Check if current role is in allowedRoles
        return item.allowedRoles.includes(this.currentRoleId!);
      })
      .map(item => {
        // Filter submenu items based on role
        if (item.submenu && item.submenu.length > 0) {
          const filteredSubmenu = item.submenu.filter(subItem => {
            // If no allowedRoles specified, item is accessible to all
            if (!subItem.allowedRoles || subItem.allowedRoles.length === 0) {
              return true;
            }
            // Check if current role is in allowedRoles
            return subItem.allowedRoles.includes(this.currentRoleId!);
          });
          
          return { ...item, submenu: filteredSubmenu };
        }
        return item;
      })
      .filter(item => {
        // Remove parent menu items that have no accessible submenu items
        if (item.submenu && item.submenu.length === 0 && item.key !== 'dashboard') {
          return false;
        }
        return true;
      });
  }

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
