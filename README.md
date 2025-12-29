# SCOPE OF WORK (SOW)

---

## **NEHA SURGICAL - SURGICAL EQUIPMENT MANAGEMENT SYSTEM**

---

**Document Version:** 1.0  
**Date:** December 29, 2025  
**Prepared By:** ZiCorp Technologies  
**Client:** Neha Surgical  
**Project Type:** Enterprise Web Application  

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Scope Inclusions](#2-scope-inclusions)
3. [Scope Exclusions](#3-scope-exclusions)
4. [Technical Architecture](#4-technical-architecture)
5. [Security Implementation](#5-security-implementation)
6. [Performance & Scalability](#6-performance--scalability)
7. [Deployment Details](#7-deployment-details)
8. [Testing & Quality Assurance](#8-testing--quality-assurance)
9. [Documentation & Handover](#9-documentation--handover)
10. [Maintenance & Support](#10-maintenance--support-optional)
11. [Assumptions & Dependencies](#11-assumptions--dependencies)
12. [Future Enhancement Scope](#12-future-enhancement-scope)

---

# 1. PROJECT OVERVIEW

## 1.1 Project Name
**Neha Surgical - Surgical Equipment Management System (NS-SEMS)**

## 1.2 Project Objective
To develop a comprehensive, enterprise-grade web application that enables Neha Surgical to efficiently manage their end-to-end surgical equipment business operations including:
- Order collection and management for surgical procedures
- Material/inventory tracking and transfers
- Field assistant operations and assignment
- Consumption tracking and billing
- Payment collection and financial tracking
- Master data management for doctors, hospitals, items, and users

## 1.3 Business Problem Solved
The system addresses the following critical business challenges:

| Challenge | Solution Provided |
|-----------|-------------------|
| Manual order tracking | Centralized digital order management with status tracking |
| Uncoordinated field operations | Assistant assignment with conflict detection and GPS check-in/out |
| Inventory visibility gaps | Real-time material transfer tracking and consumption recording |
| Billing delays | Streamlined consumption-to-billing workflow |
| Data silos | Unified database for doctors, hospitals, items, and transactions |
| Lack of accountability | Complete audit trails and activity logging |
| Paper-based processes | Digital-first approach with export capabilities |

## 1.4 Target Users

| User Role | Description | Primary Functions |
|-----------|-------------|-------------------|
| **Administrator** | System administrators with full access | User management, role configuration, all modules access |
| **Manager** | Operations managers | Order oversight, assignment approvals, reporting |
| **Field Assistant** | On-ground staff at hospitals | Check-in/out, consumption recording, delivery confirmation |
| **Sales Executive** | Sales and collection staff | Order entry, payment collection, customer management |
| **Regular User** | Standard operational users | Limited access based on assigned permissions |

## 1.5 Industry Domain
**Healthcare & Medical Equipment Supply Chain**
- Surgical implant distribution
- Orthopedic equipment (Spine, Cervical, Dorsolumbar implants)
- Hospital/OT consumables management

## 1.6 High-Level Solution Summary
The Neha Surgical Management System is a modern, responsive Single Page Application (SPA) built using React 19 with the following key characteristics:

- **Modern UI/UX**: Professional dashboard interface with Tailwind CSS styling
- **Enterprise Data Grid**: AG Grid integration for advanced data management
- **Secure Authentication**: Email-based OTP verification system
- **Role-Based Access**: Granular permission controls per user
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Operations**: Instant status updates and toast notifications
- **Audit Compliance**: Complete activity logging for all transactions

---

# 2. SCOPE INCLUSIONS

## 2.1 Core Modules

### 2.1.1 Authentication & Security Module
| Feature | Description |
|---------|-------------|
| Email-based OTP Login | Secure 6-digit OTP sent to registered email |
| OTP Verification | Time-limited verification (5 minutes expiry) |
| Token Management | JWT-based secure session tokens (24-hour validity) |
| Session Persistence | LocalStorage-based session management |
| Auto-logout | Automatic session termination on token expiry |
| Resend OTP | Ability to request new OTP codes |
| First-time Login Detection | Welcome messages for new users |

### 2.1.2 Dashboard Module
| Feature | Description |
|---------|-------------|
| Welcome Screen | Personalized greeting with company branding |
| Navigation Hub | Central access point to all modules |
| Quick Statistics | Key metrics display (planned for enhancement) |
| Recent Activity | Quick view of latest transactions |

### 2.1.3 Master Data Module

#### 2.1.3.1 Doctor Management
- Complete CRUD operations (Create, Read, Update, Delete)
- Doctor profile: Name, Contact, Email, DOB, DOA, Specialization, Identifier
- Status management (Active/Inactive)
- Duplicate detection with inline matching
- Bulk import with preview and merge options
- Excel/CSV export functionality
- API integration with backend services

#### 2.1.3.2 Hospital Management
- Hospital profile management: Name, Address, Contact Person, Contact Number
- Multi-contact support per hospital (Name, Mobile, Email, Location, Remarks)
- Status tracking (Active/Inactive)
- Duplicate detection and validation
- Export to Excel/CSV

#### 2.1.3.3 Item/Product Catalog Management
- Hierarchical catalog structure: Category → Subcategory → Items
- Item attributes: Name, Sizes, Material, Model
- Pre-configured categories:
  - Spine Implants (Screws, Rods, Plates, Cages)
  - Cervical Implants
  - Dorsolumbar Implants
- Size variants management
- Specification tracking

#### 2.1.3.4 User Management
- User profile: Name, Employee ID, Email, Contact Number
- Role assignment (Admin, Manager, User)
- Menu-wise permission configuration
- Permission groups:
  - Home/Dashboard
  - Master Data (Items, Doctor, Hospital, User)
  - Order Collection (Order Entry, Upcoming Orders)
  - Order Assignment
  - Material Movement
  - Assistant Operations
  - Consumption & Billing
  - Payment Collection
  - Reports
- CSV import/export for bulk operations

#### 2.1.3.5 Additional Master Data
- **Brand Management**: Brand catalog maintenance
- **Specification Management**: Product specification definitions
- **Size Management**: Size variants catalog
- **Category Management**: Product category hierarchy

### 2.1.4 Order Collection Module

#### 2.1.4.1 Order Entry
- New order creation with comprehensive details:
  - Order Number (auto-generated)
  - Order Date
  - Doctor Selection
  - Hospital Selection
  - Operation Date & Time
  - Material Send Date
  - Item Groups Selection
  - Individual Items Selection
  - Remarks
- Multi-select item groups support
- Order status workflow (Draft → Booked → Assigned → Completed)
- Complete audit trail with timestamp logging
- View, Edit, Delete operations
- Export functionality

#### 2.1.4.2 Upcoming Orders / Order Reminder
- View orders scheduled for upcoming dates
- Filter by date range
- Quick status overview
- Reminder functionality for pending actions

### 2.1.5 Order Assignment Module
- Assistant assignment to orders
- Assignment details:
  - Order selection (unassigned orders)
  - Assistant selection from available pool
  - Reporting time configuration
  - Assignment remarks
- **Conflict Detection System**:
  - Schedule overlap checking
  - Travel time consideration (±60 minutes buffer)
  - Override capability with confirmation
- Status tracking (Pending → Assigned)
- View assignment history

### 2.1.6 Material Movement Module
- Material transfer tracking for orders
- Transfer workflow:
  - View booked orders pending material send
  - Mark materials as dispatched
  - Record delivery date
  - Upload delivery proof (document/image)
  - Add transfer remarks
- Status progression: Booked → Material Delivered
- Date-based filtering for dispatch board
- Export to CSV

### 2.1.7 Assistant Operations Module
- Field operations management
- **Check-in/Check-out System**:
  - GPS coordinate capture (if available)
  - Timestamp recording
  - Comments/notes entry
- Operation timeline tracking
- Status progression: Scheduled → Checked-in → Operation Started → Completed
- Pull-to-refresh functionality for mobile
- Search and filter capabilities:
  - By Order Number
  - By Hospital Name
  - By Doctor Name
  - By Status
- Mobile-optimized card-based interface

### 2.1.8 Consumption & Billing Module

#### 2.1.8.1 Consumption Entry
- Record items consumed during surgery
- Consumption details:
  - Item selection from order items
  - Quantity consumed
  - Unit of measure
  - Manual item addition capability
- Item group filtering
- No-consumption option with justification

#### 2.1.8.2 Billing Management
- Map consumption to billing items
- Billing entry:
  - Item name
  - Quantity
  - Rate per unit
  - Automatic total calculation
- Manual billing item addition
- Attachment support:
  - Signed invoice upload
  - Supporting documents
- Remarks field
- Pre-billing preview
- Status tracking: Not Billed → Pre-Billing → Completed

### 2.1.9 Payment Collection Module
- Payment receipt management
- Receipt details:
  - Receipt Number (auto-generated)
  - Collection Date
  - Doctor association
  - Hospital association
  - Amount collected
  - Collected by (User)
  - Remarks
- Payment status tracking
- Audit trail for all transactions
- Export to CSV

## 2.2 Key Features

### 2.2.1 Data Grid Features (AG Grid)
- ✅ Column sorting (ascending/descending)
- ✅ Column filtering (text, number, date filters)
- ✅ Column resizing
- ✅ Pagination support
- ✅ Row selection
- ✅ Cell rendering customization
- ✅ Status badges with color coding
- ✅ Action columns with inline buttons
- ✅ Pinned columns support

### 2.2.2 User Interface Features
- ✅ Professional modal dialogs with gradient headers
- ✅ Toast notifications (success, error, info, warning)
- ✅ Confirmation dialogs using SweetAlert2
- ✅ Dynamic breadcrumb navigation
- ✅ Collapsible sidebar menu
- ✅ Action dropdown menus with icons and badges
- ✅ Form validation with inline error messages
- ✅ Loading states and spinners
- ✅ Click-outside-to-close behavior
- ✅ Responsive design (mobile/tablet/desktop)

### 2.2.3 Data Operations
- ✅ Real-time form validation
- ✅ Duplicate detection with suggestions
- ✅ Bulk import with preview and conflict resolution
- ✅ Excel/CSV export with date stamping
- ✅ Search functionality across all lists
- ✅ Date range filtering

## 2.3 User Roles & Permissions

### Role Hierarchy
```
Administrator (Full Access)
    ├── All Master Data
    ├── All Transactions
    ├── User Management
    ├── Reports
    └── System Settings

Manager (Operational Access)
    ├── Dashboard
    ├── Order Entry
    ├── Upcoming Orders
    ├── Consumption & Billing
    └── Reports

User (Limited Access)
    ├── Dashboard
    ├── Order Entry
    └── Upcoming Orders
```

### Permission Matrix

| Module | Admin | Manager | User |
|--------|-------|---------|------|
| Dashboard | ✅ | ✅ | ✅ |
| Items | ✅ | ❌ | ❌ |
| Doctor | ✅ | ❌ | ❌ |
| Hospital | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Order Entry | ✅ | ✅ | ✅ |
| Upcoming Orders | ✅ | ✅ | ✅ |
| Assistant Assignment | ✅ | ✅ | ❌ |
| Material Transfer | ✅ | ✅ | ❌ |
| Assistant Operations | ✅ | ✅ | ❌ |
| Consumption & Billing | ✅ | ✅ | ❌ |
| Payment Collection | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |

## 2.4 Functional Workflows

### 2.4.1 Order-to-Delivery Workflow

```
1. ORDER CREATION
   └── Sales Executive creates order with doctor, hospital, items
   
2. ORDER BOOKING
   └── Order confirmed and marked as "Booked"
   
3. ASSISTANT ASSIGNMENT
   └── Manager assigns field assistant with reporting time
   └── System checks for schedule conflicts
   
4. MATERIAL DISPATCH
   └── Warehouse dispatches materials
   └── Status updated to "Material Delivered"
   └── Delivery proof uploaded
   
5. FIELD OPERATIONS
   └── Assistant checks in at hospital (GPS captured)
   └── Surgery conducted
   └── Assistant checks out
   
6. CONSUMPTION RECORDING
   └── Items consumed during surgery recorded
   └── Unused items noted for return
   
7. BILLING
   └── Consumption mapped to billing items
   └── Invoice generated and attached
   
8. PAYMENT COLLECTION
   └── Payment collected from doctor/hospital
   └── Receipt generated
   
9. COMPLETION
   └── Order marked as "Completed"
   └── Full audit trail available
```

### 2.4.2 Authentication Workflow

```
1. User enters registered email
2. System validates email exists
3. 6-digit OTP generated and sent to email
4. User enters OTP within 5 minutes
5. System validates OTP
6. JWT token generated (24-hour validity)
7. User redirected to dashboard
8. Session persisted in localStorage
```

## 2.5 Business Rules

### Order Management Rules
- Order number format: ORD-XXXX (auto-incremented)
- Material send date must be before operation date
- Operation time must be specified
- At least one item/item group required per order

### Assignment Rules
- Reporting time must be before operation start time
- Conflict detection: Same assistant cannot be assigned overlapping slots
- Travel buffer: 60-minute gap required between assignments
- Override available with manager confirmation

### Billing Rules
- Consumption must be recorded before billing
- All consumed items should be mapped to billing
- Signed invoice attachment recommended
- Amount in Indian Rupees (₹)

### Validation Rules
- Mobile number: 10 digits starting with 6-9
- Email: Valid email format required
- Mandatory fields highlighted
- Duplicate entries flagged with suggestions

## 2.6 Notifications & Alerts
- ✅ Toast notifications for all CRUD operations
- ✅ Confirmation dialogs for delete operations
- ✅ Warning alerts for duplicate entries
- ✅ Success messages on form submissions
- ✅ Error messages with specific details
- ✅ Conflict alerts for scheduling overlaps

## 2.7 Reports & Dashboards

### Current Implementation
- Data export to CSV/Excel format
- Date-stamped file naming
- Filtered data export capability

### Report Categories (Export)
- Doctor List
- Hospital List
- User List
- Order List
- Payment Collection Report
- Material Transfer Log

## 2.8 Integrations

### Backend API Integration
- RESTful API architecture
- Configurable base URL for different environments
- Endpoints configured for:
  - Authentication (Login, Logout, OTP)
  - User Management
  - Role Management
  - Doctor Management
  - Dashboard Statistics
  - File Upload/Download
  - Export Operations

### Third-Party Libraries Integration
- AG Grid Community for data tables
- Chart.js for data visualization
- Day.js for date manipulation
- React-Select for enhanced dropdowns
- SweetAlert2 for confirmation dialogs
- React-Toastify for notifications

## 2.9 Data Management

### Data Persistence
- Backend database (via API)
- LocalStorage for:
  - Authentication tokens
  - User session data
  - Login state persistence
  - OTP session management

### Data Validation
- Client-side validation for immediate feedback
- Server-side validation via API responses
- Input sanitization
- Type checking

## 2.10 Validation & Error Handling

### Input Validation
| Field Type | Validation Rule |
|------------|-----------------|
| Email | Valid email format (regex) |
| Mobile | 10 digits, starts with 6-9 |
| Required Fields | Non-empty check |
| Date Fields | Valid date format |
| Numeric Fields | Number type validation |

### Error Handling
- Network error detection
- API error response handling
- Timeout handling (configurable)
- User-friendly error messages
- Graceful degradation

---

# 3. SCOPE EXCLUSIONS

The following items are **NOT** included in the current project scope:

## 3.1 Third-Party & External Costs
- ❌ Third-party API license costs (if any)
- ❌ SMS gateway costs for OTP delivery
- ❌ Email service provider costs
- ❌ Cloud hosting/infrastructure costs
- ❌ SSL certificate costs
- ❌ Domain registration fees

## 3.2 Hardware & Infrastructure
- ❌ Server hardware procurement
- ❌ Network infrastructure setup
- ❌ Client devices (computers, tablets, mobile)
- ❌ Barcode/QR scanners
- ❌ Printers

## 3.3 Data & Content
- ❌ Historical data migration
- ❌ Data entry of existing records
- ❌ Content creation (product descriptions, images)
- ❌ Initial master data setup

## 3.4 Advanced Features (Not Implemented)
- ❌ Advanced analytics and BI dashboards
- ❌ Real-time notifications (Push/WebSocket)
- ❌ Multi-language support (i18n)
- ❌ Offline mode functionality
- ❌ Native mobile applications (iOS/Android)
- ❌ Automated email/SMS notifications
- ❌ Integration with accounting software
- ❌ Integration with hospital ERP systems
- ❌ Inventory management with stock levels
- ❌ Automated reorder system
- ❌ Customer portal for doctors/hospitals
- ❌ Signature capture functionality
- ❌ Video tutorials/help system

## 3.5 Compliance & Legal
- ❌ HIPAA compliance certification
- ❌ ISO certification
- ❌ Legal documentation
- ❌ Privacy policy and terms of service

## 3.6 Training
- ❌ In-person training sessions
- ❌ Training materials (videos, manuals)
- ❌ Train-the-trainer programs

---

# 4. TECHNICAL ARCHITECTURE

## 4.1 Application Type
**Single Page Application (SPA) - Progressive Web Application Ready**

| Characteristic | Details |
|---------------|---------|
| Type | Web Application |
| Architecture | Client-Server (API-driven) |
| Rendering | Client-side rendering (CSR) |
| PWA Ready | Service worker configuration available |

## 4.2 Frontend Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| Vite | 7.1.2+ | Build Tool & Dev Server |
| JavaScript | ES6+ | Programming Language |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.1.17 | Utility-first CSS Framework |
| PostCSS | 8.5.6 | CSS Processing |
| Autoprefixer | 10.4.22 | CSS Vendor Prefixing |
| Lucide React | 0.554.0 | Icon Library |

### Data Management
| Technology | Version | Purpose |
|------------|---------|---------|
| AG Grid Community | 34.1.2 | Enterprise Data Grid |
| AG Grid React | 34.1.2 | React Wrapper for AG Grid |
| Day.js | 1.11.18 | Date Manipulation |

### UI Components
| Technology | Version | Purpose |
|------------|---------|---------|
| React-Select | 5.10.2 | Enhanced Dropdowns |
| React-Toastify | 11.0.5 | Toast Notifications |
| SweetAlert2 | 11.22.5 | Alert Dialogs |
| Chart.js | 4.5.1 | Data Visualization |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| ESLint | 9.33.0 | Code Linting |
| TypeScript Types | 19.1.10 | Type Definitions |
| Vite Plugin React | 5.0.0 | React Fast Refresh |
| Vite Plugin PWA | 1.2.0 | PWA Support |

## 4.3 Backend Technology Stack

> **Note:** Backend is developed separately. Frontend communicates via RESTful APIs.

**Expected Backend Stack (Based on API Configuration):**
- .NET Core / ASP.NET Web API
- HTTPS communication (port 7019 for development)

## 4.4 Database
> Database is managed by the backend service. Frontend interacts through APIs.

**Expected:** SQL Server / PostgreSQL

## 4.5 Authentication & Authorization

### Authentication Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [User] ──→ [Enter Email] ──→ [Send OTP Request]           │
│                                      │                       │
│                                      ▼                       │
│                              [Backend validates]             │
│                              [Sends OTP to email]            │
│                                      │                       │
│                                      ▼                       │
│   [User] ──→ [Enter 6-digit OTP] ──→ [Verify OTP]           │
│                                      │                       │
│                                      ▼                       │
│                              [Generate JWT Token]            │
│                              [24-hour validity]              │
│                                      │                       │
│                                      ▼                       │
│   [Store in LocalStorage] ←─────────┘                       │
│   [Redirect to Dashboard]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Authorization
- Role-based access control (RBAC)
- Permission-based menu visibility
- JWT token validation on API requests
- Automatic logout on token expiry

## 4.6 API Architecture

### RESTful API Design
```
Base URL: https://localhost:7019/api (Development)

Endpoints Structure:
├── /Login                    # Authentication
├── /SendOTP                  # OTP Generation
├── /VerifyOTP                # OTP Verification
├── /Doctors                  # Doctor CRUD
├── /ApplicationUsers         # User Management
├── /roles                    # Role Management
├── /dashboard/stats          # Dashboard Data
├── /upload                   # File Upload
├── /export/{type}/{format}   # Data Export
└── /health                   # System Health Check
```

### API Configuration
```javascript
Environments:
├── DEV:     https://localhost:7019/api  (Timeout: 30s)
├── STAGING: https://staging-api.com/api (Timeout: 45s)
└── PROD:    https://prod-api.com/api    (Timeout: 60s)
```

### HTTP Methods Used
| Method | Usage |
|--------|-------|
| GET | Retrieve data |
| POST | Create new records |
| PUT | Update existing records |
| DELETE | Remove records |
| PATCH | Partial updates |

## 4.7 Hosting Environment

### Development
- Local development server (Vite)
- Hot Module Replacement (HMR)
- Port: 5173 (default Vite port)

### Production (Recommended)
- Static file hosting
- CDN deployment
- HTTPS required

## 4.8 Build Configuration

### Vite Configuration
- React plugin with Fast Refresh
- PWA plugin for service worker
- CSP (Content Security Policy) plugin
- Optimized production builds

### Build Commands
```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run preview  # Preview production build
npm run lint     # Run ESLint checks
```

## 4.9 Project Structure

```
NS-FE/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts
│   ├── components/        # Reusable UI components
│   │   ├── ActionDropdown.jsx
│   │   ├── Breadcrumb.jsx
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── OTPVerification.jsx
│   │   ├── PasswordChangeModal.jsx
│   │   └── Sidebar.jsx
│   ├── config/
│   │   └── apiConfig.js   # API configuration
│   ├── Pages/             # Page components (modules)
│   │   ├── AssistantAssignment.jsx
│   │   ├── AssistantCheckin.jsx
│   │   ├── Brand.jsx
│   │   ├── Category.jsx
│   │   ├── ConsumptionBilling.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Doctor.jsx
│   │   ├── Hospital.jsx
│   │   ├── Item.jsx
│   │   ├── Login.jsx
│   │   ├── MaterialTransfer.jsx
│   │   ├── OrderEntry.jsx
│   │   ├── OrderReminder.jsx
│   │   ├── PaymentCollection.jsx
│   │   ├── Size.jsx
│   │   ├── Specification.jsx
│   │   └── User.jsx
│   ├── services/          # API service layers
│   │   ├── apiService.js
│   │   ├── authService.js
│   │   └── doctorService.js
│   ├── utils/             # Utility functions
│   │   ├── breadcrumbUtils.js
│   │   └── debugScripts.js
│   ├── App.jsx            # Main application component
│   ├── App.css            # Global styles
│   ├── index.css          # Tailwind imports
│   └── main.jsx           # Application entry point
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── eslint.config.js       # ESLint configuration
```

---

# 5. SECURITY IMPLEMENTATION

## 5.1 Authentication Method

### Email-Based OTP Authentication
| Security Feature | Implementation |
|------------------|----------------|
| OTP Generation | Server-side 6-digit random number |
| OTP Validity | 5 minutes time limit |
| OTP Transmission | Sent to registered email only |
| OTP Attempts | Limited (backend-controlled) |
| Rate Limiting | Implemented on backend |

### JWT Token Management
| Feature | Details |
|---------|---------|
| Token Type | JSON Web Token (JWT) |
| Token Validity | 24 hours |
| Token Storage | Browser LocalStorage |
| Token Refresh | Planned (endpoint configured) |
| Token Invalidation | On logout |

## 5.2 Authorization Mechanism

### Role-Based Access Control (RBAC)
- Three predefined roles: Admin, Manager, User
- Menu-level access control
- Permission-based feature visibility
- Backend validation of permissions

### Session Management
- Session persistence across browser sessions
- Automatic logout on token expiry
- Manual logout option
- Session cleanup on logout

## 5.3 Data Encryption

### Transport Layer Security
- HTTPS required for production
- TLS 1.2+ recommended
- API communication over secure channels

### Storage Security
- Sensitive data not stored in localStorage (except tokens)
- OTP stored temporarily for demo (removed in production)
- No password storage (passwordless auth)

## 5.4 Role-Based Access Control Details

```
PERMISSION STRUCTURE:
├── Admin Role
│   ├── Full CRUD on all master data
│   ├── User management access
│   ├── All transaction modules
│   └── System configuration access
│
├── Manager Role
│   ├── Read-only on master data
│   ├── Full access to transactions
│   └── Report access
│
└── User Role
    ├── Dashboard view
    ├── Order entry only
    └── View own assignments
```

## 5.5 Secure API Practices

### Request Security
- Authorization header with Bearer token
- Content-Type validation
- Request timeout handling
- Error response sanitization

### API Error Handling
```javascript
Error Codes Handled:
├── 400 - Bad Request
├── 401 - Unauthorized (trigger re-login)
├── 403 - Forbidden
├── 404 - Not Found
├── 422 - Validation Error
├── 500 - Server Error
└── 503 - Service Unavailable
```

## 5.6 Audit Logs

### Audit Trail Implementation
Every transaction records:
- Timestamp (ISO format)
- User who performed action
- Action description
- Previous and new values (where applicable)

### Audited Actions
- Order creation and updates
- Assignment changes
- Material transfer status changes
- Consumption entries
- Billing operations
- Payment collections

---

# 6. PERFORMANCE & SCALABILITY

## 6.1 Expected Concurrent Users

| Tier | Users | Scenario |
|------|-------|----------|
| Normal | 10-20 | Daily operations |
| Peak | 30-50 | Month-end processing |
| Maximum | 100+ | With proper infrastructure |

## 6.2 API Performance Handling

### Request Timeout Configuration
| Operation Type | Timeout |
|---------------|---------|
| Quick operations | 5 seconds |
| Normal operations | 15 seconds |
| File uploads | 30 seconds |
| Large exports | 60 seconds |

### Performance Optimizations
- Lazy loading of components
- Memoization with useMemo and useCallback
- Debounced search inputs
- Paginated data loading
- Efficient re-rendering with React hooks

## 6.3 Database Optimization
> Backend responsibility - Frontend optimized for:
- Minimal API calls
- Cached responses where appropriate
- Efficient data structures

## 6.4 Caching Strategy

### Client-Side Caching
| Data Type | Strategy |
|-----------|----------|
| Static assets | Browser cache |
| User session | LocalStorage |
| API responses | React state |

### Build Optimization
- Code splitting
- Tree shaking
- Minification
- Gzip compression ready

## 6.5 Scalability Approach

### Horizontal Scalability
- Stateless frontend (no server state)
- API-driven architecture
- CDN-ready static assets

### Future Scalability Considerations
- Service worker for offline capability
- IndexedDB for local caching
- WebSocket for real-time updates (future)

---

# 7. DEPLOYMENT DETAILS

## 7.1 Server Type
**Static File Hosting (Recommended)**
- Nginx / Apache for serving
- Cloud CDN recommended (AWS CloudFront, Azure CDN)
- Linux or Windows server compatible

## 7.2 Deployment Steps (High Level)

### Production Build
```bash
# Step 1: Install dependencies
npm install

# Step 2: Build for production
npm run build

# Step 3: Output directory
# ./dist/ contains deployable files
```

### Deployment Checklist
- [ ] Update API base URL to production
- [ ] Configure environment variables
- [ ] Enable HTTPS
- [ ] Set up CDN (optional but recommended)
- [ ] Configure CORS on backend
- [ ] Test all modules
- [ ] Verify authentication flow

## 7.3 Environment Separation

| Environment | API URL | Purpose |
|-------------|---------|---------|
| Development | localhost:7019 | Local development |
| Staging | staging-api.domain.com | Pre-production testing |
| Production | api.domain.com | Live environment |

### Environment Configuration
```javascript
// apiConfig.js
CURRENT_ENV = 'PROD'; // Change based on deployment
```

## 7.4 Backup Strategy

### Frontend Backup
- Source code in Git repository
- Version tagging for releases
- Build artifacts archived

### Data Backup (Backend)
- Database backup (backend responsibility)
- Regular automated backups recommended
- Point-in-time recovery capability

## 7.5 Monitoring & Logs

### Frontend Monitoring
- Browser console logging (development)
- Error boundary implementation
- Toast notifications for user feedback

### Recommended Monitoring Tools
- Google Analytics for usage tracking
- Sentry for error tracking
- Lighthouse for performance audits

---

# 8. TESTING & QUALITY ASSURANCE

## 8.1 Unit Testing
> Currently implemented through manual testing

### Recommended Framework
- Jest for unit tests
- React Testing Library for component tests

### Testable Units
- Service functions (apiService, authService)
- Utility functions
- Component rendering
- State management

## 8.2 Integration Testing

### Tested Integrations
- API endpoint connectivity
- Authentication flow
- Data CRUD operations
- File export functionality

### Testing Approach
- Manual integration testing
- Cross-browser testing
- Mobile responsiveness testing

## 8.3 User Acceptance Testing (UAT)

### UAT Scenarios
| Module | Test Cases |
|--------|------------|
| Login | OTP flow, token validation |
| Doctor | Add, Edit, Delete, Search, Export |
| Hospital | CRUD operations, Contact management |
| Orders | Creation, Status updates, Assignment |
| Billing | Consumption entry, Billing mapping |
| Payments | Receipt generation, Export |

### UAT Checklist
- [ ] All CRUD operations functional
- [ ] Data validation working
- [ ] Export functionality verified
- [ ] Mobile responsiveness confirmed
- [ ] Error handling appropriate
- [ ] Performance acceptable

## 8.4 Bug Tracking Process

### Bug Lifecycle
```
1. Bug Identified
   ↓
2. Bug Logged (Description, Steps, Severity)
   ↓
3. Developer Assignment
   ↓
4. Fix Implementation
   ↓
5. Code Review
   ↓
6. Testing & Verification
   ↓
7. Bug Closed
```

### Severity Levels
| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | System unusable | Immediate |
| High | Major feature broken | 24 hours |
| Medium | Feature impaired | 48-72 hours |
| Low | Minor issue | Next release |

---

# 9. DOCUMENTATION & HANDOVER

## 9.1 User Manuals

### Available Documentation
- README.md with setup instructions
- Code comments and JSDoc annotations
- Inline component documentation

### Recommended User Documentation
- End-user guide for each module
- Quick reference cards
- FAQ document

## 9.2 Admin Guide

### System Administration Tasks
- User management procedures
- Role and permission configuration
- Environment configuration
- Troubleshooting guide

## 9.3 API Documentation

### Documented Endpoints
- Authentication APIs
- CRUD operations
- Export endpoints
- Health check

### Documentation Format
- Code-level documentation in apiConfig.js
- Endpoint listing with parameters
- Error code reference

## 9.4 Source Code Repository Access

### Repository Information
| Item | Details |
|------|---------|
| Platform | GitHub |
| Owner | zicorp |
| Repository | Baba-Basuki-FE |
| Main Branch | main |
| Current Branch | Surgi_Deliver_UI_Sayanti |

### Access Levels
- Read access for audit
- Write access for development team
- Admin access for repository management

## 9.5 Environment Credentials Handover

### Credentials to Transfer
| Item | Status |
|------|--------|
| Git repository access | To be provided |
| API keys (if any) | To be provided |
| Hosting credentials | To be provided |
| Domain access | To be provided |
| Email service credentials | To be provided |

---

# 10. MAINTENANCE & SUPPORT (OPTIONAL)

## 10.1 Support Scope

### Included Support
- Bug fixes for reported issues
- Critical security patches
- Minor UI adjustments
- Performance optimization

### Excluded from Support
- New feature development
- Major UI redesign
- Third-party integration issues
- Infrastructure management

## 10.2 Service Level Agreement (SLA)

| Priority | Response Time | Resolution Target |
|----------|---------------|-------------------|
| Critical | 2 hours | 24 hours |
| High | 4 hours | 48 hours |
| Medium | 8 hours | 1 week |
| Low | 24 hours | Next release |

## 10.3 Bug-Fix Window
- **Warranty Period:** 3 months post-deployment
- **Coverage:** Defects in delivered functionality
- **Exclusions:** Changes due to new requirements

## 10.4 Enhancement Process

### Enhancement Request Flow
```
1. Client submits enhancement request
   ↓
2. Technical assessment
   ↓
3. Effort estimation
   ↓
4. Cost proposal
   ↓
5. Client approval
   ↓
6. Development & delivery
```

---

# 11. ASSUMPTIONS & DEPENDENCIES

## 11.1 Client Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Data Input | Initial master data entry |
| User Training | Training end users on application usage |
| Infrastructure | Hosting environment setup |
| Domain & SSL | Domain registration and SSL certificates |
| Email Service | Email gateway for OTP delivery |
| Internet | Stable internet connectivity |
| Browser | Modern browser usage (Chrome, Firefox, Safari, Edge) |
| Feedback | Timely UAT feedback and approvals |

## 11.2 Third-Party Dependencies

### NPM Packages
All dependencies are open-source with MIT/Apache 2.0 licenses:
- React (MIT)
- Vite (MIT)
- Tailwind CSS (MIT)
- AG Grid Community (MIT)
- Day.js (MIT)
- Chart.js (MIT)
- SweetAlert2 (MIT)
- React-Toastify (MIT)
- React-Select (MIT)
- Lucide React (ISC)

### External Services
- Backend API (must be operational)
- Email service for OTP (required)

## 11.3 Infrastructure Assumptions

| Assumption | Details |
|------------|---------|
| Backend Available | Backend API deployed and accessible |
| HTTPS | Production environment uses HTTPS |
| Browser Support | Users have modern browsers |
| Internet | Minimum 1 Mbps connectivity |
| Database | Backend database operational |

## 11.4 Technical Assumptions

- Backend follows RESTful API standards
- API responses in JSON format
- CORS properly configured on backend
- JWT tokens in standard format
- Time zone: Server and client in same or handled timezone

---

# 12. FUTURE ENHANCEMENT SCOPE

Based on the current architecture and business requirements, the following enhancements are recommended for future phases:

## 12.1 Short-Term Enhancements (3-6 months)

### Dashboard Improvements
- [ ] Interactive charts for sales analytics
- [ ] KPI widgets (Orders today, Pending assignments, Revenue)
- [ ] Recent activity feed
- [ ] Quick action buttons

### Notification System
- [ ] In-app notification center
- [ ] Email notifications for critical events
- [ ] SMS alerts for urgent actions
- [ ] Push notifications (PWA)

### Search & Filters
- [ ] Global search across all modules
- [ ] Advanced filter builder
- [ ] Saved filter presets
- [ ] Date range picker improvements

### Mobile Experience
- [ ] Dedicated mobile UI for field assistants
- [ ] Offline mode for check-in/out
- [ ] Camera integration for proof uploads
- [ ] Barcode/QR scanner support

## 12.2 Medium-Term Enhancements (6-12 months)

### Inventory Management
- [ ] Real-time stock levels
- [ ] Stock movement tracking
- [ ] Reorder point alerts
- [ ] Warehouse management

### Advanced Reporting
- [ ] Customizable report builder
- [ ] Scheduled report generation
- [ ] PDF report export
- [ ] Executive dashboard

### Integration Capabilities
- [ ] Accounting software integration (Tally, QuickBooks)
- [ ] Hospital ERP integration
- [ ] WhatsApp business messaging
- [ ] Calendar integration (Google, Outlook)

### Workflow Automation
- [ ] Automated email reminders
- [ ] Escalation rules for pending items
- [ ] Auto-assignment based on rules
- [ ] Approval workflows

## 12.3 Long-Term Enhancements (12+ months)

### Native Mobile Apps
- [ ] iOS application
- [ ] Android application
- [ ] Cross-platform development (React Native/Flutter)

### AI/ML Features
- [ ] Demand forecasting
- [ ] Intelligent assistant assignment
- [ ] Anomaly detection in orders
- [ ] Chatbot for user queries

### Customer Portal
- [ ] Doctor self-service portal
- [ ] Hospital portal for order tracking
- [ ] Online payment gateway
- [ ] Document sharing

### Compliance & Audit
- [ ] HIPAA compliance features
- [ ] Advanced audit logging
- [ ] Data retention policies
- [ ] GDPR compliance tools

## 12.4 Technical Improvements

### Performance
- [ ] Server-side rendering (SSR) with Next.js
- [ ] GraphQL API integration
- [ ] Real-time updates with WebSocket
- [ ] Service worker optimization

### Security
- [ ] Multi-factor authentication (MFA)
- [ ] Biometric authentication
- [ ] IP whitelisting
- [ ] Session management dashboard

### DevOps
- [ ] CI/CD pipeline setup
- [ ] Automated testing
- [ ] Docker containerization
- [ ] Kubernetes orchestration

---

# APPENDIX

## A. Glossary

| Term | Definition |
|------|------------|
| OTP | One-Time Password - temporary verification code |
| JWT | JSON Web Token - secure authentication token |
| CRUD | Create, Read, Update, Delete operations |
| SPA | Single Page Application |
| PWA | Progressive Web Application |
| RBAC | Role-Based Access Control |
| API | Application Programming Interface |
| AG Grid | Advanced Grid component for data tables |
| UAT | User Acceptance Testing |
| SLA | Service Level Agreement |

## B. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 29, 2025 | ZiCorp | Initial document creation |

## C. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Client Representative | | | |
| Project Manager | | | |
| Technical Lead | | | |
| Delivery Manager | | | |

---

**END OF DOCUMENT**

---

*This document is confidential and intended for use by Neha Surgical and ZiCorp Technologies only.*
