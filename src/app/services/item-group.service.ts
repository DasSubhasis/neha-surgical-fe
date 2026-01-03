import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ENDPOINTS } from '../config/api.config';

export interface ItemGroup {
  itemGroupId: number;
  name: string;
  description: string;
  isActive: string;
}

export interface ItemGroupFormData {
  name: string;
  description: string;
  isActive: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemGroupService {
  constructor(private apiService: ApiService) {}

  getAllItemGroups(isActive?: string): Observable<ItemGroup[]> {
    const endpoint = isActive 
      ? `${ENDPOINTS.ITEM_GROUPS.LIST}?isActive=${isActive}`
      : ENDPOINTS.ITEM_GROUPS.LIST;
    
    return this.apiService.get<ApiResponse<ItemGroup[]>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  getItemGroupById(id: number): Observable<ItemGroup> {
    return this.apiService.get<ApiResponse<ItemGroup>>(ENDPOINTS.ITEM_GROUPS.GET(id)).pipe(
      map(response => response.data!)
    );
  }

  createItemGroup(itemGroupData: ItemGroupFormData): Observable<ApiResponse<ItemGroup>> {
    return this.apiService.post<ApiResponse<ItemGroup>>(ENDPOINTS.ITEM_GROUPS.CREATE, itemGroupData);
  }

  updateItemGroup(id: number, itemGroupData: ItemGroupFormData): Observable<ApiResponse<ItemGroup>> {
    return this.apiService.put<ApiResponse<ItemGroup>>(ENDPOINTS.ITEM_GROUPS.UPDATE(id), itemGroupData);
  }

  deleteItemGroup(id: number): Observable<ApiResponse> {
    return this.apiService.delete<ApiResponse>(ENDPOINTS.ITEM_GROUPS.DELETE(id));
  }
}
