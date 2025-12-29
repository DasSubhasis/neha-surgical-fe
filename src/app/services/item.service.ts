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

}
