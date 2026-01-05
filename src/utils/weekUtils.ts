// Helper functions for week-based system
import type { TimeRestrictionSettings } from '../types/hortzettel';

// Cache für TimeRestriction-Einstellungen
let cachedSettings: TimeRestrictionSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 Minute Cache

// Default-Einstellungen (Fallback)
const DEFAULT_SETTINGS: TimeRestrictionSettings = {
  enabled: true,
  blockStartHour: 12,
  blockEndHour: 17,
  blockWeekdaysOnly: true,
};

export function getWeekNumber(date: Date = new Date()): { weekNumber: number; year: number } {
  // Copy date so don't modify original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return {
    weekNumber,
    year: d.getUTCFullYear()
  };
}

export function formatWeekLabel(weekNumber: number, year: number): string {
  return `KW ${weekNumber}, ${year}`;
}

export function isCurrentOrFutureWeek(weekNumber: number, year: number): boolean {
  const current = getWeekNumber();
  
  if (year > current.year) return true;
  if (year < current.year) return false;
  
  return weekNumber >= current.weekNumber;
}

/**
 * Lädt die aktuellen Zeitbeschränkungseinstellungen (mit Caching)
 */
async function getTimeRestrictionSettings(): Promise<TimeRestrictionSettings> {
  const now = Date.now();
  
  // Wenn Cache noch gültig ist, verwende gecachte Einstellungen
  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSettings;
  }
  
  try {
    // Dynamischer Import, um zirkuläre Dependencies zu vermeiden
    const { api } = await import('./api');
    const response = await api.getTimeRestrictions();
    
    if (response.settings) {
      cachedSettings = response.settings;
      lastFetchTime = now;
      return response.settings;
    }
  } catch (error) {
    console.warn('[getTimeRestrictionSettings] Fehler beim Laden der Einstellungen, verwende Defaults:', error);
  }
  
  // Fallback auf Default-Einstellungen
  return DEFAULT_SETTINGS;
}

/**
 * Invalidiert den Cache (nach Update der Einstellungen aufrufen)
 */
export function invalidateTimeRestrictionCache(): void {
  cachedSettings = null;
  lastFetchTime = 0;
  console.log('[invalidateTimeRestrictionCache] Cache wurde geleert');
}

/**
 * Prüft ob Hortzettel-Aktionen (Erstellen UND Bearbeiten) aktuell erlaubt sind
 * Verwendet die konfigurierbaren Einstellungen aus dem Admin-Bereich
 */
export async function isEditingAllowedAsync(): Promise<boolean> {
  const settings = await getTimeRestrictionSettings();
  
  // Wenn Zeitbeschränkung deaktiviert ist, immer erlauben
  if (!settings.enabled) {
    console.log(`[isEditingAllowedAsync] Zeitbeschränkung deaktiviert - immer erlaubt`);
    return true;
  }
  
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
  
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  console.log(`[isEditingAllowedAsync] Aktuelle Zeit: ${dayNames[dayOfWeek]}, ${hour}:${minutes.toString().padStart(2, '0')} Uhr`);
  console.log(`[isEditingAllowedAsync] Einstellungen: Sperre ${settings.blockStartHour}:00-${settings.blockEndHour}:00, nur Wochentage: ${settings.blockWeekdaysOnly}`);
  
  // Wenn nur Wochentage gesperrt werden sollen und es Wochenende ist
  if (settings.blockWeekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
    console.log(`[isEditingAllowedAsync] Wochenende - erlaubt`);
    return true;
  }
  
  // Prüfe ob aktuelle Stunde außerhalb der Sperrzeit liegt
  const allowed = hour < settings.blockStartHour || hour >= settings.blockEndHour;
  console.log(`[isEditingAllowedAsync] ${allowed ? 'Erlaubt' : 'Gesperrt'} (${settings.blockStartHour}:00-${settings.blockEndHour}:00 Uhr)`);
  
  return allowed;
}

/**
 * Synchrone Version für sofortige Checks (verwendet gecachte Werte)
 * WICHTIG: Für erste Verwendung sollte isEditingAllowedAsync() verwendet werden
 */
export function isEditingAllowed(): boolean {
  const settings = cachedSettings || DEFAULT_SETTINGS;
  
  // Wenn Zeitbeschränkung deaktiviert ist, immer erlauben
  if (!settings.enabled) {
    return true;
  }
  
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Wenn nur Wochentage gesperrt werden sollen und es Wochenende ist
  if (settings.blockWeekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return true;
  }
  
  // Prüfe ob aktuelle Stunde außerhalb der Sperrzeit liegt
  return hour < settings.blockStartHour || hour >= settings.blockEndHour;
}

/**
 * Gibt eine Nachricht zurück, wann die nächste Aktion erlaubt ist
 */
export function getNextEditingTimeMessage(): string {
  const settings = cachedSettings || DEFAULT_SETTINGS;
  
  // Wenn deaktiviert
  if (!settings.enabled) {
    return "Jederzeit möglich";
  }
  
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Am Wochenende (wenn nur Wochentage gesperrt werden)
  if (settings.blockWeekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return "Am Wochenende jederzeit möglich";
  }
  
  // Zeitstatus
  if (hour < settings.blockStartHour) {
    return `Möglich bis ${settings.blockStartHour}:00 Uhr (danach gesperrt bis ${settings.blockEndHour}:00 Uhr)`;
  } else if (hour >= settings.blockEndHour) {
    return "Möglich bis Mitternacht";
  } else {
    const weekdayInfo = settings.blockWeekdaysOnly ? " (Montag-Freitag)" : "";
    return `Gesperrt bis ${settings.blockEndHour}:00 Uhr${weekdayInfo}`;
  }
}

/**
 * Gibt die aktuellen Einstellungen zurück (für UI-Anzeige)
 */
export function getCachedTimeRestrictionSettings(): TimeRestrictionSettings {
  return cachedSettings || DEFAULT_SETTINGS;
}
