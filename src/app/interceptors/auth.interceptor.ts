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
    // Skip refresh for login/OTP endpoints
    if (request.url.includes('/Login') || 
        request.url.includes('/OtpAuth') || 
        request.url.includes('/RefreshToken')) {
      return throwError(() => new HttpErrorResponse({
        error: 'Authentication failed',
        status: 401,
        statusText: 'Unauthorized'
      }));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Lazy-load AuthService to avoid circular dependency
      if (!this.authService) {
        this.authService = this.injector.get(AuthService);
      }

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        // No refresh token available, logout immediately
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => new Error('Session expired - please login again'));
      }

      return this.authService.refreshToken().pipe(
        switchMap((response: AuthResponse) => {
          this.isRefreshing = false;
          
          if (response.data?.token) {
            this.refreshTokenSubject.next(response.data.token);
            // Retry the original request with new token
            return next.handle(this.addToken(request, response.data.token));
          }
          
          // Refresh failed, logout user
          this.authService!.logout();
          return throwError(() => new Error('Session expired - please login again'));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.authService!.logout();
          return throwError(() => new Error('Session expired - please login again'));
        })
      );
    } else {
      // Wait for token refresh to complete, then retry request
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
