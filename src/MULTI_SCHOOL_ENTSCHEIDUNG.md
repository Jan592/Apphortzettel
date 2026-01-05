# 🎯 Multi-School: Welcher Ansatz ist der Richtige für Sie?

## ❓ Bevor Sie starten: 5 Fragen

### 1️⃣ Wie viele Schulen planen Sie?
- **1-5 Schulen:** Path-based oder Tenant-ID reicht
- **5-20 Schulen:** Subdomain empfohlen
- **20+ Schulen:** Subdomain + SaaS-Plattform notwendig

### 2️⃣ Wer zahlt für die App?
- **Jede Schule einzeln:** Separate Instanzen ODER Subdomain
- **Sie betreiben zentral:** Subdomain + Abo-Modell
- **Kostenlos für alle:** Einfachster Ansatz (Tenant-ID)

### 3️⃣ Wie wichtig ist Branding?
- **Sehr wichtig (eigenes Logo/Farben):** Subdomain-Ansatz
- **Einheitliches Design OK:** Tenant-ID-Ansatz
- **Egal:** Beliebiger Ansatz

### 4️⃣ Technische Fähigkeiten?
- **Profi-Entwickler:** Alle Ansätze möglich
- **Fortgeschrittener:** Subdomain oder Path-based
- **Anfänger:** Tenant-ID beim Login (einfachste)

### 5️⃣ Budget & Zeit?
- **Schnell & günstig:** Tenant-ID (2-3 Tage)
- **Professionell mittelfristig:** Subdomain (7-10 Tage)
- **Enterprise-Level:** Separate Instanzen (20+ Tage)

---

## 📊 Entscheidungsmatrix

| Kriterium | Subdomain | Path-based | Tenant-ID | Separate Apps |
|-----------|-----------|------------|-----------|---------------|
| **Professionalität** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Einfachheit (Setup)** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **Skalierbarkeit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Wartung** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **Kosten** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Branding-Optionen** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Datentrennung** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **PWA-Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 💡 Meine Empfehlung basierend auf Ihrer Situation

### Szenario A: Sie testen erstmal (2-3 Schulen)
**→ Tenant-ID beim Login** ✅

**Warum:**
- Schnellste Implementierung (2-3 Tage)
- Keine DNS-Konfiguration nötig
- Kann später auf Subdomain erweitert werden
- Perfekt für MVP/Beta

**Wie:**
```typescript
// Login mit Schulcode
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Schule wählen..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="auma">Grundschule Auma</SelectItem>
    <SelectItem value="leipzig">Grundschule Leipzig</SelectItem>
  </SelectContent>
</Select>
```

**Nächster Schritt:** → Subdomain später nachrüsten

---

### Szenario B: Sie bauen ein SaaS-Produkt (5-50 Schulen)
**→ Subdomain-Routing** ⭐ BESTE WAHL

**Warum:**
- Professionell & skalierbar
- Jede Schule hat eigene URL
- Perfekt für Marketing
- PWA pro Schule möglich
- Einfache Weitergabe des Links

**Aufwand:**
- Setup: 7-10 Tage
- DNS: Wildcard (5 Minuten)
- SSL: Let's Encrypt (kostenlos)

**ROI:** Sehr gut bei 10+ Schulen

---

### Szenario C: Schulträger mit vielen Schulen (50-200)
**→ Subdomain + Enterprise-Features** ⭐⭐⭐⭐⭐

**Zusätzlich brauchen Sie:**
- Zentrale Verwaltung (Super-Admin)
- Automatisiertes Onboarding
- Reporting über alle Schulen
- SLA & Support

**Team:** Mindestens 2 Entwickler

---

### Szenario D: Große Schule mit eigener IT
**→ Separate App-Instanz** 

**Warum:**
- Volle Kontrolle
- Eigene Domain möglich
- Customization unbegrenzt
- Datenschutz-Garantie

**Aber:** Nur wenn Budget & IT-Team vorhanden

---

## 🚀 Start-Empfehlung: Hybrid-Ansatz

### Phase 1: Quick Win (Woche 1-2)
**Tenant-ID beim Login implementieren**

```typescript
// Einfacher Start
const SCHOOLS = {
  'auma': { name: 'Grundschule Auma', theme: 'blue' },
  'leipzig': { name: 'Grundschule Leipzig', theme: 'green' },
};

// Im Login
const [selectedSchool, setSelectedSchool] = useState('auma');
```

**Vorteil:** Sofort funktionsfähig, keine Infrastruktur-Änderungen

---

### Phase 2: Scale-Up (Woche 3-4)
**Subdomain-Routing nachrüsten**

```typescript
// Subdomain auslesen
const subdomain = window.location.hostname.split('.')[0];

// Fallback auf gespeicherte Auswahl
const tenantId = subdomain === 'localhost' 
  ? localStorage.getItem('tenant') 
  : subdomain;
```

**Vorteil:** Beides funktioniert parallel

---

### Phase 3: Polish (Woche 5+)
- Branding-Customization
- School Selection Landingpage
- Super-Admin Dashboard
- Analytics

---

## 📝 Minimale Implementierung (HEUTE starten)

### Schritt 1: Type definieren (5 Min)
```typescript
// types/school.ts
export interface School {
  id: string;
  name: string;
  theme: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'yellow';
}

export const SCHOOLS: Record<string, School> = {
  'auma': {
    id: 'auma',
    name: 'Grundschule Auma',
    theme: 'blue',
  },
  'leipzig': {
    id: 'leipzig',
    name: 'Grundschule Leipzig',
    theme: 'green',
  },
};
```

### Schritt 2: Context erstellen (10 Min)
```typescript
// utils/tenantContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext<{
  tenantId: string;
  school: School | null;
  setTenantId: (id: string) => void;
} | null>(null);

export function TenantProvider({ children }) {
  const [tenantId, setTenantId] = useState(
    localStorage.getItem('tenant_id') || 'auma'
  );
  
  const school = SCHOOLS[tenantId] || null;
  
  useEffect(() => {
    localStorage.setItem('tenant_id', tenantId);
  }, [tenantId]);
  
  return (
    <TenantContext.Provider value={{ tenantId, school, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
```

### Schritt 3: In App einbinden (5 Min)
```typescript
// App.tsx
import { TenantProvider } from './utils/tenantContext';

export default function App() {
  return (
    <TenantProvider>
      {/* Existing App Content */}
    </TenantProvider>
  );
}
```

### Schritt 4: School Selector (15 Min)
```typescript
// components/SchoolSelector.tsx
import { useTenant } from '../utils/tenantContext';
import { SCHOOLS } from '../types/school';

export function SchoolSelector() {
  const { tenantId, setTenantId } = useTenant();
  
  if (tenantId) return null; // Already selected
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Schule wählen</h2>
        <div className="space-y-2">
          {Object.values(SCHOOLS).map(school => (
            <Button
              key={school.id}
              onClick={() => setTenantId(school.id)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-4"
            >
              <div>
                <div className="font-semibold">{school.name}</div>
                <div className="text-sm text-muted-foreground">
                  Theme: {school.theme}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### Schritt 5: API-Calls anpassen (30 Min)
```typescript
// utils/api.ts
import { useTenant } from './tenantContext';

// VORHER:
await fetch('/api/hortzettel');

// NACHHER:
const { tenantId } = useTenant();
await fetch('/api/hortzettel', {
  headers: {
    'X-Tenant-ID': tenantId,
  },
});

// Oder als Prefix im Key:
const key = `${tenantId}:hortzettel_${childId}`;
```

### Schritt 6: Backend anpassen (20 Min)
```typescript
// supabase/functions/server/index.tsx
app.use('*', async (c, next) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'auma';
  c.set('tenantId', tenantId);
  await next();
});

app.get('/api/hortzettel', async (c) => {
  const tenantId = c.get('tenantId');
  
  // Filtern mit Prefix
  const keys = await kv.getByPrefix(`${tenantId}:hortzettel_`);
  
  return c.json(keys);
});
```

---

## ⏱️ Zeitplan für Quick Implementation

### Tag 1 (4 Stunden)
- ✅ Types & Context erstellen
- ✅ School Selector UI
- ✅ Theme-Switching testen

### Tag 2 (6 Stunden)
- ✅ Backend Middleware
- ✅ Alle API-Calls anpassen
- ✅ Testing mit 2 Schulen

### Tag 3 (4 Stunden)
- ✅ Daten migrieren
- ✅ Admin-Bereich anpassen
- ✅ Deployment

**Total: 14 Stunden** = 2 Arbeitstage ✅

---

## 🎯 Was ich JETZT machen würde

Wenn ich die App hätte, würde ich:

1. **Heute Nachmittag (2h):**
   - Tenant-Context implementieren
   - School-Selector bauen
   - 2 Test-Schulen anlegen

2. **Morgen (4h):**
   - Backend mit Tenant-ID erweitern
   - Alle API-Calls anpassen
   - Testing

3. **Übermorgen (2h):**
   - Leipzig als zweite Schule einrichten
   - Mit echten Usern testen
   - Feedback sammeln

4. **Nächste Woche:**
   - Subdomain-Routing (wenn erfolgreich)
   - Branding-Optionen
   - 5 weitere Schulen onboarden

---

## ❓ Noch Fragen?

**Soll ich mit der Implementierung beginnen?**

Sagen Sie mir:
1. Welchen Ansatz Sie bevorzugen (Tenant-ID / Subdomain)
2. Wie viele Schulen Sie planen
3. Ob Sie sofort starten wollen

Dann erstelle ich die konkreten Code-Dateien! 🚀
