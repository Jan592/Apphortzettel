# 🏷️ Browser-Titel Konfiguration

## ✅ Bereits Implementiert

Die App setzt automatisch den Browser-Tab-Titel auf **"Hortzettel"** und passt ihn dynamisch an die aktuelle Ansicht an.

### 📋 Dynamische Titel pro Ansicht:

| Ansicht | Browser-Titel |
|---------|---------------|
| Login | `Hortzettel` |
| Dashboard | `Hortzettel - Dashboard` |
| Erstellen | `Hortzettel - Erstellen` |
| Meine Zettel | `Hortzettel - Meine Zettel` |
| Profil | `Hortzettel - Profil` |
| Hortner Login | `Hortzettel - Hortner Login` |
| Hortner Dashboard | `Hortzettel - Hortner` |
| Admin Login | `Hortzettel - Admin Login` |
| Admin Dashboard | `Hortzettel - Admin` |

## 🔧 Wie es funktioniert

### 1. **Document Title (Browser-Tab)**
In `/App.tsx` wird der Titel automatisch gesetzt:

```typescript
useEffect(() => {
  const viewTitles: Record<View, string> = {
    login: "Hortzettel",
    dashboard: "Hortzettel - Dashboard",
    createHortzettel: "Hortzettel - Erstellen",
    // ... weitere Views
  };
  
  document.title = viewTitles[currentView] || "Hortzettel";
}, [currentView]);
```

### 2. **Meta Tags (PWA & Mobile)**
Die App fügt automatisch folgende Meta-Tags hinzu:

```html
<meta name="application-name" content="Hortzettel" />
<meta name="apple-mobile-web-app-title" content="Hortzettel" />
```

### 3. **PWA Manifest**
Das `manifest.json` definiert:

```json
{
  "name": "Hortzettel App - Grundschule Auma",
  "short_name": "Hortzettel"
}
```

- **`short_name`** wird beim Installieren auf dem Home-Screen verwendet
- **`name`** wird im App-Drawer/Menü angezeigt

## 📱 Wo erscheint "Hortzettel"?

### ✅ Desktop Browser:
- Browser-Tab-Titel
- Lesezeichen-Name
- Verlauf

### ✅ Mobile Browser:
- Browser-Tab-Titel
- "Zum Home-Bildschirm hinzufügen" Dialog

### ✅ Installierte PWA:
- App-Name auf Home-Screen
- App-Switcher/Task-Manager
- Benachrichtigungen

## 🎨 Anpassung

### Titel ändern:
In `/App.tsx` die `viewTitles` anpassen:

```typescript
const viewTitles: Record<View, string> = {
  login: "Mein Titel",
  dashboard: "Mein Titel - Dashboard",
  // ...
};
```

### App-Namen ändern:
In `/public/manifest.json`:

```json
{
  "short_name": "Neuer Name",
  "name": "Neuer langer Name"
}
```

## 🔍 Testen

1. **Browser-Tab:** Öffne die App → Schau in den Tab-Titel
2. **PWA:** Installiere die App → Name auf Home-Screen prüfen
3. **Mobile:** "Zum Home-Bildschirm" → Angezeigter Name prüfen

## ✨ Vorteile

✅ **Kurzer Name:** "Hortzettel" statt langer URL  
✅ **Professionell:** Sauber beschriftet in Tabs  
✅ **Wiedererkennbar:** Leicht zu finden in Tab-Leiste  
✅ **PWA-Ready:** Funktioniert auch als installierte App  
✅ **Dynamisch:** Zeigt aktuelle Ansicht im Titel  

---

**📝 Hinweis:** Alle Einstellungen werden automatisch beim App-Start angewendet. Keine manuelle Konfiguration nötig!
