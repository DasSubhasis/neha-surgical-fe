import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { 
  getCurrentApiConfig, 
  ENDPOINTS, 
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../config/api.config';

export interface User {
  systemUserId?: number;
  id?: string | number;
  email: string;
  name?: string;
  fullName?: string;
  role?: string;
  roleId?: number;
  roleName?: string;
  permissions?: number[];
  phoneNo?: string;
  clubCategory?: string;
  band?: string;
  isFirstTimeLogin?: boolean;
  isActive?: string;
}

export interface AuthResponse {
  message?: string;
  data?: {
    token?: string;
    refreshToken?: string;
    user?: {
      systemUserId: number;
      email: string;
      fullName: string;
      roleId: number;
      roleName: string;
      phoneNo: string;
      isActive: string;
    };
  };
}

export interface OtpResponse {
  message?: string;
  data?: {
    email: string;
    expiresIn?: string;
  };
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
      const permissionsStr = localStorage.getItem(STORAGE_KEYS.USER_PERMISSIONS);
      const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
      const roleId = parseInt(localStorage.getItem(STORAGE_KEYS.USER_ROLE_ID) || '0');
      
      const user: User = {
        id: localStorage.getItem(STORAGE_KEYS.USER_ID) || undefined,
        systemUserId: parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID) || '0'),
        email: localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '',
        name: localStorage.getItem(STORAGE_KEYS.USER_NAME) || '',
        fullName: localStorage.getItem(STORAGE_KEYS.USER_NAME) || '',
        roleId: roleId,
        roleName: localStorage.getItem(STORAGE_KEYS.USER_ROLE_NAME) || '',
        permissions: permissions,
        phoneNo: localStorage.getItem(STORAGE_KEYS.USER_PHONE) || '',
        clubCategory: localStorage.getItem(STORAGE_KEYS.USER_CLUB_CATEGORY) || undefined,
        band: localStorage.getItem(STORAGE_KEYS.USER_BAND) || undefined,
        isFirstTimeLogin: localStorage.getItem(STORAGE_KEYS.IS_FIRST_TIME_LOGIN) === 'true'
      };
      this.currentUserSubject.next(user);
      this.isFirstTimeLoginSubject.next(user.isFirstTimeLogin || false);
      
      // If permissions are empty but we have a roleId, fetch permissions
      if (permissions.length === 0 && roleId > 0) {
        console.log('Permissions empty, fetching for roleId:', roleId);
        this.fetchAndStoreRolePermissions(roleId).subscribe();
      }
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
        // Store OTP-related data
        localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email);
        localStorage.setItem(STORAGE_KEYS.OTP_SENT_TIME, new Date().toISOString());
        if (response.data?.expiresIn) {
          localStorage.setItem(STORAGE_KEYS.OTP_EXPIRES, response.data.expiresIn);
        }
      }),
      catchError(error => {
        console.error('Send OTP error:', error);
        return throwError(() => ({
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
      switchMap(response => {
        console.log('OTP verify response:', response);
        if (response.data) {
          this.handleAuthSuccess(response.data);
          
          // Fetch role permissions if roleId exists
          if (response.data.user?.roleId) {
            console.log('User has roleId:', response.data.user.roleId);
            return this.fetchAndStoreRolePermissions(response.data.user.roleId).pipe(
              map(() => response)
            );
          } else {
            console.warn('No roleId found in response.data.user');
          }
        }
        return of(response);
      }),
      catchError(error => {
        console.error('Verify OTP error:', error);
        return throwError(() => ({
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
        localStorage.setItem(STORAGE_KEYS.OTP_SENT_TIME, new Date().toISOString());
        if (response.data?.expiresIn) {
          localStorage.setItem(STORAGE_KEYS.OTP_EXPIRES, response.data.expiresIn);
        }
      }),
      catchError(error => {
        console.error('Resend OTP error:', error);
        return throwError(() => ({
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
        if (response.data) {
          this.handleAuthSuccess(response.data);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => ({
          message: error.error?.message || ERROR_MESSAGES.UNAUTHORIZED
        }));
      })
    );
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(data: { 
    token?: string; 
    refreshToken?: string; 
    user?: {
      systemUserId: number;
      email: string;
      fullName: string;
      roleId: number;
      roleName: string;
      phoneNo: string;
      isActive: string;
    };
  }): void {
    // Check if this is first time login
    const hasLoggedInBefore = localStorage.getItem(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE);
    const isFirstTime = !hasLoggedInBefore;

    // Store authentication data
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE, 'true');
    localStorage.setItem(STORAGE_KEYS.IS_FIRST_TIME_LOGIN, String(isFirstTime));

    // Store user data
    if (data.user) {
      const user: User = {
        systemUserId: data.user.systemUserId,
        id: String(data.user.systemUserId),
        email: data.user.email,
        name: data.user.fullName,
        fullName: data.user.fullName,
        roleId: data.user.roleId,
        roleName: data.user.roleName,
        role: data.user.roleName,
        phoneNo: data.user.phoneNo,
        isActive: data.user.isActive,
        isFirstTimeLogin: isFirstTime
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_ID, String(user.systemUserId));
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, user.fullName || '');
      localStorage.setItem(STORAGE_KEYS.USER_ROLE_ID, String(user.roleId || ''));
      localStorage.setItem(STORAGE_KEYS.USER_ROLE_NAME, user.roleName || '');
      localStorage.setItem(STORAGE_KEYS.USER_PHONE, user.phoneNo || '');

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
    localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name || '');

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
        if (response.data?.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
          }
        }
      }),
      catchError(error => {
        console.error('Refresh token error:', error);
        this.logout();
        return throwError(() => ({
          message: ERROR_MESSAGES.UNAUTHORIZED
        }));
      })
    );
  }

  /**
   * Fetch role permissions from the backend and store them
   */
  private fetchAndStoreRolePermissions(roleId: number): Observable<void> {
    const url = this.buildUrl(`/api/Roles/${roleId}`);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    console.log('Fetching permissions for roleId:', roleId);
    
    return this.http.get<any>(url, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      map((response: any) => {
        console.log('Role API response:', response);
        const permissions = response?.data?.permissions || response?.permissions || [];
        console.log('Extracted permissions:', permissions);
        
        // Store permissions in localStorage
        localStorage.setItem(STORAGE_KEYS.USER_PERMISSIONS, JSON.stringify(permissions));
        
        // Update current user with permissions
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          this.currentUserSubject.next({
            ...currentUser,
            permissions: permissions
          });
          console.log('Updated user with permissions:', permissions);
        }
      }),
      catchError(error => {
        console.error('Failed to fetch role permissions:', error);
        // Don't fail the login if permissions fetch fails
        return of(void 0);
      })
    );
  }
}
