import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface Item {
  id?: number;
  itemId?: number;
  name: string;
  shortname: string;
  group: string;
  category: string;
  specification?: string;
  size?: string;
  material?: string;
  model?: string;
  description?: string;
  price: number;
  createdAt?: string;
  status: string;
  isActive?: string;
}

export interface ItemFormData {
  name: string;
  shortname: string;
  group: string;
  category: string;
  specification: string;
  size: string;
  material: string;
  model: string;
  description: string;
  price: string;
  status: string;
}

export interface CatalogItem {
  ItemID: number;
  ItemName: string;
  Sizes?: { name: string }[];
  Material?: string;
  Model?: string;
  Specifications?: string;
}

export interface Subcategory {
  SubcategoryID: number;
  SubcategoryName: string;
  Items: CatalogItem[];
  Specifications?: string;
  Sizes?: { name: string }[];
  Material?: string;
  Model?: string;
}

export interface Category {
  CategoryID: number;
  CategoryName: string;
  Subcategories: Subcategory[];
  Specifications?: string;
  Material?: string;
  Model?: string;
}

// Hierarchical catalog data
export const CATALOG: Category[] = [
  {
    "CategoryID": 1,
    "CategoryName": "Spine Implants",
    "Specifications": "Material Grade",
    "Subcategories": [
      {
        "SubcategoryID": 101,
        "SubcategoryName": "Screws",
        "Items": [
          { "ItemID": 1001, "ItemName": "Pedicle Screws", "Sizes": [{ "name": "4.5 mm" }, { "name": "5.0 mm" }, { "name": "5.5 mm" }], "Material": "Titanium", "Model": "PS-4X" },
          { "ItemID": 1002, "ItemName": "Polyaxial Screws", "Sizes": [{ "name": "4.5 mm" }, { "name": "5.5 mm" }, { "name": "6.5 mm" }], "Material": "Titanium", "Model": "PA-5" },
          { "ItemID": 1003, "ItemName": "Monoaxial Screws", "Sizes": [{ "name": "4.0 mm" }, { "name": "5.0 mm" }, { "name": "6.0 mm" }], "Material": "Stainless Steel", "Model": "MA-3" },
          { "ItemID": 1004, "ItemName": "Cannulated Screws", "Sizes": [{ "name": "4.0 mm" }, { "name": "6.5 mm" }, { "name": "7.3 mm" }] },
          { "ItemID": 1005, "ItemName": "Cervical Screws", "Sizes": [{ "name": "3.5 mm" }, { "name": "4.0 mm" }] }
        ]
      },
      {
        "SubcategoryID": 102,
        "SubcategoryName": "Rods",
        "Items": [
          { "ItemID": 1011, "ItemName": "Titanium Rods", "Sizes": [{ "name": "3.5 mm" }, { "name": "4.75 mm" }, { "name": "5.5 mm" }, { "name": "6.0 mm" }], "Material": "Titanium", "Model": "TR-6" },
          { "ItemID": 1012, "ItemName": "Cobalt-Chromium Rods", "Sizes": [{ "name": "5.5 mm" }, { "name": "6.0 mm" }] }
        ]
      },
      {
        "SubcategoryID": 103,
        "SubcategoryName": "Plates",
        "Items": [
          { "ItemID": 1021, "ItemName": "Cervical Plates", "Sizes": [{ "name": "40 mm" }, { "name": "50 mm" }, { "name": "60 mm" }, { "name": "70 mm" }], "Material": "Titanium", "Model": "CP-40" },
          { "ItemID": 1022, "ItemName": "Lumbar Plates", "Sizes": [{ "name": "80 mm" }, { "name": "90 mm" }, { "name": "100 mm" }] },
          { "ItemID": 1023, "ItemName": "Thoracic Plates", "Sizes": [{ "name": "60 mm" }, { "name": "80 mm" }, { "name": "100 mm" }] }
        ]
      },
      {
        "SubcategoryID": 104,
        "SubcategoryName": "Cages",
        "Items": [
          { "ItemID": 1031, "ItemName": "PEEK Cages", "Sizes": [{ "name": "8 mm" }, { "name": "9 mm" }, { "name": "10 mm" }, { "name": "12 mm" }], "Material": "PEEK", "Model": "PC-10" },
          { "ItemID": 1032, "ItemName": "Titanium Cages", "Sizes": [{ "name": "9 mm" }, { "name": "10 mm" }, { "name": "11 mm" }] },
          { "ItemID": 1033, "ItemName": "Cervical Cages", "Sizes": [{ "name": "6 mm" }, { "name": "7 mm" }, { "name": "8 mm" }] },
          { "ItemID": 1034, "ItemName": "PLIF Cages", "Sizes": [{ "name": "9 mm" }, { "name": "10 mm" }, { "name": "11 mm" }, { "name": "12 mm" }] },
          { "ItemID": 1035, "ItemName": "TLIF Cages", "Sizes": [{ "name": "8 mm" }, { "name": "9 mm" }, { "name": "10 mm" }, { "name": "12 mm" }] },
          { "ItemID": 1036, "ItemName": "ALIF Cages", "Sizes": [{ "name": "12 mm" }, { "name": "14 mm" }, { "name": "16 mm" }] },
          { "ItemID": 1037, "ItemName": "OLIF Cages", "Sizes": [{ "name": "12 mm" }, { "name": "13 mm" }, { "name": "14 mm" }] },
          { "ItemID": 1038, "ItemName": "Expandable Cages", "Sizes": [{ "name": "8–14 mm" }] },
          { "ItemID": 1039, "ItemName": "Corpectomy Cages", "Sizes": [{ "name": "20 mm" }, { "name": "25 mm" }, { "name": "30 mm" }] }
        ]
      },
      {
        "SubcategoryID": 105,
        "SubcategoryName": "Hooks & Connectors",
        "Items": [
          { "ItemID": 1041, "ItemName": "Laminar Hooks", "Sizes": [{ "name": "Small" }, { "name": "Medium" }, { "name": "Large" }] },
          { "ItemID": 1042, "ItemName": "Pedicle Hooks", "Sizes": [{ "name": "4.5 mm" }, { "name": "5.5 mm" }] },
          { "ItemID": 1043, "ItemName": "Crosslinks", "Sizes": [{ "name": "30 mm" }, { "name": "40 mm" }, { "name": "50 mm" }] },
          { "ItemID": 1044, "ItemName": "Rod Connectors", "Sizes": [{ "name": "3.5 mm" }, { "name": "5.5 mm" }] }
        ]
      },
      {
        "SubcategoryID": 106,
        "SubcategoryName": "Spacers & Grafts",
        "Items": [
          { "ItemID": 1051, "ItemName": "Disc Spacers", "Sizes": [{ "name": "6 mm" }, { "name": "8 mm" }, { "name": "10 mm" }] },
          { "ItemID": 1052, "ItemName": "Vertebral Body Spacers", "Sizes": [{ "name": "20 mm" }, { "name": "25 mm" }, { "name": "30 mm" }] },
          { "ItemID": 1053, "ItemName": "Bone Graft Materials", "Sizes": [{ "name": "5 g" }, { "name": "10 g" }, { "name": "20 g" }] }
        ]
      },
      {
        "SubcategoryID": 107,
        "SubcategoryName": "Specialized Items",
        "Items": [
          { "ItemID": 1061, "ItemName": "Spinous Process Plates", "Sizes": [{ "name": "25 mm" }, { "name": "30 mm" }, { "name": "35 mm" }] },
          { "ItemID": 1062, "ItemName": "SI Joint Screws", "Sizes": [{ "name": "7.0 mm" }, { "name": "8.0 mm" }] },
          { "ItemID": 1063, "ItemName": "Kyphoplasty Balloons", "Sizes": [{ "name": "10 mm" }, { "name": "15 mm" }] },
          { "ItemID": 1064, "ItemName": "Kyphoplasty Cement (PMMA)", "Sizes": [{ "name": "10 g" }, { "name": "20 g" }] }
        ]
      }
    ]
  },
  {
    "CategoryID": 2,
    "CategoryName": "Cervical Implants",
    "Subcategories": [
      {
        "SubcategoryID": 201,
        "SubcategoryName": "Cervical Plates",
        "Items": [
          { "ItemID": 2001, "ItemName": "Anterior Cervical Plates", "Sizes": [{ "name": "20 mm" }, { "name": "25 mm" }, { "name": "30 mm" }], "Material": "Titanium", "Model": "ACP-20" },
          { "ItemID": 2002, "ItemName": "Posterior Cervical Plates", "Sizes": [{ "name": "30 mm" }, { "name": "40 mm" }] }
        ]
      },
      {
        "SubcategoryID": 202,
        "SubcategoryName": "Cervical Screws",
        "Items": [
          { "ItemID": 2011, "ItemName": "Standard Cervical Screws", "Sizes": [{ "name": "3.5 mm" }, { "name": "4.0 mm" }] },
          { "ItemID": 2012, "ItemName": "Variable Angle Screws", "Sizes": [{ "name": "3.5 mm" }, { "name": "4.0 mm" }] }
        ]
      },
      {
        "SubcategoryID": 203,
        "SubcategoryName": "Cervical Cages",
        "Items": [
          { "ItemID": 2021, "ItemName": "Cervical Interbody Cages", "Sizes": [{ "name": "6 mm" }, { "name": "7 mm" }, { "name": "8 mm" }] },
          { "ItemID": 2022, "ItemName": "Cervical Disc Replacements", "Sizes": [{ "name": "Small" }, { "name": "Medium" }, { "name": "Large" }] },
          { "ItemID": 2023, "ItemName": "Cervical Spacer", "Sizes": [{ "name": "5 mm" }, { "name": "6 mm" }, { "name": "7 mm" }] }
        ]
      },
      {
        "SubcategoryID": 204,
        "SubcategoryName": "Fixation Systems",
        "Items": [
          { "ItemID": 2031, "ItemName": "Posterior Cervical Fixation Systems", "Sizes": [{ "name": "Small" }, { "name": "Medium" }, { "name": "Large" }] },
          { "ItemID": 2032, "ItemName": "Cervical Hooks", "Sizes": [{ "name": "3.5 mm" }, { "name": "5.0 mm" }] }
        ]
      }
    ]
  },
  {
    "CategoryID": 3,
    "CategoryName": "Dorsolumbar Implants",
    "Subcategories": [
      {
        "SubcategoryID": 301,
        "SubcategoryName": "Fixation Systems",
        "Items": [
          { "ItemID": 3001, "ItemName": "Pedicle Screw Systems", "Sizes": [{ "name": "5.0 mm" }, { "name": "5.5 mm" }, { "name": "6.5 mm" }] },
          { "ItemID": 3002, "ItemName": "Posterior Fixation Systems", "Sizes": [{ "name": "40 mm" }, { "name": "50 mm" }, { "name": "60 mm" }] }
        ]
      },
      {
        "SubcategoryID": 302,
        "SubcategoryName": "Rods & Plates",
        "Items": [
          { "ItemID": 3011, "ItemName": "Lumbar Rods", "Sizes": [{ "name": "5.5 mm" }, { "name": "6.0 mm" }] },
          { "ItemID": 3012, "ItemName": "Thoracolumbar Plates", "Sizes": [{ "name": "70 mm" }, { "name": "80 mm" }, { "name": "90 mm" }] }
        ]
      },
      {
        "SubcategoryID": 303,
        "SubcategoryName": "Cages",
        "Items": [
          { "ItemID": 3021, "ItemName": "TLIF Cages", "Sizes": [{ "name": "9 mm" }, { "name": "10 mm" }, { "name": "12 mm" }], "Material": "Titanium", "Model": "TLIF-9" },
          { "ItemID": 3022, "ItemName": "PLIF Cages", "Sizes": [{ "name": "9 mm" }, { "name": "10 mm" }] },
          { "ItemID": 3023, "ItemName": "ALIF Cages", "Sizes": [{ "name": "12 mm" }, { "name": "14 mm" }, { "name": "16 mm" }] },
          { "ItemID": 3024, "ItemName": "Expandable Lumbar Cages", "Sizes": [{ "name": "8–14 mm" }] }
        ]
      },
      {
        "SubcategoryID": 304,
        "SubcategoryName": "Reconstruction",
        "Items": [
          { "ItemID": 3031, "ItemName": "Vertebral Body Replacement Implants", "Sizes": [{ "name": "25 mm" }, { "name": "30 mm" }, { "name": "35 mm" }] }
        ]
      }
    ]
  },
  {
    "CategoryID": 4,
    "CategoryName": "Orthopaedic Implants",
    "Subcategories": [
      {
        "SubcategoryID": 401,
        "SubcategoryName": "Plates & Screws",
        "Items": [
          { "ItemID": 4001, "ItemName": "Bone Plates", "Sizes": [{ "name": "40 mm" }, { "name": "50 mm" }, { "name": "60 mm" }, { "name": "70 mm" }] },
          { "ItemID": 4002, "ItemName": "Bone Screws", "Sizes": [{ "name": "3.5 mm" }, { "name": "4.0 mm" }, { "name": "4.5 mm" }] },
          { "ItemID": 4003, "ItemName": "Locking Plates", "Sizes": [{ "name": "40 mm" }, { "name": "60 mm" }, { "name": "80 mm" }] }
        ]
      },
      {
        "SubcategoryID": 402,
        "SubcategoryName": "Nails",
        "Items": [
          { "ItemID": 4011, "ItemName": "Intramedullary Nails", "Sizes": [{ "name": "240 mm" }, { "name": "260 mm" }, { "name": "280 mm" }] },
          { "ItemID": 4012, "ItemName": "Femoral Nails", "Sizes": [{ "name": "300 mm" }, { "name": "340 mm" }, { "name": "380 mm" }] },
          { "ItemID": 4013, "ItemName": "Tibia Nails", "Sizes": [{ "name": "240 mm" }, { "name": "260 mm" }, { "name": "300 mm" }] },
          { "ItemID": 4014, "ItemName": "Fibula Plates", "Sizes": [{ "name": "60 mm" }, { "name": "80 mm" }, { "name": "100 mm" }] }
        ]
      },
      {
        "SubcategoryID": 403,
        "SubcategoryName": "Joint Implants",
        "Items": [
          { "ItemID": 4021, "ItemName": "Hip Prosthesis", "Sizes": [{ "name": "Size 1" }, { "name": "Size 2" }, { "name": "Size 3" }, { "name": "Size 4" }], "Material": "Cobalt-Chrome", "Model": "HP-STD" },
          { "ItemID": 4022, "ItemName": "Knee Prosthesis", "Sizes": [{ "name": "Small" }, { "name": "Medium" }, { "name": "Large" }] },
          { "ItemID": 4023, "ItemName": "Shoulder Implants", "Sizes": [{ "name": "Small" }, { "name": "Medium" }] },
          { "ItemID": 4024, "ItemName": "Ankle Implants", "Sizes": [{ "name": "Small" }, { "name": "Medium" }, { "name": "Large" }] }
        ]
      },
      {
        "SubcategoryID": 404,
        "SubcategoryName": "External & Misc",
        "Items": [
          { "ItemID": 4031, "ItemName": "Hand & Wrist Plates", "Sizes": [{ "name": "40 mm" }, { "name": "60 mm" }, { "name": "80 mm" }] },
          { "ItemID": 4032, "ItemName": "Clavicle Plates", "Sizes": [{ "name": "70 mm" }, { "name": "90 mm" }, { "name": "110 mm" }] },
          { "ItemID": 4033, "ItemName": "Bone Graft Substitutes", "Sizes": [{ "name": "5 g" }, { "name": "10 g" }, { "name": "20 g" }] },
          { "ItemID": 4034, "ItemName": "External Fixators", "Sizes": [{ "name": "Small" }, { "name": "Medium" }, { "name": "Large" }] }
        ]
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all items from API
   */
  getAllItems(isActive: string = 'Y'): Observable<Item[]> {
    const endpoint = ENDPOINTS.ITEMS.LIST(isActive === 'Y');
    return this.apiService.get<Item[]>(endpoint);
  }

  /**
   * Get a single item by ID
   */
  getItemById(id: number): Observable<Item> {
    return this.apiService.get<Item>(ENDPOINTS.ITEMS.GET(id));
  }

  /**
   * Create a new item
   */
  createItem(data: ItemFormData): Observable<Item> {
    return this.apiService.post<Item>(ENDPOINTS.ITEMS.CREATE, data);
  }

  /**
   * Update an existing item
   */
  updateItem(id: number, data: ItemFormData): Observable<Item> {
    return this.apiService.put<Item>(ENDPOINTS.ITEMS.UPDATE(id), data);
  }

  /**
   * Delete an item
   */
  deleteItem(id: number): Observable<void> {
    return this.apiService.delete<void>(ENDPOINTS.ITEMS.DELETE(id));
  }

  /**
   * Get flattened initial items from catalog
   */
  getInitialItemsFromCatalog(): Item[] {
    const today = new Date().toISOString().split('T')[0];
    
    return CATALOG.flatMap((cat) =>
      (cat.Subcategories || []).flatMap((sub) =>
        (sub.Items || []).map((it) => ({
          id: it.ItemID,
          name: it.ItemName,
          shortname: it.ItemName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6),
          group: cat.CategoryName,
          category: sub.SubcategoryName,
          specification: cat.Specifications || sub.Specifications || it.Specifications || '',
          size: it.Sizes?.length ? it.Sizes.map(s => s.name).join('; ') : (sub.Sizes?.length ? sub.Sizes.map(s => s.name).join('; ') : ''),
          material: it.Material || sub.Material || cat.Material || '',
          model: it.Model || sub.Model || cat.Model || '',
          description: '',
          price: 0.00,
          createdAt: today,
          status: 'Active'
        }))
      )
    );
  }

  /**
   * Get unique group options from catalog
   */
  getGroupOptions(): string[] {
    const groups = CATALOG.map(cat => cat.CategoryName);
    return [...new Set(groups)].sort();
  }

  /**
   * Get unique category options from catalog
   */
  getCategoryOptions(): string[] {
    const categories = CATALOG.flatMap(cat =>
      (cat.Subcategories || []).map(sub => sub.SubcategoryName)
    );
    return [...new Set(categories)].sort();
  }
}
