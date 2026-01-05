# 🏫 Multi-School Konzept - Hortzettel App für mehrere Schulen

## 📋 Inhaltsverzeichnis
1. [Übersicht](#übersicht)
2. [Ansätze im Vergleich](#ansätze-im-vergleich)
3. [Empfohlener Ansatz](#empfohlener-ansatz)
4. [Datenstruktur](#datenstruktur)
5. [Implementierungs-Roadmap](#implementierungs-roadmap)
6. [Technische Details](#technische-details)
7. [Sicherheit & Datenschutz](#sicherheit--datenschutz)

---

## 🎯 Übersicht

### Ziel
Die Hortzettel-App soll von **mehreren Schulen gleichzeitig** genutzt werden können, wobei jede Schule ihre eigenen:
- Daten (Hortzettel, Kinder, Eltern)
- Einstellungen (Farben, Texte, Logo)
- Admin/Hortner-Accounts
- Abholzeiten und Optionen

komplett **isoliert und getrennt** verwaltet.

### Anforderungen
- ✅ **Datenisolation**: Schule A sieht keine Daten von Schule B
- ✅ **Individuelles Branding**: Jede Schule hat eigene Farben/Logo
- ✅ **Einfache Bedienung**: Eltern merken nicht, dass es Multi-Tenant ist
- ✅ **Zentrale Verwaltung**: Ein Admin kann mehrere Schulen verwalten (optional)
- ✅ **Skalierbarkeit**: Hunderte Schulen möglich
- ✅ **Einfache Einrichtung**: Neue Schule in 5 Minuten einrichten

---

## 🔄 Ansätze im Vergleich

### Ansatz 1: Subdomain-Routing (⭐ EMPFOHLEN)
```
grundschule-auma.hortzettel.app
grundschule-leipzig.hortzettel.app
gymnasium-berlin.hortzettel.app
```

#### ✅ Vorteile:
- **Kristallklare Trennung** - Jede Schule hat ihre eigene URL
- **SEO-freundlich** - Gute für Suchmaschinen
- **Eigene PWA pro Schule** - Jede Schule ist eine eigenständige App
- **Einfaches Routing** - URL zeigt sofort die Schule
- **Professionell** - Wirkt seriös und etabliert
- **Einfache Weitergabe** - Eltern können Link teilen

#### ❌ Nachteile:
- Wildcard-DNS erforderlich (`*.hortzettel.app`)
- SSL-Zertifikat für Wildcard nötig

#### 💡 Beste Wahl für: SaaS-Produkt mit vielen Schulen


### Ansatz 2: Path-based Routing
```
hortzettel.app/grundschule-auma
hortzettel.app/grundschule-leipzig
hortzettel.app/gymnasium-berlin
```

#### ✅ Vorteile:
- Einfaches DNS-Setup (nur eine Domain)
- Kein Wildcard-SSL nötig
- Zentrale Landingpage möglich

#### ❌ Nachteile:
- Weniger professionell wirkend
- Komplexere PWA-Installation (mehrere Apps unter einer Domain)
- Längere URLs
- Routing-Logik komplizierter

#### 💡 Beste Wahl für: Kleinere Projekte mit wenigen Schulen


### Ansatz 3: Tenant-ID beim Login
```
hortzettel.app
→ Login mit "Schulcode" oder Auswahl
```

#### ✅ Vorteile:
- Eine einzige App für alle
- Sehr einfaches Deployment
- Keine DNS-Konfiguration

#### ❌ Nachteile:
- Schulcode merken/eingeben (Benutzerfehler)
- Keine eigene URL pro Schule
- Kein individuelles Branding vor Login
- Weniger professionell

#### 💡 Beste Wahl für: Internes Tool oder Pilotprojekt


### Ansatz 4: Separate App-Instanzen
Jede Schule erhält eine komplett separate Deployment:
```
auma.beispiel.de
leipzig-hort.de
```

#### ✅ Vorteile:
- Absolute Trennung (auch technisch)
- Jede Schule kann eigene Domain nutzen
- Maximale Flexibilität

#### ❌ Nachteile:
- **Wartungsaufwand extrem hoch** (Update = N×Deployments)
- Hohe Infrastrukturkosten
- Kein gemeinsames Code-Sharing
- Nicht skalierbar

#### 💡 Beste Wahl für: Große Schulen mit eigenem Budget/IT

---

## ⭐ Empfohlener Ansatz: Subdomain + Tenant-ID

### Hybrid-Lösung (Beste aus allen Welten!)

```
grundschule-auma.hortzettel.app     → Tenant: "auma"
grundschule-leipzig.hortzettel.app  → Tenant: "leipzig"
```

**Wie es funktioniert:**
1. User besucht `grundschule-auma.hortzettel.app`
2. App liest Subdomain aus (`auma`)
3. Lädt Branding/Einstellungen für diese Schule
4. Alle Daten werden mit `tenant_id = "auma"` gefiltert
5. User sieht nur Daten seiner Schule

**Fallback:** Wenn User direkt `hortzettel.app` besucht:
→ Schulauswahl-Seite mit Suche/Dropdown

---

## 🗄️ Datenstruktur

### Neue Tabelle: `schools` (Mandanten)

```typescript
interface School {
  id: string;                    // UUID
  tenant_id: string;             // "auma", "leipzig" (URL-freundlich)
  name: string;                  // "Grundschule Auma"
  full_name: string;             // "Grundschule Auma - Hortbetreuung"
  
  // Kontakt
  email: string;                 // kontakt@grundschule-auma.de
  phone: string;                 // +49 123 456789
  address: string;               // Straße, PLZ, Ort
  
  // Branding
  logo_url?: string;             // URL zum Logo
  primary_color: string;         // #3B82F6
  secondary_color: string;       // #8B5CF6
  theme: string;                 // "blue", "green", "purple", etc.
  
  // Konfiguration
  allowed_classes: string[];     // ["1a", "1b", "2a", "2b", ...]
  pickup_times: string[];        // ["14:00", "15:00", "16:00", ...]
  custom_pickup_options: string[]; // ["Geschwisterkind", "Taxi", ...]
  
  // Content Management (optional pro Schule)
  custom_texts?: {
    welcome_title?: string;
    welcome_message?: string;
    // ... andere Texte
  };
  
  // Features & Limits
  max_children: number;          // 100 (Limit für Trial)
  max_staff: number;             // 10
  features: string[];            // ["messaging", "templates", "analytics"]
  
  // Status
  status: "active" | "trial" | "suspended" | "inactive";
  trial_ends_at?: string;        // ISO date
  subscription_plan?: "free" | "basic" | "pro" | "enterprise";
  
  // Metadaten
  subdomain: string;             // "grundschule-auma"
  custom_domain?: string;        // Optional: eigene Domain
  created_at: string;
  updated_at: string;
}
```

### Erweiterte bestehende Tabellen

Alle bestehenden Tabellen erhalten ein `tenant_id` Feld:

```typescript
// kv_store_fb86b8a8 erweitern
interface KVStore {
  key: string;
  value: any;
  tenant_id: string;  // ← NEU!
  created_at: string;
  updated_at: string;
}

// Composite Index: (tenant_id, key) für Performance
```

**Betroffene Daten:**
- ✅ Hortzettel (`hortzettel_{childId}` → `{tenantId}:hortzettel_{childId}`)
- ✅ Profile (`profile_{userId}` → `{tenantId}:profile_{userId}`)
- ✅ Nachrichten (`messages_*` → `{tenantId}:messages_*`)
- ✅ Templates (`template_*` → `{tenantId}:template_*`)
- ✅ Texte (`texts` → `{tenantId}:texts`)
- ✅ Dropdowns (`dropdowns` → `{tenantId}:dropdowns`)

### Auth / User Management

**Option A: Shared Users (Empfohlen für Eltern)**
```typescript
// Supabase Auth User (global)
interface User {
  id: string;
  email?: string;  // optional
  // Supabase Standard-Felder
}

// User-School-Verknüpfung
interface UserSchool {
  user_id: string;      // Supabase Auth User ID
  tenant_id: string;    // Schule
  role: "parent" | "admin" | "staff";
  child_name?: string;  // Bei Eltern
  created_at: string;
}
```
➡️ **Vorteil:** Eltern können Kinder an mehreren Schulen haben

**Option B: Tenant-scoped Users**
```typescript
// User gehört immer zu einer Schule
interface User {
  id: string;
  tenant_id: string;    // ← Immer gesetzt
  first_name: string;
  last_name: string;
  role: string;
  // ...
}
```
➡️ **Vorteil:** Einfachere Logik, absolute Trennung

**Empfehlung:** Option A für maximale Flexibilität

---

## 🛣️ Implementierungs-Roadmap

### Phase 1: Foundation (Tag 1-2) 🏗️

**Ziel:** Grundlegende Multi-Tenant-Infrastruktur

#### Backend
- [ ] `schools` Tabelle in KV-Store erstellen
- [ ] Tenant-Context im Server erstellen
- [ ] Middleware für Tenant-Extraktion (aus Subdomain/Header)
- [ ] Alle KV-Store Queries mit `tenant_id` erweitern

#### Frontend
- [ ] Tenant-Detection Hook erstellen
- [ ] Theme-Provider für Schul-Branding erweitern
- [ ] Subdomain-Reader implementieren

#### Code-Beispiele:
```typescript
// utils/tenantContext.tsx
export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState<School | null>(null);
  
  useEffect(() => {
    // Subdomain auslesen
    const subdomain = window.location.hostname.split('.')[0];
    
    // Tenant laden
    loadSchoolBySubdomain(subdomain).then(setTenant);
  }, []);
  
  return (
    <TenantContext.Provider value={{ tenant, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook für Komponenten
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context.tenant) throw new Error('Schule nicht gefunden');
  return context.tenant;
};
```

```typescript
// supabase/functions/server/tenantMiddleware.tsx
export const extractTenant = (req: Request): string => {
  // 1. Aus Subdomain
  const host = req.headers.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // 2. Aus Custom Header (für Testing)
  const headerTenant = req.headers.get('x-tenant-id');
  
  return headerTenant || subdomain;
};

// In jeder Route verwenden:
app.get('/api/hortzettel', async (c) => {
  const tenantId = extractTenant(c.req);
  
  // Alle Queries filtern
  const keys = await kv.getByPrefix(`${tenantId}:hortzettel_`);
  // ...
});
```

---

### Phase 2: School Management (Tag 3-4) 🏫

**Ziel:** Schulen erstellen und verwalten

#### Features
- [ ] Super-Admin Dashboard
  - [ ] Liste aller Schulen
  - [ ] Neue Schule erstellen
  - [ ] Schule bearbeiten/löschen
  - [ ] Statistiken pro Schule
  
- [ ] School Setup Wizard
  - [ ] Schritt 1: Basis-Info (Name, Kontakt)
  - [ ] Schritt 2: Branding (Farben, Logo)
  - [ ] Schritt 3: Konfiguration (Klassen, Zeiten)
  - [ ] Schritt 4: Admin-Account erstellen
  
- [ ] School Settings Page (pro Schule)
  - [ ] Branding anpassen
  - [ ] Klassen/Zeiten verwalten
  - [ ] Features aktivieren/deaktivieren

#### UI-Komponenten:
```typescript
// components/SuperAdminDashboard.tsx
export function SuperAdminDashboard() {
  return (
    <div>
      <h1>Alle Schulen</h1>
      
      <Button onClick={createNewSchool}>
        + Neue Schule einrichten
      </Button>
      
      <Table>
        {schools.map(school => (
          <TableRow key={school.id}>
            <TableCell>{school.name}</TableCell>
            <TableCell>
              <Badge>{school.status}</Badge>
            </TableCell>
            <TableCell>
              <a href={`https://${school.subdomain}.hortzettel.app`}>
                {school.subdomain}.hortzettel.app
              </a>
            </TableCell>
            <TableCell>
              <Button onClick={() => editSchool(school)}>
                Bearbeiten
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
```

---

### Phase 3: Migration (Tag 5) 🔄

**Ziel:** Bestehende Daten zu "Grundschule Auma" migrieren

#### Migrations-Script
```typescript
// utils/migration/migrateTo MultiTenant.ts

export async function migrateToMultiTenant() {
  const DEFAULT_TENANT = 'grundschule-auma';
  
  // 1. Schule erstellen
  await createSchool({
    tenant_id: DEFAULT_TENANT,
    name: 'Grundschule Auma',
    subdomain: 'grundschule-auma',
    // ... aktuelle Einstellungen
  });
  
  // 2. Alle KV-Keys migrieren
  const allKeys = await kv.getByPrefix('');
  
  for (const item of allKeys) {
    const newKey = `${DEFAULT_TENANT}:${item.key}`;
    await kv.set(newKey, item.value);
    // Optional: alten Key löschen nach Bestätigung
  }
  
  console.log('Migration abgeschlossen! ✅');
}
```

**Vorsicht:** Backup vor Migration!

---

### Phase 4: Branding & Theming (Tag 6-7) 🎨

**Ziel:** Jede Schule hat ihre eigene Farbe/Logo

#### Dynamic Theming
```typescript
// utils/dynamicTheme.ts
export function applySchoolTheme(school: School) {
  const root = document.documentElement;
  
  // CSS Custom Properties setzen
  root.style.setProperty('--primary', school.primary_color);
  root.style.setProperty('--secondary', school.secondary_color);
  
  // Theme-Variante wählen
  document.body.setAttribute('data-theme', school.theme);
  
  // Manifest dynamisch aktualisieren (PWA)
  updateManifest({
    name: `Hortzettel - ${school.name}`,
    theme_color: school.primary_color,
  });
}
```

#### Logo-Integration
```typescript
// components/SchoolLogo.tsx
export function SchoolLogo() {
  const { tenant } = useTenant();
  
  if (tenant.logo_url) {
    return <img src={tenant.logo_url} alt={tenant.name} />;
  }
  
  // Fallback: Initialen
  return (
    <div className="logo-fallback">
      {tenant.name.split(' ').map(w => w[0]).join('')}
    </div>
  );
}
```

---

### Phase 5: School Selection (Tag 8) 🔍

**Ziel:** Landingpage für Schulauswahl

#### Landing Page (hortzettel.app)
```typescript
// components/SchoolSelector.tsx
export function SchoolSelector() {
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState('');
  
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="max-w-2xl mx-auto py-20">
      <h1>Hortzettel App</h1>
      <p>Wählen Sie Ihre Schule:</p>
      
      <Input 
        placeholder="Schule suchen..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      
      <div className="grid gap-4 mt-8">
        {filteredSchools.map(school => (
          <Card 
            key={school.id}
            onClick={() => redirectToSchool(school)}
            className="cursor-pointer hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                {school.logo_url && (
                  <img src={school.logo_url} className="w-12 h-12" />
                )}
                <div>
                  <h3>{school.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {school.address}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function redirectToSchool(school: School) {
  window.location.href = `https://${school.subdomain}.hortzettel.app`;
}
```

---

### Phase 6: Testing & Deployment (Tag 9-10) ✅

#### Testing-Checklist
- [ ] Erstelle 2-3 Test-Schulen
- [ ] Teste Datenisolation (Schule A sieht nichts von Schule B)
- [ ] Teste Branding (jede Schule hat eigene Farben)
- [ ] Teste PWA-Installation pro Subdomain
- [ ] Teste Admin-Zugriff nur auf eigene Schule
- [ ] Performance-Test mit 10+ Schulen
- [ ] Mobile Testing (iOS/Android)

#### Deployment
```bash
# 1. DNS: Wildcard-Record erstellen
*.hortzettel.app → CNAME → your-deployment.supabase.co

# 2. SSL: Wildcard-Zertifikat (Let's Encrypt)
certbot certonly --dns-provider -d "*.hortzettel.app"

# 3. Deployment mit Environment Variable
MULTI_TENANT_ENABLED=true
DEFAULT_TENANT=grundschule-auma

# 4. Migration ausführen
npm run migrate:multi-tenant
```

---

## 🔧 Technische Details

### URL-Struktur

```
# Schul-URLs (Subdomains)
https://grundschule-auma.hortzettel.app/
https://grundschule-auma.hortzettel.app/login
https://grundschule-auma.hortzettel.app/dashboard
https://grundschule-auma.hortzettel.app/admin

# Super-Admin (Hauptdomain)
https://hortzettel.app/super-admin
https://hortzettel.app/schools/new

# API (bleibt gleich, tenant_id im Header/Query)
https://xyz.supabase.co/functions/v1/make-server-fb86b8a8/hortzettel
  → Header: X-Tenant-ID: grundschule-auma
```

### Datenbankzugriff mit Tenant-Filtering

```typescript
// ❌ ALT (ohne Multi-Tenant)
const hortzettel = await kv.get('hortzettel_123');

// ✅ NEU (mit Multi-Tenant)
const tenantId = getTenantId();
const hortzettel = await kv.get(`${tenantId}:hortzettel_123`);

// Oder mit Helper:
const hortzettel = await kv.getTenanted(tenantId, 'hortzettel_123');
```

**Helper-Funktionen:**
```typescript
// supabase/functions/server/kv_store.tsx
export async function getTenanted(tenantId: string, key: string) {
  return get(`${tenantId}:${key}`);
}

export async function setTenanted(tenantId: string, key: string, value: any) {
  return set(`${tenantId}:${key}`, value);
}

export async function getByPrefixTenanted(tenantId: string, prefix: string) {
  return getByPrefix(`${tenantId}:${prefix}`);
}
```

### Performance-Optimierungen

```typescript
// 1. Tenant-Caching (im Memory)
const tenantCache = new Map<string, School>();

export async function getSchoolBySubdomain(subdomain: string): Promise<School> {
  if (tenantCache.has(subdomain)) {
    return tenantCache.get(subdomain)!;
  }
  
  const school = await kv.get(`school:${subdomain}`);
  tenantCache.set(subdomain, school);
  
  return school;
}

// 2. Batch-Loading
export async function getSchools(tenantIds: string[]): Promise<School[]> {
  const keys = tenantIds.map(id => `school:${id}`);
  return kv.mget(keys);
}

// 3. Index für schnelle Suche
await kv.set('school_index', {
  'auma': 'grundschule-auma',
  'leipzig': 'grundschule-leipzig',
  // ...
});
```

---

## 🔒 Sicherheit & Datenschutz

### Wichtigste Sicherheitsmaßnahmen

#### 1. Tenant-Isolation (absolut kritisch!)
```typescript
// Middleware: Jede Request MUSS tenant_id validieren
app.use('*', async (c, next) => {
  const tenantId = extractTenant(c.req);
  
  // User darf nur auf seine Schule zugreifen
  const userTenant = await getUserTenant(c.req.user);
  
  if (tenantId !== userTenant) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  c.set('tenantId', tenantId);
  await next();
});
```

#### 2. Row Level Security (RLS)
Wenn PostgreSQL verwendet wird:
```sql
-- Alle Tabellen bekommen RLS
ALTER TABLE hortzettel ENABLE ROW LEVEL SECURITY;

-- Policy: User sieht nur Daten seiner Schule
CREATE POLICY tenant_isolation ON hortzettel
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));
```

#### 3. DSGVO-Compliance
```typescript
// Schule kann alle ihre Daten exportieren
export async function exportSchoolData(tenantId: string) {
  const allKeys = await kv.getByPrefix(`${tenantId}:`);
  return {
    school: await getSchool(tenantId),
    data: allKeys,
    exported_at: new Date().toISOString(),
  };
}

// Schule kann alle ihre Daten löschen
export async function deleteSchoolData(tenantId: string) {
  const allKeys = await kv.getByPrefix(`${tenantId}:`);
  
  for (const key of allKeys) {
    await kv.del(key);
  }
  
  await kv.del(`school:${tenantId}`);
}
```

#### 4. Rate Limiting (pro Tenant)
```typescript
const rateLimits = new Map<string, number>();

app.use('*', async (c, next) => {
  const tenantId = c.get('tenantId');
  const count = rateLimits.get(tenantId) || 0;
  
  if (count > 1000) { // 1000 requests/hour
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  rateLimits.set(tenantId, count + 1);
  await next();
});
```

---

## 💰 Geschäftsmodell-Optionen

### Free Trial
```typescript
interface School {
  status: "trial";
  trial_ends_at: "2025-12-31";
  max_children: 20;  // Limit während Trial
}

// In der App prüfen
if (school.status === 'trial' && isPast(school.trial_ends_at)) {
  showUpgradePrompt();
}
```

### Pricing Tiers
```typescript
const PLANS = {
  free: {
    max_children: 50,
    max_staff: 3,
    features: ['basic'],
    price: 0,
  },
  basic: {
    max_children: 150,
    max_staff: 10,
    features: ['basic', 'messaging'],
    price: 29, // €/Monat
  },
  pro: {
    max_children: 500,
    max_staff: 50,
    features: ['basic', 'messaging', 'analytics', 'templates'],
    price: 99,
  },
  enterprise: {
    max_children: -1, // unlimited
    max_staff: -1,
    features: ['all'],
    price: 299,
  },
};
```

### Feature-Flags
```typescript
export function hasFeature(school: School, feature: string): boolean {
  return school.features.includes(feature);
}

// In Komponenten
if (hasFeature(tenant, 'messaging')) {
  return <MessagingView />;
}
```

---

## 📊 Analytics & Monitoring

### Pro Schule tracken:
- Anzahl Kinder/Eltern
- Anzahl Hortzettel (pro Woche/Monat)
- Login-Aktivität
- Feature-Nutzung
- Fehlerrate

```typescript
// components/SuperAdminDashboard.tsx
export function SchoolStatistics({ tenantId }: { tenantId: string }) {
  const stats = useSchoolStats(tenantId);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader>Registrierte Eltern</CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total_parents}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Kinder</CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total_children}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Hortzettel (diese Woche)</CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.hortzettel_this_week}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Letzte Aktivität</CardHeader>
        <CardContent>
          <div>{formatDistanceToNow(stats.last_activity_at)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎯 Zusammenfassung

### Start HEUTE:
1. **Phase 1 implementieren** (Tenant-Context + Middleware)
2. **Test-Schule "Leipzig"** erstellen
3. **Daten-Trennung testen**

### Diese Woche:
- Super-Admin Dashboard
- School Setup Wizard
- Migration durchführen

### Nächste Woche:
- Branding/Theming
- School Selection Page
- Go Live mit 2-3 Schulen

### Aufwand:
- **Entwicklung:** 10-15 Arbeitstage (bei gutem Code)
- **Testing:** 3-5 Arbeitstage
- **Deployment:** 1 Arbeitstag

### Kosten:
- **DNS:** Kostenlos (bei Domain-Provider)
- **SSL:** Kostenlos (Let's Encrypt Wildcard)
- **Hosting:** Keine Mehrkosten bei Supabase
- **Entwicklung:** Hauptaufwand

---

## 🚀 Quick Start (Sofort loslegen)

```bash
# 1. Tenant-Utils erstellen
mkdir -p utils/tenant
touch utils/tenant/context.tsx
touch utils/tenant/middleware.tsx

# 2. School Type definieren
# types/school.ts erstellen

# 3. Backend anpassen
# supabase/functions/server/index.tsx erweitern

# 4. Frontend Hook erstellen
# utils/tenant/useTenant.tsx

# 5. Testing
# Lokale Subdomain simulieren: http://auma.localhost:3000
```

**Benötigen Sie sofort Code-Beispiele für einen bestimmten Teil?** Sagen Sie Bescheid! 🚀
