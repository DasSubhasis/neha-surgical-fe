import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getCurrentApiConfig } from '../config/api.config';

export interface AppSettings {
  roles: {
    assistantRoleId: number;
  };
  api: {
    baseUrl: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppSettings | null = null;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    try {
      this.config = await firstValueFrom(
        this.http.get<AppSettings>('/appsettings.json')
      );
    } catch (error) {
      console.error('Failed to load appsettings.json, using environment-based defaults:', error);
      // Fallback to environment-based configuration
      const apiConfig = getCurrentApiConfig();
      this.config = {
        roles: {
          assistantRoleId: 4
        },
        api: {
          baseUrl: apiConfig.BASE_URL.replace('/api', '') // Remove /api suffix
        }
      };
    }
  }

  getConfig(): AppSettings {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  getAssistantRoleId(): number {
    return this.getConfig().roles.assistantRoleId;
  }

  getApiBaseUrl(): string {
    return this.getConfig().api.baseUrl;
  }
}
