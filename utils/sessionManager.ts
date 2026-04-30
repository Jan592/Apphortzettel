/**
 * Session Manager für "Angemeldet bleiben" Funktion
 * Speichert Login-Daten für 24 Stunden
 */

const SESSION_KEY = 'hortzettel_user_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Stunden

interface UserSession {
  firstName: string;
  lastName: string;
  timestamp: number;
}

/**
 * Speichert eine Login-Session mit Zeitstempel
 */
export function saveSession(firstName: string, lastName: string): void {
  const session: UserSession = {
    firstName,
    lastName,
    timestamp: Date.now()
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  console.log('✅ Session gespeichert - gültig bis:', new Date(Date.now() + SESSION_DURATION_MS));
}

/**
 * Gibt gespeicherte Session zurück, wenn diese noch gültig ist
 */
export function getSession(): UserSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      return null;
    }

    const session: UserSession = JSON.parse(stored);
    const age = Date.now() - session.timestamp;

    // Prüfen ob Session noch gültig ist (< 24 Stunden)
    if (age < SESSION_DURATION_MS) {
      const remainingHours = Math.floor((SESSION_DURATION_MS - age) / (60 * 60 * 1000));
      console.log(`✅ Gültige Session gefunden - noch ${remainingHours}h gültig`);
      return session;
    } else {
      // Session abgelaufen
      console.log('⏰ Session abgelaufen nach 24 Stunden');
      clearSession();
      return null;
    }
  } catch (error) {
    console.error('Fehler beim Laden der Session:', error);
    clearSession();
    return null;
  }
}

/**
 * Löscht die gespeicherte Session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  console.log('🗑️ Session gelöscht');
}

/**
 * Prüft ob eine gültige Session existiert
 */
export function hasValidSession(): boolean {
  return getSession() !== null;
}
