import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
  currentUser: User | null = null;
  sidebarOpen: boolean = false;
  currentPage: string = 'dashboard';
  isFirstTimeLogin: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isFirstTimeLogin = user.isFirstTimeLogin || false;
      }
    });

    // Subscribe to isFirstTimeLogin$ for real-time updates
    this.authService.isFirstTimeLogin$.subscribe(isFirst => {
      this.isFirstTimeLogin = isFirst;
    });

    // Update currentPage based on route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      this.currentPage = this.getPageFromUrl(url);
    });

    // Set initial page from current URL
    this.currentPage = this.getPageFromUrl(this.router.url);
  }

  private getPageFromUrl(url: string): string {
    const segments = url.split('/').filter(s => s);
    return segments[0] || 'dashboard';
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onNavigate(page: string): void {
    console.log('Navigate to:', page);
    this.router.navigate(['/' + page]);
    this.sidebarOpen = false;
  }

  onPageChange(page: string): void {
    console.log('Page changed to:', page);
    this.router.navigate(['/' + page]);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }
}
