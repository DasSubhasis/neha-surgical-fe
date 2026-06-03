import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
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
  private swUpdate = inject(SwUpdate);
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

    if (this.swUpdate.isEnabled) {
      // Prompt user to reload when a new app version is deployed
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        if (confirm('A new version is available. Reload to update?')) {
          window.location.reload();
        }
      });

      // Proactively check for updates every 30 minutes
      setInterval(() => this.swUpdate.checkForUpdate(), 30 * 60 * 1000);
    }
  }
}
