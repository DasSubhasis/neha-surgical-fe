import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
      console.error('Failed to load appsettings.json, using defaults:', error);
      // Fallback to default configuration
      this.config = {
        roles: {
          assistantRoleId: 4
        },
        api: {
          baseUrl: 'http://localhost:5280'
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
