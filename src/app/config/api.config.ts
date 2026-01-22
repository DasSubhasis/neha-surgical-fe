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
    BASE_URL: 'https://nehaomapi.zicorpcloud.in/api',
    TIMEOUT: 60000, // 60 seconds
  },
  
  // Staging environment
  STAGING: {
    BASE_URL: 'https://your-staging-api.com/api',
    TIMEOUT: 45000, // 45 seconds
  }
};

// Current environment - Auto-detected based on hostname
export type Environment = 'DEV' | 'STAGING' | 'PROD';

// Auto-detect environment based on hostname
const getEnvironment = (): Environment => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production domain
    if (hostname === 'neha.zicorpcloud.in' || hostname.includes('zicorpcloud.in')) {
      return 'PROD';
    }
    
    // Staging domain (if you have one)
    if (hostname.includes('staging')) {
      return 'STAGING';
    }
    
    // Development (localhost or any other domain)
    return 'DEV';
  }
  
  // Default to DEV for SSR or non-browser environments
  return 'DEV';
};

export const CURRENT_ENV: Environment = getEnvironment();

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
    SEND_OTP: '/OtpAuth/send-otp',
    VERIFY_OTP: '/OtpAuth/verify-otp',
    RESEND_OTP: '/OtpAuth/send-otp',
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
  
  // Menu Management
  MENUS: {
    BASE: '/Menus',
    LIST: (isActive?: string) => `/Menus${isActive ? `?isActive=${isActive}` : ''}`,
    USER_MENUS: '/Menus/user-menus',
    GET: (id: string | number) => `/Menus/${id}`,
    CREATE: '/Menus',
    UPDATE: (id: string | number) => `/Menus/${id}`,
    DELETE: (id: string | number) => `/Menus/${id}`,
    USER_PERMISSIONS: (userId: number) => `/Menus/user-permissions/${userId}`,
    ASSIGN_USER_PERMISSIONS: (userId: number) => `/Menus/user-permissions/${userId}`,
  },
  
  // Doctor Management
  DOCTORS: {
    BASE: '/Doctors',
    LIST: (isActive?: boolean) => `/Doctors${isActive !== undefined ? `?isActive=${isActive ? 'Y' : 'N'}` : ''}`,
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

  // Assistant Assignment Management
  ASSISTANT_ASSIGNMENTS: {
    BASE: '/AssistantAssignments',
    LIST: (status?: string) => `/AssistantAssignments${status ? `?status=${status}` : ''}`,
    ASSISTANTS: '/AssistantAssignments/assistants',
    EXISTING: (assistantId: number) => `/AssistantAssignments/existing/${assistantId}`,
    EXISTING_BY_DATE: (assistantId: number | null, date: string) => `/AssistantAssignments/existing-by-date?${assistantId ? `assistantId=${assistantId}&` : ''}date=${date}`,
    ASSIGN: '/AssistantAssignments/assign',
    UNASSIGN: (orderId: number) => `/AssistantAssignments/${orderId}`,
  },

  // Sub-Assistant Assignment Management
  SUB_ASSISTANT_ASSIGNMENTS: {
    BASE: '/SubAssistantAssignments',
    GET: (id: number) => `/SubAssistantAssignments/${id}`,
    CREATE: '/SubAssistantAssignments',
    DELETE: (id: number) => `/SubAssistantAssignments/${id}`,
  },

  // Item Management
  ITEMS: {
    BASE: '/Items',
    LIST: (isActive?: boolean) => `/Items${isActive !== undefined ? `?isActive=${isActive ? 'Y' : 'N'}` : ''}`,
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

  // Item Group Management
  ITEM_GROUPS: {
    BASE: '/ItemGroups',
    LIST: '/ItemGroups',
    GET: (id: string | number) => `/ItemGroups/${id}`,
    CREATE: '/ItemGroups',
    UPDATE: (id: string | number) => `/ItemGroups/${id}`,
    DELETE: (id: string | number) => `/ItemGroups/${id}`,
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

  // Consumption Management
  CONSUMPTIONS: {
    BASE: '/Consumptions',
    CREATE: '/Consumptions',
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

  // Material Deliveries
  MATERIAL_DELIVERIES: {
    BASE: '/MaterialDeliveries',
    LIST: '/MaterialDeliveries',
    CREATE: '/MaterialDeliveries',
  },

  // Assistant Operations
  ASSISTANT_OPERATIONS: {
    BASE: '/AssistantOperations',
    CHECK_IN: '/AssistantOperations/CheckIn',
    CHECK_OUT: '/AssistantOperations/CheckOut',
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
    BASE: '/PaymentCollections',
    LIST: '/PaymentCollections',
    GET: (id: string | number) => `/PaymentCollections/${id}`,
    CREATE: '/PaymentCollections',
    UPDATE: (id: string | number) => `/PaymentCollections/${id}`,
    DELETE: (id: string | number) => `/PaymentCollections/${id}`,
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
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRES: 'tokenExpires',
  USER_ID: 'userId',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  USER_ROLE_ID: 'userRoleId',
  USER_ROLE_NAME: 'userRoleName',
  USER_PHONE: 'userPhone',
  USER_CLUB_CATEGORY: 'userClubCategory',
  USER_BAND: 'userBand',
  USER_PERMISSIONS: 'userPermissions',
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

// Role IDs - Update these based on your backend role IDs
export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  USER: 3,
  FIELD_ASSISTANT: 4,
  ACCOUNTANT: 5,
  DELIVERY: 6,
  // Add more roles as needed
} as const;

// Date/Time formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/dd/yyyy',
  DISPLAY_WITH_TIME: 'MM/dd/yyyy HH:mm:ss',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  FILE_TIMESTAMP: 'yyyyMMdd_HHmmss',
} as const;
