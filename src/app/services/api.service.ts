import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, timeout, retry } from 'rxjs/operators';
import { 
  getCurrentApiConfig, 
  ENDPOINTS, 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  STORAGE_KEYS,
  TIMEOUTS 
} from '../config/api.config';
import { ConfigService } from './config.service';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  timeout?: number;
  retry?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string;
  private defaultTimeout: number;
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private configService: ConfigService) {
    // Use auto-detected environment config instead of appsettings.json
    const apiConfig = getCurrentApiConfig();
    this.baseUrl = apiConfig.BASE_URL; // Already includes /api
    this.defaultTimeout = apiConfig.TIMEOUT;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': '*/*'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      // Server-side error
      switch (error.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
          this.handleUnauthorized();
          break;
        case HTTP_STATUS.FORBIDDEN:
          errorMessage = ERROR_MESSAGES.FORBIDDEN;
          break;
        case HTTP_STATUS.NOT_FOUND:
          errorMessage = ERROR_MESSAGES.NOT_FOUND;
          break;
        case HTTP_STATUS.BAD_REQUEST:
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          errorMessage = error.error?.message || ERROR_MESSAGES.VALIDATION_ERROR;
          break;
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        case HTTP_STATUS.BAD_GATEWAY:
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          errorMessage = ERROR_MESSAGES.SERVER_ERROR;
          break;
        case 0:
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
          break;
        default:
          errorMessage = error.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      }
    }

    console.error('API Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      error: error.error
    });

    return throwError(() => ({ 
      message: errorMessage, 
      status: error.status,
      originalError: error 
    }));
  }

  /**
   * Handle unauthorized (401) responses
   */
  private handleUnauthorized(): void {
    // Clear auth data
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    
    // Redirect to login
    window.location.href = '/login';
  }

  /**
   * Generic request method
   */
  request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.getAuthHeaders();
    const requestTimeout = options.timeout || this.defaultTimeout;
    const retryCount = options.retry || 0;

    let request$: Observable<T>;

    switch (method) {
      case 'GET':
        request$ = this.http.get<T>(url, { headers, params: options.params });
        break;
      case 'POST':
        request$ = this.http.post<T>(url, body, { headers, params: options.params });
        break;
      case 'PUT':
        request$ = this.http.put<T>(url, body, { headers, params: options.params });
        break;
      case 'PATCH':
        request$ = this.http.patch<T>(url, body, { headers, params: options.params });
        break;
      case 'DELETE':
        request$ = this.http.delete<T>(url, { headers, params: options.params });
        break;
    }

    return request$.pipe(
      timeout(requestTimeout),
      retry(retryCount),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data: any, options?: RequestOptions): Observable<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any, options?: RequestOptions): Observable<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data: any, options?: RequestOptions): Observable<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.request<T>('DELETE', endpoint, null, options);
  }

  // ==================== Authentication ====================

  /**
   * Send OTP to email
   */
  sendOtp(email: string): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.AUTH.SEND_OTP, { email });
  }

  /**
   * Verify OTP
   */
  verifyOtp(email: string, otp: string): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  }

  /**
   * Resend OTP
   */
  resendOtp(email: string): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.AUTH.RESEND_OTP, { email });
  }

  /**
   * Login
   */
  login(credentials: { email: string; password?: string; otp?: string }): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
  }

  /**
   * Logout
   */
  logout(): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.AUTH.LOGOUT, {});
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.AUTH.REFRESH_TOKEN, {});
  }

  /**
   * Verify token
   */
  verifyToken(): Observable<ApiResponse> {
    return this.get<ApiResponse>(ENDPOINTS.AUTH.VERIFY_TOKEN);
  }

  // ==================== User Management ====================

  /**
   * Get all users with pagination and filtering
   */
  getAllUsers(params: {
    searchTerm?: string;
    roleID?: number;
    isActive?: boolean;
    channel_Type?: string;
    band_id?: number;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Observable<PaginatedResponse<any>> {
    const requestBody = {
      searchTerm: null,
      roleID: null,
      isActive: null,
      channel_Type: null,
      band_id: null,
      pageNumber: 1,
      pageSize: 10,
      ...params
    };
    return this.post<PaginatedResponse<any>>(ENDPOINTS.USERS.GET_ALL, requestBody);
  }

  /**
   * Get users list
   */
  getUsers(): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.USERS.LIST);
  }

  /**
   * Create user
   */
  createUser(userData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.USERS.CREATE, userData);
  }

  /**
   * Update user
   */
  updateUser(id: string | number, userData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.USERS.UPDATE(id), userData);
  }

  /**
   * Delete user
   */
  deleteUser(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.USERS.DELETE(id));
  }

  /**
   * Get user profile
   */
  getUserProfile(id: string | number = 'me'): Observable<any> {
    return this.get<any>(ENDPOINTS.USERS.PROFILE(id));
  }

  /**
   * Update user profile
   */
  updateUserProfile(profileData: any, id: string | number = 'me'): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.USERS.PROFILE(id), profileData);
  }

  // ==================== Role Management ====================

  /**
   * Get all roles
   */
  getRoles(): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.ROLES.LIST);
  }

  /**
   * Create role
   */
  createRole(roleData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.ROLES.CREATE, roleData);
  }

  /**
   * Update role
   */
  updateRole(id: string | number, roleData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.ROLES.UPDATE(id), roleData);
  }

  /**
   * Delete role
   */
  deleteRole(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.ROLES.DELETE(id));
  }

  // ==================== Doctor Management ====================

  /**
   * Get all doctors
   */
  getDoctors(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.DOCTORS.LIST(isActive));
  }

  /**
   * Get doctor by ID
   */
  getDoctor(id: string | number): Observable<any> {
    return this.get<any>(ENDPOINTS.DOCTORS.GET(id));
  }

  /**
   * Create doctor
   */
  createDoctor(doctorData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.DOCTORS.CREATE, doctorData);
  }

  /**
   * Update doctor
   */
  updateDoctor(id: string | number, doctorData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.DOCTORS.UPDATE(id), doctorData);
  }

  /**
   * Delete doctor
   */
  deleteDoctor(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.DOCTORS.DELETE(id));
  }

  // ==================== Hospital Management ====================

  /**
   * Get all hospitals
   */
  getHospitals(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.HOSPITALS.LIST(isActive));
  }

  /**
   * Get hospital by ID
   */
  getHospital(id: string | number): Observable<any> {
    return this.get<any>(ENDPOINTS.HOSPITALS.GET(id));
  }

  /**
   * Create hospital
   */
  createHospital(hospitalData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.HOSPITALS.CREATE, hospitalData);
  }

  /**
   * Update hospital
   */
  updateHospital(id: string | number, hospitalData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.HOSPITALS.UPDATE(id), hospitalData);
  }

  /**
   * Delete hospital
   */
  deleteHospital(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.HOSPITALS.DELETE(id));
  }

  // ==================== Item Management ====================

  /**
   * Get all items
   */
  getItems(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.ITEMS.LIST(isActive));
  }

  /**
   * Get item by ID
   */
  getItem(id: string | number): Observable<any> {
    return this.get<any>(ENDPOINTS.ITEMS.GET(id));
  }

  /**
   * Create item
   */
  createItem(itemData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.ITEMS.CREATE, itemData);
  }

  /**
   * Update item
   */
  updateItem(id: string | number, itemData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.ITEMS.UPDATE(id), itemData);
  }

  /**
   * Delete item
   */
  deleteItem(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.ITEMS.DELETE(id));
  }

  // ==================== Brand Management ====================

  /**
   * Get all brands
   */
  getBrands(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.BRANDS.LIST(isActive));
  }

  /**
   * Create brand
   */
  createBrand(brandData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.BRANDS.CREATE, brandData);
  }

  /**
   * Update brand
   */
  updateBrand(id: string | number, brandData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.BRANDS.UPDATE(id), brandData);
  }

  /**
   * Delete brand
   */
  deleteBrand(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.BRANDS.DELETE(id));
  }

  // ==================== Category Management ====================

  /**
   * Get all categories
   */
  getCategories(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.CATEGORIES.LIST(isActive));
  }

  /**
   * Create category
   */
  createCategory(categoryData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.CATEGORIES.CREATE, categoryData);
  }

  /**
   * Update category
   */
  updateCategory(id: string | number, categoryData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.CATEGORIES.UPDATE(id), categoryData);
  }

  /**
   * Delete category
   */
  deleteCategory(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.CATEGORIES.DELETE(id));
  }

  // ==================== Size Management ====================

  /**
   * Get all sizes
   */
  getSizes(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.SIZES.LIST(isActive));
  }

  /**
   * Create size
   */
  createSize(sizeData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.SIZES.CREATE, sizeData);
  }

  /**
   * Update size
   */
  updateSize(id: string | number, sizeData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.SIZES.UPDATE(id), sizeData);
  }

  /**
   * Delete size
   */
  deleteSize(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.SIZES.DELETE(id));
  }

  // ==================== Specification Management ====================

  /**
   * Get all specifications
   */
  getSpecifications(isActive?: boolean): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.SPECIFICATIONS.LIST(isActive));
  }

  /**
   * Create specification
   */
  createSpecification(specData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.SPECIFICATIONS.CREATE, specData);
  }

  /**
   * Update specification
   */
  updateSpecification(id: string | number, specData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.SPECIFICATIONS.UPDATE(id), specData);
  }

  /**
   * Delete specification
   */
  deleteSpecification(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.SPECIFICATIONS.DELETE(id));
  }

  // ==================== Order Management ====================

  /**
   * Get all orders
   */
  getOrders(): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.ORDERS.LIST);
  }

  /**
   * Get order by ID
   */
  getOrder(id: string | number): Observable<any> {
    return this.get<any>(ENDPOINTS.ORDERS.GET(id));
  }

  /**
   * Create order
   */
  createOrder(orderData: any): Observable<ApiResponse> {
    return this.post<ApiResponse>(ENDPOINTS.ORDERS.CREATE, orderData);
  }

  /**
   * Update order
   */
  updateOrder(id: string | number, orderData: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(ENDPOINTS.ORDERS.UPDATE(id), orderData);
  }

  /**
   * Delete order
   */
  deleteOrder(id: string | number): Observable<ApiResponse> {
    return this.delete<ApiResponse>(ENDPOINTS.ORDERS.DELETE(id));
  }

  /**
   * Get order reminders
   */
  getOrderReminders(): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.ORDERS.REMINDER);
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard data
   */
  getDashboardData(): Observable<any> {
    return this.get<any>(ENDPOINTS.DASHBOARD.BASE);
  }

  /**
   * Get dashboard stats
   */
  getDashboardStats(): Observable<any> {
    return this.get<any>(ENDPOINTS.DASHBOARD.STATS);
  }

  /**
   * Get recent activity
   */
  getRecentActivity(): Observable<any[]> {
    return this.get<any[]>(ENDPOINTS.DASHBOARD.RECENT_ACTIVITY);
  }

  // ==================== File Operations ====================

  /**
   * Upload file
   */
  uploadFile(file: File, endpoint: string = ENDPOINTS.FILES.UPLOAD): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Don't set Content-Type for FormData, let browser handle it

    return this.http.post<ApiResponse>(this.buildUrl(endpoint), formData, { headers }).pipe(
      timeout(TIMEOUTS.LONG),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Download file
   */
  downloadFile(fileId: string | number): Observable<Blob> {
    const url = this.buildUrl(ENDPOINTS.FILES.DOWNLOAD(fileId));
    const headers = this.getAuthHeaders();

    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      timeout(TIMEOUTS.LONG),
      catchError(error => this.handleError(error))
    );
  }

  // ==================== Export Operations ====================

  /**
   * Export to Excel
   */
  exportToExcel(dataType: string, params?: any): Observable<Blob> {
    let endpoint = ENDPOINTS.EXPORT.EXCEL(dataType);
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      endpoint += `?${queryString}`;
    }

    const url = this.buildUrl(endpoint);
    const headers = this.getAuthHeaders();

    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      timeout(TIMEOUTS.EXTRA_LONG),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Export to PDF
   */
  exportToPdf(dataType: string, params?: any): Observable<Blob> {
    let endpoint = ENDPOINTS.EXPORT.PDF(dataType);
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      endpoint += `?${queryString}`;
    }

    const url = this.buildUrl(endpoint);
    const headers = this.getAuthHeaders();

    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      timeout(TIMEOUTS.EXTRA_LONG),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Export to CSV
   */
  exportToCsv(dataType: string, params?: any): Observable<Blob> {
    let endpoint = ENDPOINTS.EXPORT.CSV(dataType);
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      endpoint += `?${queryString}`;
    }

    const url = this.buildUrl(endpoint);
    const headers = this.getAuthHeaders();

    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      timeout(TIMEOUTS.EXTRA_LONG),
      catchError(error => this.handleError(error))
    );
  }

  // ==================== System ====================

  /**
   * Health check
   */
  healthCheck(): Observable<any> {
    return this.get<any>(ENDPOINTS.SYSTEM.HEALTH, { timeout: TIMEOUTS.SHORT });
  }

  /**
   * Get API version
   */
  getVersion(): Observable<any> {
    return this.get<any>(ENDPOINTS.SYSTEM.VERSION);
  }

  /**
   * Get system settings
   */
  getSettings(): Observable<any> {
    return this.get<any>(ENDPOINTS.SYSTEM.SETTINGS);
  }
}
