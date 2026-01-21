import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService, AuthResponse } from '../services/auth.service';
import { STORAGE_KEYS, HTTP_STATUS } from '../config/api.config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private authService: AuthService | null = null;

  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get auth token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    // Clone request and add auth header if token exists
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === HTTP_STATUS.UNAUTHORIZED) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Lazy-load AuthService to avoid circular dependency
      if (!this.authService) {
        this.authService = this.injector.get(AuthService);
      }

      return this.authService.refreshToken().pipe(
        switchMap((response: AuthResponse) => {
          this.isRefreshing = false;
          
          if (response.data?.token) {
            this.refreshTokenSubject.next(response.data.token);
            return next.handle(this.addToken(request, response.data.token));
          }
          
          // Refresh failed, logout user
          this.authService!.logout();
          return throwError(() => new Error('Session expired'));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService!.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for token refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }
  }
}
