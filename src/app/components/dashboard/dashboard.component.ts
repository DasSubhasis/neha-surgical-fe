import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
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

    this.authService.isFirstTimeLogin$.subscribe(isFirst => {
      this.isFirstTimeLogin = isFirst;
    });
  }

  onBreadcrumbNavigate(page: string): void {
    this.router.navigate(['/' + page]);
  }
}
