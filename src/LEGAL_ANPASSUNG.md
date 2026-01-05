# 📝 Anpassung der rechtlichen Dokumente

## ⚠️ WICHTIG: Platzhalter ersetzen!

Die Datenschutzerklärung und Nutzungsbedingungen enthalten **Platzhalter**, die Sie anpassen müssen:

---

## 🔧 Was muss angepasst werden?

### 1. DATENSCHUTZ.md

Suchen und ersetzen Sie folgende Platzhalter:

#### Adressdaten der Schule:
```
[Straße und Hausnummer]     → z.B. "Schulstraße 12"
[PLZ]                       → z.B. "07955"
[Telefonnummer]             → z.B. "036626 12345"
[E-Mail-Adresse]            → z.B. "kontakt@grundschule-auma.de"
[Website]                   → z.B. "www.grundschule-auma.de"
```

#### Datenschutzbeauftragter:
```
[Name]                      → Name des Datenschutzbeauftragten
[E-Mail-Adresse]            → datenschutz@grundschule-auma.de
```

#### Kontakt-E-Mails:
```
datenschutz@grundschule-auma.de  → Ihre echte E-Mail
kontakt@grundschule-auma.de      → Ihre echte E-Mail
```

---

### 2. NUTZUNGSBEDINGUNGEN.md

Ersetzen Sie:

```
[kontakt@grundschule-auma.de]    → Ihre Kontakt-E-Mail
[Adresse]                        → Vollständige Postadresse
[Telefonnummer]                  → Ihre Telefonnummer
[support@grundschule-auma.de]    → Support-E-Mail
[leitung@grundschule-auma.de]    → E-Mail der Schulleitung
```

---

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: Informationen sammeln
Sammeln Sie folgende Informationen:

✅ **Schuladresse:**
- Straße und Hausnummer
- PLZ und Ort
- Telefon
- E-Mail
- Website

✅ **Datenschutzbeauftragter:**
- Name
- E-Mail-Adresse
- (Falls Sie keinen haben: Externe Beratung einholen!)

✅ **Kontaktpersonen:**
- Schulleitung (Name, E-Mail, Telefon)
- Hortleitung (Name, Telefon, Sprechzeiten)
- Technischer Support (E-Mail, Telefon)

---

### Schritt 2: Dokumente anpassen

1. **Öffnen Sie DATENSCHUTZ.md**
2. **Nutzen Sie "Suchen & Ersetzen" (Strg+H)**
3. **Ersetzen Sie alle Platzhalter** (siehe oben)
4. **Speichern Sie die Datei**

5. **Öffnen Sie NUTZUNGSBEDINGUNGEN.md**
6. **Wiederholen Sie den Prozess**

---

### Schritt 3: Prüfen

Durchsuchen Sie beide Dokumente nach:
- `[` und `]` → Sollten nicht mehr vorkommen!
- E-Mail-Adressen → Sollten alle korrekt sein
- Telefonnummern → Sollten vollständig sein

---

## ⚖️ Rechtliche Prüfung

### Wichtig: Lassen Sie die Dokumente prüfen!

Die bereitgestellten Vorlagen sind **Muster** und sollten von einem Rechtsanwalt oder Datenschutzexperten geprüft werden:

**Warum?**
- DSGVO-Anforderungen können sich ändern
- Ihre Schule hat möglicherweise spezielle Anforderungen
- Fehler können zu Bußgeldern führen

**Empfohlene Prüfung durch:**
- ✅ Datenschutzbeauftragten der Schule/des Schulträgers
- ✅ Rechtsanwalt mit Schwerpunkt Datenschutz
- ✅ Externe Datenschutzberatung

**Kosten:**
- Externe Prüfung: ca. 300-800 €
- Datenschutzbeauftragter (extern): ca. 80-150 €/Monat

---

## 📱 Integration in die App

Die Dokumente sind bereits integriert:

### Wo finden Nutzer die Dokumente?

1. **Login-Seite:**
   - Links am unteren Rand: "Datenschutz" | "Nutzungsbedingungen"

2. **In der App:**
   - Über den Footer auf jeder Seite
   - Profil → Einstellungen → Rechtliches

3. **Als Markdown:**
   - `/DATENSCHUTZ.md`
   - `/NUTZUNGSBEDINGUNGEN.md`

### Komponenten:

- **`LegalPages.tsx`**: Interaktive Anzeige in der App
- **`LegalFooter.tsx`**: Footer mit Links
- **`LegalStandalone.tsx`**: Standalone-Seite

---

## 🔄 Aktualisierung

### Wann sollten die Dokumente aktualisiert werden?

- ✅ Bei Änderung der App-Funktionen
- ✅ Bei Änderung der Datenverarbeitung
- ✅ Bei Gesetzesänderungen (DSGVO, etc.)
- ✅ Mindestens 1x jährlich überprüfen

### Wie aktualisieren?

1. **Dokumente bearbeiten** (DATENSCHUTZ.md, NUTZUNGSBEDINGUNGEN.md)
2. **Datum aktualisieren** (Stand: XX.XX.XXXX)
3. **Versionsnummer erhöhen** (in Nutzungsbedingungen)
4. **Nutzer informieren** (bei wesentlichen Änderungen per E-Mail/In-App-Nachricht)

---

## ✅ Checkliste vor Go-Live

Vor dem Start der App:

- [ ] Alle Platzhalter ersetzt
- [ ] Adressen und Kontaktdaten korrekt
- [ ] E-Mail-Adressen funktionieren
- [ ] Telefonnummern sind erreichbar
- [ ] Datenschutzbeauftragter ist eingetragen
- [ ] Dokumente von Rechtsexperten geprüft ⚠️
- [ ] Links in der App funktionieren
- [ ] Dokumente sind für Nutzer sichtbar
- [ ] Akzeptanz-Checkbox bei Registrierung (optional)

---

## 📞 Unterstützung

### Kostenlose Ressourcen:

**Datenschutzbeauftragte:**
- Thüringer Landesbeauftragter für Datenschutz
- Website: https://www.tlfdi.de
- E-Mail: poststelle@datenschutz.thueringen.de
- Telefon: 0361 57 3112900

**DSGVO-Infos:**
- Bundesamt für Sicherheit in der Informationstechnik (BSI)
- Bundesdatenschutzbeauftragter
- IHK (bietet oft kostenlose Erstberatung)

### Muster-Dokumente:

- https://www.datenschutz-generator.de (kostenpflichtig, aber geprüft)
- IHK Muster-Datenschutzerklärungen
- Aktivierung DSB (kostenlose Vorlagen)

---

## 🎯 Kurzversion für Schulleitung

**Sehr geehrte Schulleitung,**

die Hortzettel-App enthält bereits DSGVO-konforme Vorlagen für:
- Datenschutzerklärung
- Nutzungsbedingungen

**Was Sie tun müssen:**

1. ✏️ Platzhalter ersetzen (10-15 Minuten)
   - Schuladresse, Kontaktdaten eintragen
   - Datenschutzbeauftragten eintragen

2. ⚖️ Rechtliche Prüfung (empfohlen!)
   - Durch Datenschutzbeauftragten
   - Oder externe Rechtsberatung

3. ✅ Freigabe erteilen
   - Dokumente sind dann verbindlich
   - Werden in der App angezeigt

**Kosten:** 
- Selbst machen: 0 € (+ Zeitaufwand)
- Externe Prüfung: ca. 300-800 € (einmalig)

**Risiko bei Nichtbeachtung:**
- Bußgelder bis zu 20 Mio. € (DSGVO)
- Abmahnungen
- Nutzungsstopp der App

**Unsere Empfehlung:**
→ Mindestens durch Datenschutzbeauftragten prüfen lassen!

---

Bei Fragen: Gerne jederzeit melden! 🚀
