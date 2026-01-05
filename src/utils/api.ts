import { projectId, publicAnonKey } from './supabase/info';
import type { HortzettelData, ChildProfile, FamilyProfile, Announcement, HortzettelTemplate, AdminUser, AppSettings, SystemStats, TimeRestrictionSettings } from '../types/hortzettel';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-fb86b8a8`;

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}

export class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API Response] ${options.method || 'GET'} ${url} - Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Netzwerkfehler' }));
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, errorData);
      
      // Throw error object with more details
      const error: any = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const data = await response.json();
    console.log(`[API Success] ${options.method || 'GET'} ${url}:`, data);
    return data;
  }

  // ========== USER METHODS ==========

  async signup(firstName: string, lastName: string, password: string, childProfile?: ChildProfile, familyProfile?: FamilyProfile) {
    return this.request<{ success: boolean; message: string }>('/signup', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, password, childProfile, familyProfile }),
    });
  }

  async login(firstName: string, lastName: string, password: string) {
    const response = await this.request<{
      success: boolean;
      accessToken: string;
      user: { firstName: string; lastName: string; childProfile: ChildProfile; familyProfile?: FamilyProfile; role?: 'parent' | 'hortner' | 'admin' };
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, password }),
    });

    if (response.accessToken) {
      this.setAccessToken(response.accessToken);
    }

    return response;
  }

  async getUser() {
    return this.request<{
      firstName: string;
      lastName: string;
      childProfile: ChildProfile;
      familyProfile?: FamilyProfile;
      role?: 'parent' | 'hortner' | 'admin';
    }>('/user');
  }

  async updateProfile(
    firstName: string,
    lastName: string,
    childProfile: ChildProfile,
    familyProfile: FamilyProfile,
    password?: string
  ) {
    return this.request<{ success: boolean; message: string }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName, childProfile, familyProfile, password }),
    });
  }

  logout() {
    this.setAccessToken(null);
  }

  async requestPasswordReset(firstName: string, lastName: string) {
    return this.request<{
      success: boolean;
      temporaryPassword: string;
      message: string;
    }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName }),
    });
  }

  // ========== HORTZETTEL METHODS ==========

  async getHortzettel() {
    return this.request<{
      hortzettel: (HortzettelData & { id: string; createdAt: string })[];
    }>('/hortzettel');
  }

  async createHortzettel(data: HortzettelData) {
    return this.request<{
      success: boolean;
      hortzettel: HortzettelData & { id: string; createdAt: string };
    }>('/hortzettel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHortzettel(id: string, data: HortzettelData) {
    return this.request<{
      success: boolean;
      hortzettel: HortzettelData & { id: string; createdAt: string };
    }>(`/hortzettel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHortzettel(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/hortzettel/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  async autoArchiveOldHortzettel() {
    return this.request<{ 
      success: boolean; 
      archivedCount: number;
      message: string 
    }>('/hortzettel/auto-archive', {
      method: 'POST',
    });
  }

  // ========== HORTNER METHODS ==========

  async hortnerLogin(klasse: string, password: string) {
    return this.request<{ success: boolean; klasse: string }>('/hortner/login', {
      method: 'POST',
      body: JSON.stringify({ klasse, password }),
    });
  }

  async getHortnerHortzettel() {
    return this.request<{
      hortzettel: (HortzettelData & { id: string; createdAt: string })[];
    }>('/hortner/hortzettel');
  }

  async archiveCurrentWeek() {
    return this.request<{
      success: boolean;
      archivedCount: number;
      message: string;
    }>('/hortner/archive-week', {
      method: 'POST',
    });
  }

  // ========== ANNOUNCEMENT METHODS ==========

  async getAnnouncements() {
    return this.request<{
      announcements: Announcement[];
    }>('/announcements');
  }

  async createAnnouncement(title: string, message: string, type: 'info' | 'warning' | 'urgent', createdBy?: string) {
    return this.request<{
      success: boolean;
      announcement: Announcement;
    }>('/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, message, type, createdBy }),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/announcements/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ========== TEMPLATE METHODS ==========

  async getTemplates() {
    return this.request<{
      templates: HortzettelTemplate[];
    }>('/templates');
  }

  async createTemplate(name: string, data: Partial<HortzettelData>) {
    return this.request<{
      success: boolean;
      template: HortzettelTemplate;
    }>('/templates', {
      method: 'POST',
      body: JSON.stringify({ name, data }),
    });
  }

  async updateTemplate(id: string, name: string) {
    return this.request<{
      success: boolean;
      template: HortzettelTemplate;
    }>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteTemplate(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/templates/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ========== ADMIN METHODS ==========

  async adminLogin(email: string, password: string) {
    const response = await this.request<{
      success: boolean;
      accessToken: string;
      admin: { email: string };
    }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.accessToken) {
      this.setAccessToken(response.accessToken);
    }

    return response;
  }

  async getAdminStats() {
    return this.request<{ stats: SystemStats }>('/admin/stats');
  }

  async getAllUsers() {
    return this.request<{ users: AdminUser[] }>('/admin/users');
  }

  async updateUserProfile(userId: string, data: Partial<AdminUser>) {
    return this.request<{ success: boolean; user: AdminUser }>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(userId: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    });
  }

  async createUser(firstName: string, lastName: string, password: string) {
    return this.request<{ success: boolean; message: string; user: AdminUser }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, password }),
    });
  }

  async updateUserRole(userId: string, role: 'parent' | 'hortner' | 'admin') {
    return this.request<{ success: boolean; message: string }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getSettings() {
    // Use admin/settings endpoint - public but requires anon key for Supabase Edge Functions
    console.log('🌐 [API] Calling /admin/settings (with anon key)');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        console.warn('🌐 [API] /admin/settings failed:', response.status);
        return { settings: null }; // Return null/default on error
      }

      const data = await response.json();
      console.log('🌐 [API] /admin/settings success:', data);
      return data;
    } catch (error) {
      console.log('ℹ️ [API] /admin/settings not reachable, using defaults');
      return { settings: null };
    }
  }

  async getAppSettings() {
    return this.request<{ settings: AppSettings }>('/admin/settings');
  }

  async updateAppSettings(settings: Partial<AppSettings>) {
    return this.request<{ success: boolean; settings: AppSettings }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateSettings(settings: Partial<AppSettings>) {
    // Alias for updateAppSettings
    return this.updateAppSettings(settings);
  }

  async uploadSchoolPhoto(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload-school-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return { success: true, url: data.url };
    } catch (error: any) {
      console.error('Error uploading school photo:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePWASettings(pwaSettings: {
    name: string;
    short_name: string;
    description: string;
    theme_color: string;
    background_color: string;
  }) {
    return this.request<{ success: boolean; message: string }>('/admin/pwa-settings', {
      method: 'PUT',
      body: JSON.stringify(pwaSettings),
    });
  }

  async getAllHortzettelAdmin() {
    return this.request<{
      hortzettel: (HortzettelData & { id: string; userId: string; createdAt: string })[];
    }>('/admin/hortzettel');
  }

  async exportData(format: 'json' | 'csv') {
    return this.request<{ data: string; filename: string }>(`/admin/export?format=${format}`);
  }

  // ========== MESSAGE METHODS ==========

  async sendMessage(subject: string, message: string) {
    return this.request<{
      success: boolean;
      message: any;
    }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ subject, message }),
    });
  }

  async sendHortnerMessage(klasse: string, subject: string, message: string) {
    return this.request<{
      success: boolean;
      message: any;
    }>('/hortner/messages', {
      method: 'POST',
      body: JSON.stringify({ klasse, subject, message }),
    });
  }

  async getMessages() {
    return this.request<{
      messages: any[];
    }>('/messages');
  }

  async getHortnerMessages(klasse: string) {
    return this.request<{
      messages: any[];
    }>(`/hortner/messages/${klasse}`);
  }

  async getAdminMessages() {
    return this.request<{
      messages: any[];
    }>('/admin/messages');
  }

  async markMessageAsRead(id: string) {
    return this.request<{
      success: boolean;
      message: any;
    }>(`/admin/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  async markReplyAsRead(id: string) {
    return this.request<{
      success: boolean;
      message: any;
    }>(`/messages/${id}/mark-reply-read`, {
      method: 'PUT',
    });
  }

  async replyToMessage(id: string, reply: string) {
    return this.request<{
      success: boolean;
      message: any;
    }>(`/admin/messages/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reply }),
    });
  }

  async deleteMessage(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== TIME RESTRICTION SETTINGS ==========

  async getTimeRestrictions() {
    // Public endpoint - uses anon key like getSettings()
    console.log('🌐 [API] Calling /admin/time-restrictions (public, with anon key)');
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/time-restrictions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        console.error('🌐 [API] /admin/time-restrictions failed:', response.status);
        // Return default settings instead of throwing error
        return {
          settings: {
            enabled: true,
            blockStartHour: 12,
            blockEndHour: 17,
            blockWeekdaysOnly: true,
          }
        };
      }

      const data = await response.json();
      console.log('🌐 [API] /admin/time-restrictions success:', data);
      return data;
    } catch (error) {
      console.warn('🌐 [API] /admin/time-restrictions error, using defaults:', error);
      // Return default settings on any error
      return {
        settings: {
          enabled: true,
          blockStartHour: 12,
          blockEndHour: 17,
          blockWeekdaysOnly: true,
        }
      };
    }
  }

  async updateTimeRestrictions(settings: TimeRestrictionSettings) {
    console.log('[API] updateTimeRestrictions aufgerufen mit:', settings);
    
    try {
      const result = await this.request<{
        success: boolean;
        settings: TimeRestrictionSettings;
      }>('/admin/time-restrictions', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      
      console.log('[API] updateTimeRestrictions erfolgreich:', result);
      return result;
    } catch (error) {
      console.error('[API] updateTimeRestrictions Fehler:', error);
      throw error;
    }
  }

  // ========== LEGAL SETTINGS ==========

  async getLegalSettings() {
    return this.request<{
      settings?: any;
    }>('/admin/legal-settings');
  }

  async saveLegalSettings(settings: any) {
    return this.request<{
      success: boolean;
      settings?: any;
    }>('/admin/legal-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ========== LOGO SETTINGS ==========

  async getLogo() {
    // Public endpoint - uses anon key like getSettings()
    try {
      const response = await fetch(`${API_BASE_URL}/admin/logo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        // Return null logo instead of throwing error
        return { logo: null };
      }

      return response.json();
    } catch (error) {
      // Use console.log for network errors to avoid cluttering the console with warnings/errors
      // This is an expected fallback behavior when offline or backend is unreachable
      console.log('Info: Logo konnte nicht geladen werden (verwende Fallback):', error);
      return { logo: null };
    }
  }

  async uploadLogo(logo: string) {
    return this.request<{
      success: boolean;
      logo: string;
    }>('/admin/logo', {
      method: 'PUT',
      body: JSON.stringify({ logo }),
    });
  }

  async deleteLogo() {
    return this.request<{
      success: boolean;
      message: string;
    }>('/admin/logo', {
      method: 'DELETE',
    });
  }

  // ========== FORM DESIGN SETTINGS ==========

  async getFormDesignSettings() {
    return this.request<{
      settings: any;
    }>('/admin/form-design-settings');
  }

  async saveFormDesignSettings(settings: any) {
    return this.request<{
      success: boolean;
      settings: any;
    }>('/admin/form-design-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ========== DROPDOWN OPTIONS ==========

  async getDropdownOptions() {
    return this.request<{
      options: {
        timeOptions: { value: string; label: string; enabled: boolean }[];
        classes: { value: string; label: string; enabled: boolean }[];
      };
    }>('/admin/dropdown-options');
  }

  async saveDropdownOptions(options: any) {
    return this.request<{
      success: boolean;
      options: any;
    }>('/admin/dropdown-options', {
      method: 'PUT',
      body: JSON.stringify(options),
    });
  }
}

export const api = new ApiClient();