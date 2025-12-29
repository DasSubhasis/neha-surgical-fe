import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  getCurrentApiConfig, 
  ENDPOINTS, 
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../config/api.config';

export interface User {
  id?: string | number;
  email: string;
  name: string;
  role?: string;
  clubCategory?: string;
  band?: string;
  isFirstTimeLogin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: User;
    expiresAt?: string;
  };
  error?: string;
}

export interface OtpResponse {
  success: boolean;
  message?: string;
  otpExpires?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl: string;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  
  private isFirstTimeLoginSubject = new BehaviorSubject<boolean>(false);
  public isFirstTimeLogin$: Observable<boolean> = this.isFirstTimeLoginSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.baseUrl = getCurrentApiConfig().BASE_URL;
    this.loadUserFromStorage();
  }

  /**
   * Load user data from localStorage on app initialization
   */
  private loadUserFromStorage(): void {
    const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (isAuthenticated === 'true' && token) {
      const user: User = {
        id: localStorage.getItem(STORAGE_KEYS.USER_ID) || undefined,
        email: localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '',
        name: localStorage.getItem(STORAGE_KEYS.USER_NAME) || '',
        clubCategory: localStorage.getItem(STORAGE_KEYS.USER_CLUB_CATEGORY) || undefined,
        band: localStorage.getItem(STORAGE_KEYS.USER_BAND) || undefined,
        isFirstTimeLogin: localStorage.getItem(STORAGE_KEYS.IS_FIRST_TIME_LOGIN) === 'true'
      };
      this.currentUserSubject.next(user);
      this.isFirstTimeLoginSubject.next(user.isFirstTimeLogin || false);
    }
  }

  /**
   * Get authentication headers
   */
  getAuthHeader(): { [key: string]: string } {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Build API URL
   */
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null && 
           localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isFirstTimeLogin(): boolean {
    return this.isFirstTimeLoginSubject.value;
  }

  /**
   * Send OTP to email
   */
  sendOtp(email: string): Observable<OtpResponse> {
    const url = this.buildUrl(ENDPOINTS.AUTH.SEND_OTP);
    
    return this.http.post<OtpResponse>(url, { email }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      tap(response => {
        if (response.success) {
          // Store OTP-related data
          localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email);
          localStorage.setItem(STORAGE_KEYS.OTP_SENT_TIME, new Date().toISOString());
          if (response.otpExpires) {
            localStorage.setItem(STORAGE_KEYS.OTP_EXPIRES, response.otpExpires);
          }
        }
      }),
      catchError(error => {
        console.error('Send OTP error:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || ERROR_MESSAGES.NETWORK_ERROR
        }));
      })
    );
  }

  /**
   * Verify OTP
   */
  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    const url = this.buildUrl(ENDPOINTS.AUTH.VERIFY_OTP);
    
    return this.http.post<AuthResponse>(url, { email, otp }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      }),
      catchError(error => {
        console.error('Verify OTP error:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR
        }));
      })
    );
  }

  /**
   * Resend OTP
   */
  resendOtp(email: string): Observable<OtpResponse> {
    const url = this.buildUrl(ENDPOINTS.AUTH.RESEND_OTP);
    
    return this.http.post<OtpResponse>(url, { email }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem(STORAGE_KEYS.OTP_SENT_TIME, new Date().toISOString());
          if (response.otpExpires) {
            localStorage.setItem(STORAGE_KEYS.OTP_EXPIRES, response.otpExpires);
          }
        }
      }),
      catchError(error => {
        console.error('Resend OTP error:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || ERROR_MESSAGES.NETWORK_ERROR
        }));
      })
    );
  }

  /**
   * Login with credentials (email/password or email/OTP)
   */
  login(email: string, passwordOrOtp: string, isOtp: boolean = false): Observable<AuthResponse> {
    const url = this.buildUrl(ENDPOINTS.AUTH.LOGIN);
    const body = isOtp 
      ? { email, otp: passwordOrOtp }
      : { email, password: passwordOrOtp };
    
    return this.http.post<AuthResponse>(url, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || ERROR_MESSAGES.UNAUTHORIZED
        }));
      })
    );
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(data: { token?: string; user?: User; expiresAt?: string }): void {
    // Check if this is first time login
    const hasLoggedInBefore = localStorage.getItem(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE);
    const isFirstTime = !hasLoggedInBefore;

    // Store authentication data
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    }
    if (data.expiresAt) {
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, data.expiresAt);
    }
    
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE, 'true');
    localStorage.setItem(STORAGE_KEYS.IS_FIRST_TIME_LOGIN, String(isFirstTime));

    // Store user data
    if (data.user) {
      const user: User = {
        ...data.user,
        isFirstTimeLogin: isFirstTime
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_ID, String(user.id || ''));
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);
      if (user.clubCategory) {
        localStorage.setItem(STORAGE_KEYS.USER_CLUB_CATEGORY, user.clubCategory);
      }
      if (user.band) {
        localStorage.setItem(STORAGE_KEYS.USER_BAND, user.band);
      }

      this.currentUserSubject.next(user);
      this.isFirstTimeLoginSubject.next(isFirstTime);
    }

    // Clear OTP data
    localStorage.removeItem(STORAGE_KEYS.OTP_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.OTP_SENT_TIME);
    localStorage.removeItem(STORAGE_KEYS.OTP_EXPIRES);
  }

  /**
   * Demo login (for development without API)
   */
  demoLogin(email: string): boolean {
    const hasLoggedInBefore = localStorage.getItem(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE);
    const isFirstTime = !hasLoggedInBefore;

    const user: User = {
      id: '1',
      email: email,
      name: email.split('@')[0],
      isFirstTimeLogin: isFirstTime
    };

    // Store auth data
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'demo-token-' + Date.now());
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE, 'true');
    localStorage.setItem(STORAGE_KEYS.IS_FIRST_TIME_LOGIN, String(isFirstTime));
    localStorage.setItem(STORAGE_KEYS.USER_ID, String(user.id));
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);

    this.currentUserSubject.next(user);
    this.isFirstTimeLoginSubject.next(isFirstTime);

    return true;
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    // Clear all auth-related data from localStorage
    this.clearAuthData();
    
    // Update subjects
    this.currentUserSubject.next(null);
    this.isFirstTimeLoginSubject.next(false);

    // Navigate to login
    this.router.navigate(['/login']);

    // If we have a token, try to call logout API (fire and forget)
    if (token) {
      const url = this.buildUrl(ENDPOINTS.AUTH.LOGOUT);
      return this.http.post(url, {}, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        })
      }).pipe(
        catchError(() => of({ success: true })) // Ignore logout API errors
      );
    }

    return of({ success: true });
  }

  /**
   * Clear all authentication data from localStorage
   */
  private clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.IS_FIRST_TIME_LOGIN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_CLUB_CATEGORY);
    localStorage.removeItem(STORAGE_KEYS.USER_BAND);
    localStorage.removeItem(STORAGE_KEYS.OTP_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.OTP_SENT_TIME);
    localStorage.removeItem(STORAGE_KEYS.OTP_EXPIRES);
    // Keep HAS_LOGGED_IN_BEFORE for tracking first time login
  }

  /**
   * Verify token validity
   */
  verifyToken(): Observable<boolean> {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) {
      return of(false);
    }

    // Check if token is expired locally
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);
    if (expiresAt && new Date(expiresAt) < new Date()) {
      this.clearAuthData();
      return of(false);
    }

    // Verify with API
    const url = this.buildUrl(ENDPOINTS.AUTH.VERIFY_TOKEN);
    return this.http.get<{ valid: boolean }>(url, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      map(response => response.valid),
      catchError(() => {
        this.clearAuthData();
        return of(false);
      })
    );
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const url = this.buildUrl(ENDPOINTS.AUTH.REFRESH_TOKEN);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    return this.http.post<AuthResponse>(url, {}, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
          if (response.data.expiresAt) {
            localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, response.data.expiresAt);
          }
        }
      }),
      catchError(error => {
        console.error('Refresh token error:', error);
        this.logout();
        return throwError(() => ({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        }));
      })
    );
  }
}
