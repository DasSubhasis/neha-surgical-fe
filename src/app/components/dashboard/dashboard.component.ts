import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { DoctorComponent } from '../doctor/doctor.component';
import { ItemComponent } from '../item/item.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, BreadcrumbComponent, DoctorComponent, ItemComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  currentDate = new Date();
  sidebarOpen: boolean = false;
  currentPage: string = 'dashboard';
  isFirstTimeLogin: boolean = false;

  // Page titles mapping
  private pageTitles: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'item': 'Items',
    'doctor': 'Doctor',
    'hospital': 'Hospital',
    'brand': 'Brand',
    'specification': 'Specification',
    'size': 'Size',
    'category': 'Category',
    'user': 'User',
    'assistant': 'Assistant',
    'order-entry': 'Order Entry',
    'order-reminder': 'Upcoming Orders',
    'assistant-assignment': 'Assistant Assignment',
    'material-transfer': 'Material Transfer',
    'assistant-operations': 'Assistant Operations',
    'consumption-billing': 'Consumption & Billing',
    'payment-collection': 'Payment Collection',
    'profile': 'Profile',
    'role': 'Role',
    'authorization': 'Authorization',
    'reports': 'Reports'
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isFirstTimeLogin = user.isFirstTimeLogin || false;
      }
    });

    // Also subscribe to isFirstTimeLogin$ for real-time updates
    this.authService.isFirstTimeLogin$.subscribe(isFirst => {
      this.isFirstTimeLogin = isFirst;
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onBreadcrumbNavigate(page: string): void {
    this.currentPage = page;
    // Add navigation logic here if needed
  }

  onNavigate(page: string): void {
    console.log('Navigate to:', page);
    this.currentPage = page;
    // Close sidebar on mobile after navigation
    this.sidebarOpen = false;
  }

  onPageChange(page: string): void {
    console.log('Page changed to:', page);
    this.currentPage = page;
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }

  getPageTitle(): string {
    return this.pageTitles[this.currentPage] || this.currentPage.charAt(0).toUpperCase() + this.currentPage.slice(1).replace(/-/g, ' ');
  }
}
