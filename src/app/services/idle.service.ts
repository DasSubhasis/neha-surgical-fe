import { Injectable, inject, NgZone } from '@angular/core';
import { fromEvent, merge, of, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Auto-logout after 60 minutes of no user activity
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

@Injectable({ providedIn: 'root' })
export class IdleService {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private subscription?: Subscription;

  start(): void {
    if (this.subscription) return;

    const activity$ = merge(...ACTIVITY_EVENTS.map(e => fromEvent(document, e)));

    // Emit immediately to kick off the first timer, then reset on every activity event
    this.ngZone.runOutsideAngular(() => {
      this.subscription = merge(of(null), activity$).pipe(
        switchMap(() => timer(IDLE_TIMEOUT_MS))
      ).subscribe(() => {
        this.ngZone.run(() => this.onIdle());
      });
    });
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  private onIdle(): void {
    this.stop();
    if (this.authService.isLoggedIn) {
      this.authService.logout().subscribe();
    }
  }
}
