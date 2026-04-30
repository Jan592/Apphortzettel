/**
 * 🌐 App-Konfiguration
 * 
 * Hier kannst du zentral alle URLs und Domain-Einstellungen verwalten.
 * Diese Werte werden für Meta-Tags, Social Sharing und PWA verwendet.
 */

export const APP_CONFIG = {
  // 🌐 Domain & URLs
  // Ändere diese URL, wenn du eine Custom Domain einrichtest
  domain: "https://deine-domain.de", // z.B. "https://hortzettel-auma.de"
  
  // 📱 App-Informationen
  appName: "Hortzettel",
  appTitle: "Hortzettel App",
  schoolName: "Grundschule Auma",
  
  // 📝 Beschreibungen
  shortDescription: "Digitale Hortzettel-Verwaltung",
  fullDescription: "Digitale Hortzettel-Verwaltung für die Grundschule Auma - Einfach, sicher und übersichtlich",
  
  // 🎨 Branding
  themeColor: "#3B82F6", // Primärfarbe (Blau)
  backgroundColor: "#FFFFFF",
  
  // 📧 Kontakt
  supportEmail: "hort@grundschule-auma.de",
  
  // 🔗 Social Media (optional)
  social: {
    // facebook: "https://facebook.com/grundschule-auma",
    // instagram: "https://instagram.com/grundschule-auma",
  },
  
  // 🖼️ Open Graph (Social Sharing)
  ogImage: "/app-icon-512.png", // Bild für Social Media Shares
  ogType: "website",
  
  // 🏫 Schul-Informationen
  school: {
    name: "Grundschule Auma",
    address: "Schulstraße 1, 07955 Auma-Weidatal",
    phone: "+49 36626 12345",
    // website: "https://grundschule-auma.de",
  },
  
  // ⚙️ Features
  features: {
    pwaEnabled: true,
    darkModeEnabled: true,
    multiThemeEnabled: true,
    adminMessagingEnabled: true,
    weeklyArchiveEnabled: true,
  },
  
  // 📅 App-Version & Datum
  version: "2.0.0",
  lastUpdated: "2024-01-15",
  
  // 🔧 Technische Einstellungen
  api: {
    timeout: 30000, // 30 Sekunden
    retryAttempts: 3,
  },
};

/**
 * 🔗 URL-Helper Funktionen
 */
export const getFullUrl = (path: string = "") => {
  return `${APP_CONFIG.domain}${path}`;
};

export const getOgImageUrl = () => {
  return getFullUrl(APP_CONFIG.ogImage);
};

/**
 * 📝 Verwendung:
 * 
 * import { APP_CONFIG, getFullUrl } from './config/app-config';
 * 
 * // Meta-Tag setzen:
 * <meta property="og:url" content={getFullUrl()} />
 * <meta property="og:title" content={APP_CONFIG.appTitle} />
 * <meta property="og:description" content={APP_CONFIG.fullDescription} />
 * <meta property="og:image" content={getOgImageUrl()} />
 * 
 * // Im Code verwenden:
 * console.log(`App läuft auf: ${APP_CONFIG.domain}`);
 */

export default APP_CONFIG;
