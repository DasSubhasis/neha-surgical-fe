export interface BreadcrumbItem {
  key: string;
  label: string;
  icon?: string;
}

// Page hierarchy mapping
const pageHierarchy: { [key: string]: { parent: string | null; label: string } } = {
  'dashboard': { parent: null, label: 'Home' },
  
  // Master Data
  'master-data': { parent: 'dashboard', label: 'Master Data' },
  'item': { parent: 'master-data', label: 'Items' },
  'doctor': { parent: 'master-data', label: 'Doctor' },
  'hospital': { parent: 'master-data', label: 'Hospital' },
  'brand': { parent: 'master-data', label: 'Brand' },
  'specification': { parent: 'master-data', label: 'Specification' },
  'size': { parent: 'master-data', label: 'Size' },
  'category': { parent: 'master-data', label: 'Category' },
  'user': { parent: 'master-data', label: 'User' },
  'menu': { parent: 'master-data', label: 'Menu' },
  'role': { parent: 'master-data', label: 'Role' },
  
  // Order Collection
  'order': { parent: 'dashboard', label: 'Order Collection' },
  'order-entry': { parent: 'order', label: 'Order Entry' },
  'order-reminder': { parent: 'order', label: 'Upcoming Orders' },
  
  // Order Assignment
  'assignment': { parent: 'dashboard', label: 'Order Assignment' },
  'assistant-assignment': { parent: 'assignment', label: 'Assistant Assignment' },
  
  // Material Movement
  'transfer': { parent: 'dashboard', label: 'Material Movement' },
  'material-transfer': { parent: 'transfer', label: 'Material Transfer' },
  
  // Assistant Operations
  'operations': { parent: 'dashboard', label: 'Assistant Operations' },
  'assistant-operations': { parent: 'operations', label: 'Assistant Operations' },
  
  // Consumption & Billing
  'billing': { parent: 'dashboard', label: 'Consumption & Billing' },
  'consumption-billing': { parent: 'billing', label: 'Consumption & Billing' },
  
  // Payment Collection
  'payment': { parent: 'dashboard', label: 'Payment Collection' },
  'payment-collection': { parent: 'payment', label: 'Payment Collection' },
  
  // Reports
  'reports': { parent: 'dashboard', label: 'Reports' },
  
  // Profile
  'profile': { parent: 'dashboard', label: 'Profile' }
};

export function generateBreadcrumb(currentPage: string): BreadcrumbItem[] {
  const breadcrumb: BreadcrumbItem[] = [];
  let page: string | null = currentPage;

  // Build breadcrumb from current page to root
  while (page) {
    const pageInfo: { parent: string | null; label: string } | undefined = pageHierarchy[page];
    if (pageInfo) {
      breadcrumb.unshift({
        key: page,
        label: pageInfo.label,
        icon: page === 'dashboard' ? 'home' : undefined
      });
      page = pageInfo.parent;
    } else {
      // Unknown page, add it anyway and stop
      breadcrumb.unshift({
        key: page,
        label: page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ')
      });
      break;
    }
  }

  // Always ensure Home is first
  if (breadcrumb.length === 0 || breadcrumb[0].key !== 'dashboard') {
    breadcrumb.unshift({
      key: 'dashboard',
      label: 'Home',
      icon: 'home'
    });
  }

  return breadcrumb;
}
