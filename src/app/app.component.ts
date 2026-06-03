import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './services/auth.service';
import { IdleService } from './services/idle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `
})
export class AppComponent implements OnInit {
  title = 'ns-app';
  private authService = inject(AuthService);
  private idleService = inject(IdleService);

  ngOnInit(): void {
    // Start/stop idle tracking based on auth state
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.idleService.start();
      } else {
        this.idleService.stop();
      }
    });
  }
}
