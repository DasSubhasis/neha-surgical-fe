// API Configuration
// This file contains all API-related configuration settings

export interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
}

export interface ApiConfigMap {
  DEV: ApiConfig;
  PROD: ApiConfig;
  STAGING: ApiConfig;
}

// Base API URL - Change this to match your backend server
export const API_CONFIG: ApiConfigMap = {
  // Development environment
  DEV: {
    BASE_URL: 'http://localhost:5280/api',
    TIMEOUT: 30000, // 30 seconds
  },
  
  // Production environment
  PROD: {
    BASE_URL: 'https://your-production-api.com/api',
    TIMEOUT: 60000, // 60 seconds
  },
  
  // Staging environment
  STAGING: {
    BASE_URL: 'https://your-staging-api.com/api',
    TIMEOUT: 45000, // 45 seconds
  }
};

// Current environment - Change this based on your deployment
export type Environment = 'DEV' | 'STAGING' | 'PROD';
export const CURRENT_ENV: Environment = 'DEV';

// Get current API configuration
export const getCurrentApiConfig = (): ApiConfig => {
  return API_CONFIG[CURRENT_ENV];
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/Login',
    LOGOUT: '/Logout',
    REFRESH_TOKEN: '/RefreshToken',
    VERIFY_TOKEN: '/VerifyToken',
    SEND_OTP: '/SendOTP',
    VERIFY_OTP: '/VerifyOTP',
    RESEND_OTP: '/ResendOTP',
  },
  
  // User Management
  USERS: {
    BASE: '/users',
    LIST: '/users',
    GET_ALL: '/ApplicationUsers/GetAllUsers',
    CREATE: '/users',
    UPDATE: (id: string | number) => `/users/${id}`,
    DELETE: (id: string | number) => `/users/${id}`,
    PROFILE: (id: string | number = 'me') => `/users/${id}/profile`,
  },
  
  // Role Management
  ROLES: {
    BASE: '/roles',
    LIST: '/roles',
    CREATE: '/roles',
    UPDATE: (id: string | number) => `/roles/${id}`,
    DELETE: (id: string | number) => `/roles/${id}`,
  },
  
  // Doctor Management
  DOCTORS: {
    BASE: '/Doctors',
    LIST: (isActive?: boolean) => `/Doctors${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Doctors/${id}`,
    CREATE: '/Doctors',
    UPDATE: (id: string | number) => `/Doctors/${id}`,
    DELETE: (id: string | number) => `/Doctors/${id}`,
  },

  // Hospital Management
  HOSPITALS: {
    BASE: '/Hospitals',
    LIST: (isActive?: boolean) => `/Hospitals${isActive !== undefined ? `?isActive=${isActive ? 'Y' : 'N'}` : ''}`,
    GET: (id: string | number) => `/Hospitals/${id}`,
    CREATE: '/Hospitals',
    UPDATE: (id: string | number) => `/Hospitals/${id}`,
    DELETE: (id: string | number) => `/Hospitals/${id}`,
  },

  // Assistant Management
  ASSISTANTS: {
    BASE: '/Assistants',
    LIST: (isActive?: boolean) => `/Assistants${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Assistants/${id}`,
    CREATE: '/Assistants',
    UPDATE: (id: string | number) => `/Assistants/${id}`,
    DELETE: (id: string | number) => `/Assistants/${id}`,
  },

  // Item Management
  ITEMS: {
    BASE: '/Items',
    LIST: (isActive?: boolean) => `/Items${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Items/${id}`,
    CREATE: '/Items',
    UPDATE: (id: string | number) => `/Items/${id}`,
    DELETE: (id: string | number) => `/Items/${id}`,
  },

  // Brand Management
  BRANDS: {
    BASE: '/Brands',
    LIST: (isActive?: boolean) => `/Brands${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Brands/${id}`,
    CREATE: '/Brands',
    UPDATE: (id: string | number) => `/Brands/${id}`,
    DELETE: (id: string | number) => `/Brands/${id}`,
  },

  // Category Management
  CATEGORIES: {
    BASE: '/Categories',
    LIST: (isActive?: boolean) => `/Categories${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Categories/${id}`,
    CREATE: '/Categories',
    UPDATE: (id: string | number) => `/Categories/${id}`,
    DELETE: (id: string | number) => `/Categories/${id}`,
  },

  // Size Management
  SIZES: {
    BASE: '/Sizes',
    LIST: (isActive?: boolean) => `/Sizes${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Sizes/${id}`,
    CREATE: '/Sizes',
    UPDATE: (id: string | number) => `/Sizes/${id}`,
    DELETE: (id: string | number) => `/Sizes/${id}`,
  },

  // Specification Management
  SPECIFICATIONS: {
    BASE: '/Specifications',
    LIST: (isActive?: boolean) => `/Specifications${isActive !== undefined ? `?isActive=${isActive}` : ''}`,
    GET: (id: string | number) => `/Specifications/${id}`,
    CREATE: '/Specifications',
    UPDATE: (id: string | number) => `/Specifications/${id}`,
    DELETE: (id: string | number) => `/Specifications/${id}`,
  },

  // Order Management
  ORDERS: {
    BASE: '/Orders',
    LIST: '/Orders',
    GET: (id: string | number) => `/Orders/${id}`,
    CREATE: '/Orders',
    UPDATE: (id: string | number) => `/Orders/${id}`,
    DELETE: (id: string | number) => `/Orders/${id}`,
    REMINDER: '/Orders/Reminder',
  },

  // Assignment Management
  ASSIGNMENTS: {
    BASE: '/Assignments',
    LIST: '/Assignments',
    GET: (id: string | number) => `/Assignments/${id}`,
    CREATE: '/Assignments',
    UPDATE: (id: string | number) => `/Assignments/${id}`,
    DELETE: (id: string | number) => `/Assignments/${id}`,
  },

  // Material Transfer
  MATERIAL_TRANSFER: {
    BASE: '/MaterialTransfer',
    LIST: '/MaterialTransfer',
    GET: (id: string | number) => `/MaterialTransfer/${id}`,
    CREATE: '/MaterialTransfer',
    UPDATE: (id: string | number) => `/MaterialTransfer/${id}`,
    DELETE: (id: string | number) => `/MaterialTransfer/${id}`,
  },

  // Consumption & Billing
  CONSUMPTION_BILLING: {
    BASE: '/ConsumptionBilling',
    LIST: '/ConsumptionBilling',
    GET: (id: string | number) => `/ConsumptionBilling/${id}`,
    CREATE: '/ConsumptionBilling',
    UPDATE: (id: string | number) => `/ConsumptionBilling/${id}`,
    DELETE: (id: string | number) => `/ConsumptionBilling/${id}`,
  },

  // Payment Collection
  PAYMENTS: {
    BASE: '/Payments',
    LIST: '/Payments',
    GET: (id: string | number) => `/Payments/${id}`,
    CREATE: '/Payments',
    UPDATE: (id: string | number) => `/Payments/${id}`,
    DELETE: (id: string | number) => `/Payments/${id}`,
  },
  
  // Dashboard
  DASHBOARD: {
    BASE: '/dashboard',
    STATS: '/dashboard/stats',
    RECENT_ACTIVITY: '/dashboard/recent',
  },
  
  // File Management
  FILES: {
    UPLOAD: '/upload',
    DOWNLOAD: (id: string | number) => `/download/${id}`,
    DELETE: (id: string | number) => `/files/${id}`,
  },
  
  // Export
  EXPORT: {
    EXCEL: (type: string) => `/export/${type}/excel`,
    PDF: (type: string) => `/export/${type}/pdf`,
    CSV: (type: string) => `/export/${type}/csv`,
  },
  
  // System
  SYSTEM: {
    HEALTH: '/health',
    VERSION: '/version',
    SETTINGS: '/settings',
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request timeouts for different operations
export const TIMEOUTS = {
  SHORT: 5000,    // 5 seconds - for quick operations
  MEDIUM: 15000,  // 15 seconds - for normal operations
  LONG: 30000,    // 30 seconds - for file uploads
  EXTRA_LONG: 60000, // 60 seconds - for large exports
} as const;

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  XML: 'application/xml',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PDF: 'application/pdf',
  CSV: 'text/csv',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  SAVE_SUCCESS: 'Data saved successfully!',
  UPDATE_SUCCESS: 'Data updated successfully!',
  DELETE_SUCCESS: 'Data deleted successfully!',
  UPLOAD_SUCCESS: 'File uploaded successfully!',
  EXPORT_SUCCESS: 'Export completed successfully!',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  TOKEN_EXPIRES: 'tokenExpires',
  USER_ID: 'userId',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  USER_CLUB_CATEGORY: 'userClubCategory',
  USER_BAND: 'userBand',
  IS_AUTHENTICATED: 'isAuthenticated',
  IS_FIRST_TIME_LOGIN: 'isFirstTimeLogin',
  HAS_LOGGED_IN_BEFORE: 'hasLoggedInBefore',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  THEME_PREFERENCE: 'themePreference',
  LANGUAGE_PREFERENCE: 'languagePreference',
  OTP_EMAIL: 'otpEmail',
  OTP_SENT_TIME: 'otpSentTime',
  OTP_EXPIRES: 'otpExpires',
} as const;

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000,
} as const;

// Date/Time formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/dd/yyyy',
  DISPLAY_WITH_TIME: 'MM/dd/yyyy HH:mm:ss',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  FILE_TIMESTAMP: 'yyyyMMdd_HHmmss',
} as const;
