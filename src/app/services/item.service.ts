import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface Item {
  id?: number;
  itemId?: number;
  name: string;
  shortname: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  itemGroupId?: number;
  itemGroupName?: string;
  specificationId?: number;
  specificationName?: string;
  sizeId?: number;
  sizeName?: string;
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
  brandId: number | null;
  categoryId: number | null;
  itemGroupId: number | null;
  specificationId: number | null;
  sizeId: number | null;
  material: string;
  model: string;
  description: string;
  price: number;
  status: string;
  isActive: string;
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
  getAllItems(isActive: boolean = true): Observable<Item[]> {
    const endpoint = ENDPOINTS.ITEMS.LIST(isActive);
    return this.apiService.get<ApiResponse<Item[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
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
    const payload = {
      name: data.name,
      shortname: data.shortname,
      brandId: data.brandId,
      categoryId: data.categoryId,
      itemGroupId: data.itemGroupId || 0,
      specificationId: data.specificationId || 0,
      sizeId: data.sizeId || 0,
      material: data.material || '',
      model: data.model || '',
      description: data.description || '',
      price: data.price,
      status: data.status,
      isActive: data.isActive
    };
    return this.apiService.post<Item>(ENDPOINTS.ITEMS.CREATE, payload);
  }

  /**
   * Update an existing item
   */
  updateItem(id: number, data: ItemFormData): Observable<Item> {
    const payload = {
      itemId: id,
      name: data.name,
      shortname: data.shortname,
      brandId: data.brandId,
      categoryId: data.categoryId,
      itemGroupId: data.itemGroupId || 0,
      specificationId: data.specificationId || 0,
      sizeId: data.sizeId || 0,
      material: data.material || '',
      model: data.model || '',
      description: data.description || '',
      price: data.price,
      status: data.status,
      isActive: data.isActive
    };
    return this.apiService.put<Item>(ENDPOINTS.ITEMS.UPDATE(id), payload);
  }

  /**
   * Get items by brand ID
   */
  getItemsByBrand(brandId: number): Observable<Item[]> {
    return this.apiService.get<ApiResponse<Item[]>>(`/Items/brand/${brandId}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get items by item group ID
   */
  getItemsByItemGroup(itemGroupId: number): Observable<Item[]> {
    return this.apiService.get<ApiResponse<Item[]>>(`/Items/itemgroup/${itemGroupId}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Delete an item
   */
  deleteItem(id: number): Observable<void> {
    return this.apiService.delete<void>(ENDPOINTS.ITEMS.DELETE(id));
  }

}
