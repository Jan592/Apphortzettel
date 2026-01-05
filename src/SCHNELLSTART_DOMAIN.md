# ⚡ Schnellstart: Domain konfigurieren

## 🎯 In 2 Minuten erledigt!

### Schritt 1: Config-Datei öffnen

Öffne: `/config/app-config.ts`

### Schritt 2: Domain ändern

```typescript
export const APP_CONFIG = {
  // 🌐 Ändere diese Zeile:
  domain: "https://hortzettel-auma.de", // ← Deine Domain hier!
  
  // Optional auch anpassen:
  schoolName: "Grundschule Auma",
  supportEmail: "hort@grundschule-auma.de",
  
  school: {
    name: "Grundschule Auma",
    address: "Schulstraße 1, 07955 Auma-Weidatal",
    phone: "+49 36626 12345",
  },
};
```

### Schritt 3: Fertig! 🎉

Die App verwendet jetzt automatisch:
- ✅ Deine Domain in Meta-Tags
- ✅ Korrekte URLs für Social Sharing
- ✅ Richtige Kontaktdaten

## 🔄 Was passiert automatisch?

### Social Media Sharing (Open Graph):
```html
<meta property="og:url" content="https://hortzettel-auma.de" />
<meta property="og:title" content="Hortzettel App - Grundschule Auma" />
```

### Browser Meta-Tags:
```html
<meta name="description" content="Digitale Hortzettel-Verwaltung..." />
```

### Manifest (PWA):
```json
{
  "start_url": "https://hortzettel-auma.de"
}
```

## 📋 Beispiel-Domains

```typescript
// Eigene Domain:
domain: "https://hortzettel-auma.de"

// Subdomain der Schule:
domain: "https://hort.grundschule-auma.de"

// Hosting-URL (bis Custom Domain eingerichtet):
domain: "https://hortzettel-auma.vercel.app"
```

## ❓ FAQ

### "Ich habe noch keine Domain"
→ Lass erstmal den Standard-Wert stehen  
→ Ändere später, wenn du Domain hast

### "Muss ich noch was tun?"
→ Nein! Meta-Tags werden automatisch aktualisiert

### "Wo kaufe ich eine Domain?"
→ Siehe `/URL_ANPASSUNG.md` für Details

## 🚀 Deployment-Checklist

Wenn du die App veröffentlichst:

- [ ] Domain in `/config/app-config.ts` anpassen
- [ ] Kontaktdaten (E-Mail, Telefon) prüfen
- [ ] Schul-Informationen aktualisieren
- [ ] SSL-Zertifikat aktiviert (automatisch)
- [ ] App testen mit echter URL

---

**Das war's!** 🎊 Die Domain ist konfiguriert.

💡 **Tipp:** Browser-Tab zeigt bereits "Hortzettel" - unabhängig von der Domain!
