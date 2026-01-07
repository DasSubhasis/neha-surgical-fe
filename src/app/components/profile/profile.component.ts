import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './profile.component.html',
  styles: []
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get user from auth service
    this.user = this.authService.currentUser;
    
    // Debug: Log the user object to see the actual isActive value
    console.log('Profile - User data:', this.user);
    console.log('Profile - isActive value:', this.user?.isActive);
    console.log('Profile - isActive type:', typeof this.user?.isActive);
    
    // Also subscribe to changes
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  getStatusBadgeClass(): string {
    const isActive = this.user?.isActive;
    // Handle both 'Y' and true as active (convert to string for comparison)
    if (isActive === 'Y' || String(isActive) === 'true') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  }

  getStatusText(): string {
    const isActive = this.user?.isActive;
    // Handle both 'Y' and true as active (convert to string for comparison)
    return (isActive === 'Y' || String(isActive) === 'true') ? 'Active' : 'Inactive';
  }
}
