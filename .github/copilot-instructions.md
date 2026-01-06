# Neha Surgical - AI Coding Instructions

## Project Overview
Enterprise Angular 18 SPA for surgical equipment management - order processing, inventory tracking, field assistant operations, and billing. Built with standalone components, AG Grid, Tailwind CSS, and OTP-based authentication.

## Architecture Patterns

### Standalone Component Architecture
- **All components are standalone** - no NgModules, use direct imports in component decorators
- Lazy-loaded routes via `loadComponent: () => import('./path').then(m => m.ComponentName)`
- See [app.routes.ts](src/app/app.routes.ts) for routing pattern with guards and lazy loading

### Service Layer Pattern
Each domain service (`doctor.service.ts`, `hospital.service.ts`, etc.) exports:
- Main entity interface (e.g., `Doctor`, `Hospital`)
- `FormData` interface for create/update operations (always includes `isActive: 'Y' | 'N'`)
- Service with CRUD methods wrapping [ApiService](src/app/services/api.service.ts)
- Example: [doctor.service.ts](src/app/services/doctor.service.ts)

### API Service Structure
- Centralized HTTP handling in [api.service.ts](src/app/services/api.service.ts)
- Configuration in [api.config.ts](src/app/config/api.config.ts) with environment switching (`DEV`, `STAGING`, `PROD`)
- All endpoints defined as constants in `ENDPOINTS` object
- Standard error handling with `ApiResponse<T>` wrapper

### Configuration Management
- Runtime config loaded from [public/appsettings.json](public/appsettings.json) via [ConfigService](src/app/services/config.service.ts)
- Loaded using `APP_INITIALIZER` in [app.config.ts](src/app/app.config.ts) before app starts
- Access via `ConfigService.getConfig()` - NEVER hardcode API URLs or role IDs

## Component Development Patterns

### Master Data CRUD Components
All master data screens (doctor, hospital, item, brand, etc.) follow identical structure:
1. **AG Grid with inline cellRenderers** for status badges and action buttons
2. **Modal-based forms** with validation
3. **Toast notifications** via [ToastService](src/app/services/toast.service.ts)
4. **Action dropdown** using [ActionDropdownComponent](src/app/components/action-dropdown/action-dropdown.component.ts)
5. **Breadcrumb integration** via [BreadcrumbComponent](src/app/shared/components/breadcrumb/breadcrumb.component.ts)

Reference implementation: [doctor.component.ts](src/app/components/doctor/doctor.component.ts)

### AG Grid Column Definitions
```typescript
columnDefs: ColDef[] = [
  { headerName: 'Name', field: 'name', sortable: true, filter: 'agTextColumnFilter', flex: 1 },
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: (params: any) => {
      const status = params.value;
      const colorClass = status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">${status}</span>`;
    }
  },
  {
    headerName: 'Actions',
    field: 'actions',
    width: 90,
    pinned: 'right',
    cellRenderer: (params: any) => {
      // Create edit/view/delete buttons dynamically
      // Wire onclick to component methods
    }
  }
];
```

### Searchable Dropdown Pattern
Use [SearchableDropdownComponent](src/app/components/searchable-dropdown/searchable-dropdown.component.ts) for lookups:
- Implements `ControlValueAccessor` for reactive forms
- Configure via `[options]`, `[idKey]`, `[nameKey]` inputs
- Supports `required` validation and filtering

## Authentication & Guards

### OTP-Based Authentication
- Email-based OTP via [AuthService](src/app/services/auth.service.ts)
- JWT tokens stored in localStorage (`STORAGE_KEYS.AUTH_TOKEN`)
- [AuthInterceptor](src/app/interceptors/auth.interceptor.ts) auto-attaches Bearer token
- Token refresh on 401 with queue management

### Route Guards
- `authGuard`: Protects authenticated routes, redirects to `/login` if not logged in
- `loginGuard`: Prevents logged-in users from accessing `/login`, redirects to `/dashboard`
- Defined as functional guards in [auth.guard.ts](src/app/guards/auth.guard.ts)

## Styling Conventions

### Tailwind CSS Usage
- Utility-first approach throughout
- Common patterns:
  - Buttons: `px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700`
  - Cards: `bg-white rounded-lg shadow-sm border border-gray-200`
  - Status badges: `inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-{color}-100 text-{color}-800`
- No custom CSS classes in components except for AG Grid header styling

### Component Styles
Components use inline `styles: []` for AG Grid-specific CSS:
```typescript
styles: [`
  :host ::ng-deep .ag-header-small-font .ag-header-cell-label {
    font-size: 12px !important;
    font-weight: 500 !important;
  }
`]
```

## Development Workflows

### Running the Application
```bash
npm start  # Starts dev server on http://localhost:4200
```
Default backend: `http://localhost:5280` (configurable in [appsettings.json](public/appsettings.json))

### Building for Production
```bash
npm run build  # Outputs to dist/ns-app
```

### Code Generation
Angular schematics configured to skip tests (see [angular.json](angular.json)):
```bash
ng generate component components/feature-name --skip-tests
ng generate service services/feature-name --skip-tests
```

## Data Flow Patterns

### Active vs Inactive Records
- All entities have `isActive: 'Y' | 'N'` (character, not boolean)
- API typically filters by default: `?isActive=Y`
- UI toggles between active/inactive views

### Form Submission Pattern
1. Validate form data
2. Call service method (create/update)
3. Show toast notification
4. Refresh grid data
5. Close modal

### Error Handling
- Service layer returns `Observable<ApiResponse<T>>`
- Components subscribe and handle via toast:
  ```typescript
  this.service.create(data).subscribe({
    next: (response) => {
      if (response.success) {
        this.toastService.success('Created successfully');
      }
    },
    error: (error) => {
      this.toastService.error(error.message || 'Operation failed');
    }
  });
  ```

## Key Files Reference

- **App Config**: [app.config.ts](src/app/app.config.ts) - providers, interceptors, initializers
- **Routes**: [app.routes.ts](src/app/app.routes.ts) - all route definitions
- **API Config**: [config/api.config.ts](src/app/config/api.config.ts) - endpoints and environment settings
- **Layout**: [shared/components/layout/layout.component.ts](src/app/shared/components/layout/layout.component.ts) - main shell
- **Example Service**: [services/doctor.service.ts](src/app/services/doctor.service.ts) - CRUD pattern template

## Common Gotchas

1. **isActive is a string** (`'Y'` or `'N'`), not a boolean
2. **All dates from API** are ISO strings, convert to `yyyy-MM-dd` for date inputs
3. **AG Grid requires ModuleRegistry** - registered in [app.config.ts](src/app/app.config.ts)
4. **Config must load first** - use `ConfigService` via `APP_INITIALIZER`, never access before app init
5. **Toast must be dismissed** - components handle via subscription, not manual dismissal
6. **Standalone components** - always import dependencies in component decorator, not NgModule
