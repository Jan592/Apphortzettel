export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  class?: string;
  birthDate?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: string;
}

export interface FamilyProfile {
  children: Child[];
  parentPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// Legacy support - kept for backward compatibility
export interface ChildProfile {
  class?: string;
  birthDate?: string;
  parentPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: string;
}

export interface HortzettelData {
  childName: string;
  childId?: string; // Reference to child in family profile
  class: string;
  canGoHomeAlone: string;
  canGoHomeAloneOther?: string;
  monday: string;
  mondayOther?: string;
  mondayEdits?: number;
  tuesday: string;
  tuesdayOther?: string;
  tuesdayEdits?: number;
  wednesday: string;
  wednesdayOther?: string;
  wednesdayEdits?: number;
  thursday: string;
  thursdayOther?: string;
  thursdayEdits?: number;
  friday: string;
  fridayOther?: string;
  fridayEdits?: number;
  childProfile?: ChildProfile;
  weekNumber?: number;
  year?: number;
  status?: 'aktiv' | 'archiviert';
  updatedAt?: string; // Timestamp when last updated
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  createdAt: string;
  createdBy: string;
}

export interface HortzettelTemplate {
  id: string;
  name: string;
  class: string;
  canGoHomeAlone: string;
  canGoHomeAloneOther?: string;
  monday: string;
  mondayOther?: string;
  tuesday: string;
  tuesdayOther?: string;
  wednesday: string;
  wednesdayOther?: string;
  thursday: string;
  thursdayOther?: string;
  friday: string;
  fridayOther?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'parent' | 'hortner' | 'admin';
  childProfile?: ChildProfile; // Legacy
  familyProfile?: FamilyProfile; // New multi-child support
  createdAt: string;
  lastLogin?: string;
  userId?: string; // Supabase auth user ID
  adminPasswordNote?: string; // Admin-only: stores password for reference (internal use only)
}

export interface AppContent {
  // Allgemein
  appTitle: string;
  appSubtitle: string;
  welcomeMessage: string;
  
  // Login/Register
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  loginButtonText: string;
  registerButtonText: string;
  
  // Dashboard
  dashboardWelcome: string;
  dashboardSubtitle: string;
  createHortzettelButton: string;
  myHortzettelButton: string;
  profileButton: string;
  
  // Hortzettel-Formular
  hortzettelTitle: string;
  hortzettelDescription: string;
  childNameLabel: string;
  classLabel: string;
  homeAloneQuestion: string;
  weekdayLabel: string;
  
  // Profile
  profileTitle: string;
  profileDescription: string;
  
  // Admin
  adminDashboardTitle: string;
  settingsDescription: string;
  
  // Hortner
  hortnerDashboardTitle: string;
  hortnerSubtitle: string;
  
  // Sonstiges
  footerText: string;
  privacyNotice: string;
}

export interface AppSettings {
  schoolName: string;
  classes: string[];
  timeOptions: { value: string; label: string }[];
  colorThemes: { name: string; value: string; gradient: string }[];
  allowedHomeAloneOptions: { value: string; label: string }[];
  content: AppContent;
}

export interface SystemStats {
  totalUsers: number;
  totalHortzettel: number;
  activeHortzettel: number;
  archivedHortzettel: number;
  thisWeekSubmissions: number;
  totalTemplates: number;
  classCounts: Record<string, number>;
  popularTimes: Record<string, number>;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'parent' | 'hortner';
  subject: string;
  message: string;
  status: 'ungelesen' | 'gelesen' | 'beantwortet';
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
  replyRead?: boolean;
  replyReadAt?: string;
  readAt?: string;
}

export interface TimeRestrictionSettings {
  enabled: boolean;
  blockStartHour: number;    // 0-23
  blockEndHour: number;      // 0-23
  blockWeekdaysOnly: boolean; // true = nur Mo-Fr sperren, false = jeden Tag
}