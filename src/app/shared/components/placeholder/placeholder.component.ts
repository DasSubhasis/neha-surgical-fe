import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  template: `
    <div class="p-2 md:p-4 h-full flex flex-col">
      <!-- Header Row with Breadcrumb -->
      <div class="flex flex-row justify-between items-center mb-2 md:mb-3 gap-2 min-h-0">
        <div class="flex items-center">
          <app-breadcrumb
            [currentPage]="currentPage"
            (navigate)="onBreadcrumbNavigate($event)"
          ></app-breadcrumb>
        </div>
      </div>

      <!-- Page Content Placeholder -->
      <div class="flex-1 bg-white rounded-lg shadow p-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ getPageTitle() }}</h2>
        <p class="text-gray-600">Content for {{ currentPage }} page will be displayed here.</p>
      </div>
    </div>
  `
})
export class PlaceholderComponent implements OnInit {
  currentPage: string = '';

  private pageTitles: { [key: string]: string } = {
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

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get the current page from the URL
    const url = this.router.url;
    this.currentPage = url.split('/').filter(s => s)[0] || '';
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate(['/' + page]);
  }

  getPageTitle(): string {
    return this.pageTitles[this.currentPage] || 
      this.currentPage.charAt(0).toUpperCase() + this.currentPage.slice(1).replace(/-/g, ' ');
  }
}
