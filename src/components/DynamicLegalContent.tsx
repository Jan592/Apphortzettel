import { Mail, Phone, Globe } from 'lucide-react';
import type { LegalSettings } from '../types/legal';

interface DynamicLegalContentProps {
  settings: LegalSettings;
}

export function DynamicPrivacyPolicy({ settings }: DynamicLegalContentProps) {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
      <h1 className="text-xl md:text-3xl">Datenschutzerklärung</h1>
      
      <p className="text-xs md:text-sm text-muted-foreground">
        Version {settings.version} • Letzte Aktualisierung: {settings.lastUpdated}
      </p>

      <h2>1. Verantwortlicher</h2>
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg not-prose">
        <p className="font-semibold mb-2">{settings.schoolName}</p>
        <p>{settings.schoolStreet}</p>
        <p>{settings.schoolZip} {settings.schoolCity}</p>
        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{settings.schoolPhone}</span>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.schoolEmail}`} className="text-blue-600 hover:underline">
              {settings.schoolEmail}
            </a>
          </p>
          {settings.schoolWebsite && (
            <p className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <a href={settings.schoolWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {settings.schoolWebsite}
              </a>
            </p>
          )}
        </div>
      </div>

      <h2>2. Datenschutzbeauftragter</h2>
      <p>
        Bei Fragen zum Datenschutz können Sie sich jederzeit an unseren Datenschutzbeauftragten wenden:
      </p>
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg not-prose">
        <p className="font-semibold">{settings.dsbName}</p>
        <div className="mt-2 space-y-1">
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.dsbEmail}`} className="text-blue-600 hover:underline">
              {settings.dsbEmail}
            </a>
          </p>
          {settings.dsbPhone && (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{settings.dsbPhone}</span>
            </p>
          )}
        </div>
      </div>

      <h2>3. Erhobene Daten</h2>
      
      <h3>3.1 Registrierungsdaten</h3>
      <p>Bei der Registrierung erheben wir folgende Daten:</p>
      <ul>
        <li><strong>Name des Kindes:</strong> Vorname und Nachname</li>
        <li><strong>Klasse:</strong> Zur Zuordnung im Hort</li>
        <li><strong>Login-Daten:</strong> Vor- und Nachname der Eltern (als Login-Name) und Passwort</li>
      </ul>

      <h3>3.2 Profildaten (optional)</h3>
      <p>Sie können freiwillig zusätzliche Informationen hinterlegen:</p>
      <ul>
        <li>Geburtsdatum des Kindes</li>
        <li>Telefonnummer der Eltern</li>
        <li>Allergien und medizinische Hinweise</li>
        <li>Abholberechtigte Personen</li>
        <li>Notfallkontakt</li>
      </ul>

      <h3>3.3 Hortzettel-Daten</h3>
      <p>Bei der Erstellung eines Hortzettels werden folgende Daten gespeichert:</p>
      <ul>
        <li>Kalenderwoche und Jahr</li>
        <li>Abholzeiten für jeden Wochentag (Montag-Freitag)</li>
        <li>Angabe, ob das Kind alleine nach Hause gehen darf</li>
        <li>Datum und Uhrzeit der Erstellung/Aktualisierung</li>
      </ul>

      <h3>3.4 Technische Daten</h3>
      <p>
        Die App läuft auf Ihrem Gerät als Progressive Web App (PWA). Es werden keine IP-Adressen, 
        Cookies oder Tracking-Daten erhoben.
      </p>

      <h2>4. Zweck der Datenverarbeitung</h2>
      <p>Wir verarbeiten Ihre Daten ausschließlich für folgende Zwecke:</p>
      <ul>
        <li>
          <strong>Hortbetreuung:</strong> Organisation der Abholung und Betreuung der Kinder im Hort
        </li>
        <li>
          <strong>Kommunikation:</strong> Kontaktaufnahme bei Rückfragen oder im Notfall
        </li>
        <li>
          <strong>Sicherheit:</strong> Gewährleistung, dass Kinder nur an berechtigte Personen übergeben werden
        </li>
      </ul>

      <h2>5. Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung Ihrer Daten erfolgt auf Grundlage von <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> 
        (Vertragserfüllung) sowie <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse 
        an der ordnungsgemäßen Organisation der Hortbetreuung).
      </p>
      <p>
        Für besondere Kategorien personenbezogener Daten (z.B. Gesundheitsdaten wie Allergien) 
        holen wir Ihre <strong>ausdrückliche Einwilligung</strong> gemäß Art. 9 Abs. 2 lit. a DSGVO ein.
      </p>

      <h2>6. Datenspeicherung und -löschung</h2>
      
      <h3>6.1 Speicherort</h3>
      <p>
        Ihre Daten werden verschlüsselt in einer Supabase-Datenbank gespeichert, die in der EU gehostet wird 
        und den DSGVO-Anforderungen entspricht.
      </p>

      <h3>6.2 Speicherdauer</h3>
      <ul>
        <li><strong>Aktuelle Hortzettel:</strong> Werden nach Ablauf der Woche archiviert</li>
        <li><strong>Archivierte Hortzettel:</strong> Werden nach 3 Monaten automatisch gelöscht</li>
        <li><strong>Profildaten:</strong> Werden gespeichert, solange Ihr Account besteht</li>
      </ul>

      <h3>6.3 Löschung</h3>
      <p>
        Sie können Ihr Konto und alle damit verbundenen Daten jederzeit löschen:
      </p>
      <ul>
        <li>In der App: Profil → Einstellungen → "Konto löschen"</li>
        <li>Per E-Mail an: {settings.supportEmail}</li>
      </ul>

      <h2>7. Weitergabe von Daten</h2>
      <p>Ihre Daten werden ausschließlich weitergegeben an:</p>
      <ul>
        <li>
          <strong>Hortner/innen:</strong> Zugriff auf Hortzettel und Profildaten zur Organisation der Betreuung
        </li>
        <li>
          <strong>Administratoren:</strong> Technische Verwaltung der App
        </li>
      </ul>
      <p>
        <strong>Keine Weitergabe an Dritte!</strong> Ihre Daten werden nicht an externe Unternehmen 
        oder Werbepartner weitergegeben.
      </p>

      <h2>8. Datensicherheit</h2>
      <p>Wir schützen Ihre Daten durch:</p>
      <ul>
        <li><strong>Verschlüsselung:</strong> Alle Daten werden verschlüsselt übertragen (HTTPS/SSL)</li>
        <li><strong>Passwortschutz:</strong> Passwörter werden gehasht und niemals im Klartext gespeichert</li>
        <li><strong>Zugriffskontrollen:</strong> Nur autorisierte Personen haben Zugriff auf die Daten</li>
        <li><strong>EU-Server:</strong> Alle Daten werden ausschließlich auf Servern in der EU gespeichert</li>
      </ul>

      <h2>9. Ihre Rechte</h2>
      <p>Gemäß DSGVO haben Sie folgende Rechte:</p>
      
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500 not-prose">
        <h4 className="font-semibold mb-2">Ihre Datenschutzrechte:</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Auskunft (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen
          </li>
          <li>
            <strong>Berichtigung (Art. 16 DSGVO):</strong> Sie können fehlerhafte Daten korrigieren lassen
          </li>
          <li>
            <strong>Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen
          </li>
          <li>
            <strong>Einschränkung (Art. 18 DSGVO):</strong> Sie können die Verarbeitung einschränken lassen
          </li>
          <li>
            <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem strukturierten Format erhalten
          </li>
          <li>
            <strong>Widerspruch (Art. 21 DSGVO):</strong> Sie können der Verarbeitung widersprechen
          </li>
          <li>
            <strong>Beschwerde (Art. 77 DSGVO):</strong> Sie können sich bei der Datenschutzbehörde beschweren
          </li>
        </ul>
      </div>

      <h3>9.1 Ausübung Ihrer Rechte</h3>
      <p>
        Um Ihre Rechte auszuüben, kontaktieren Sie bitte:
      </p>
      <ul>
        <li>
          <strong>Datenschutzbeauftragter:</strong>{' '}
          <a href={`mailto:${settings.dsbEmail}`} className="text-blue-600 hover:underline">
            {settings.dsbEmail}
          </a>
        </li>
        <li>
          <strong>Schulleitung:</strong>{' '}
          {settings.principalName} ({' '}
          <a href={`mailto:${settings.principalEmail}`} className="text-blue-600 hover:underline">
            {settings.principalEmail}
          </a>
          )
        </li>
      </ul>

      <h2>10. Besonderer Schutz von Kinderdaten</h2>
      <p>
        Wir sind uns der besonderen Verantwortung beim Umgang mit Daten von Kindern bewusst. 
        Daher gelten folgende zusätzliche Schutzmaßnahmen:
      </p>
      <ul>
        <li>Nur Eltern/Erziehungsberechtigte können Accounts erstellen</li>
        <li>Kinder haben keinen direkten Zugriff auf die App</li>
        <li>Sensible Daten (Gesundheit, Allergien) sind besonders geschützt</li>
        <li>Keine Profilbilder oder öffentlich sichtbare Informationen</li>
      </ul>

      <h2>11. Änderungen der Datenschutzerklärung</h2>
      <p>
        Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslage 
        oder bei Änderungen der App anzupassen. Bei wesentlichen Änderungen werden Sie aktiv informiert.
      </p>

      <h2>12. Kontakt</h2>
      <p>Bei Fragen zum Datenschutz wenden Sie sich bitte an:</p>
      
      <div className="grid md:grid-cols-2 gap-4 not-prose">
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Datenschutzbeauftragter</h4>
          <p>{settings.dsbName}</p>
          <p className="flex items-center gap-2 mt-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.dsbEmail}`} className="text-blue-600 hover:underline">
              {settings.dsbEmail}
            </a>
          </p>
          {settings.dsbPhone && (
            <p className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" />
              <span>{settings.dsbPhone}</span>
            </p>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Schulleitung</h4>
          <p>{settings.principalName}</p>
          <p className="flex items-center gap-2 mt-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.principalEmail}`} className="text-blue-600 hover:underline">
              {settings.principalEmail}
            </a>
          </p>
          {settings.principalPhone && (
            <p className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" />
              <span>{settings.principalPhone}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-l-4 border-green-500 mt-6 not-prose">
        <p className="text-sm">
          <strong>✓ DSGVO-konform:</strong> Diese Datenschutzerklärung wurde nach bestem Wissen 
          und Gewissen erstellt. Wir empfehlen dennoch eine rechtliche Prüfung durch einen 
          Fachanwalt für Datenschutzrecht.
        </p>
      </div>
    </div>
  );
}

export function DynamicTermsOfService({ settings }: DynamicLegalContentProps) {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
      <h1 className="text-xl md:text-3xl">Nutzungsbedingungen (AGB)</h1>
      
      <p className="text-xs md:text-sm text-muted-foreground">
        Version {settings.version} • Letzte Aktualisierung: {settings.lastUpdated}
      </p>

      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Nutzungsbedingungen regeln die Nutzung der Hortzettel-App der {settings.schoolName}. 
        Mit der Registrierung akzeptieren Sie diese Bedingungen.
      </p>

      <h2>2. Vertragspartner</h2>
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg not-prose">
        <p className="font-semibold">{settings.schoolName}</p>
        <p>{settings.schoolStreet}</p>
        <p>{settings.schoolZip} {settings.schoolCity}</p>
        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{settings.schoolPhone}</span>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.schoolEmail}`} className="text-blue-600 hover:underline">
              {settings.schoolEmail}
            </a>
          </p>
        </div>
      </div>

      <h2>3. Leistungsbeschreibung</h2>
      
      <h3>3.1 Zweck der App</h3>
      <p>
        Die Hortzettel-App dient der digitalen Verwaltung von Hortbetreuungszeiten. 
        Eltern können damit angeben, wann ihr Kind aus dem Hort abgeholt wird oder 
        alleine nach Hause gehen darf.
      </p>

      <h3>3.2 Funktionsumfang</h3>
      <ul>
        <li>Erstellung wöchentlicher Hortzettel</li>
        <li>Verwaltung von Abholzeiten (Montag-Freitag)</li>
        <li>Angabe zur selbstständigen Heimkehr</li>
        <li>Verwaltung von Profildaten (optional)</li>
        <li>Nachrichten-System für Kommunikation mit Hortnern</li>
        <li>Vorlagen-Funktion für wiederkehrende Abholzeiten</li>
      </ul>

      <h2>4. Registrierung und Nutzerkonto</h2>
      
      <h3>4.1 Berechtigung</h3>
      <p>
        Ein Nutzerkonto darf nur von Eltern oder Erziehungsberechtigten erstellt werden, 
        deren Kind die {settings.schoolName} besucht und im Hort angemeldet ist.
      </p>

      <h3>4.2 Login-Daten</h3>
      <ul>
        <li><strong>Benutzername:</strong> Vor- und Nachname (z.B. "Max Mustermann")</li>
        <li><strong>Passwort:</strong> Mindestens 6 Zeichen</li>
      </ul>

      <h3>4.3 Verantwortung</h3>
      <p>
        Sie sind verpflichtet, Ihre Zugangsdaten vertraulich zu behandeln und vor 
        unbefugtem Zugriff zu schützen. Bei Verdacht auf Missbrauch informieren Sie 
        bitte umgehend die Schulverwaltung.
      </p>

      <h2>5. Pflichten der Nutzer</h2>
      
      <h3>5.1 Aktualität der Daten</h3>
      <p>
        Sie verpflichten sich, alle Angaben wahrheitsgemäß und aktuell zu halten. 
        Änderungen (z.B. Telefonnummer, abholberechtigte Personen) sind unverzüglich 
        zu aktualisieren.
      </p>

      <h3>5.2 Rechtzeitige Erstellung</h3>
      <p>
        Hortzettel sollten spätestens <strong>bis Sonntagabend</strong> für die 
        kommende Woche erstellt werden. Die Schule behält sich vor, Sperrfristen 
        einzurichten (z.B. keine Bearbeitung während der Betreuungszeiten).
      </p>

      <h3>5.3 Verbotene Nutzung</h3>
      <p>Es ist untersagt:</p>
      <ul>
        <li>Falsche oder irreführende Angaben zu machen</li>
        <li>Mehrere Accounts für dasselbe Kind anzulegen</li>
        <li>Die App für andere Zwecke als die Hortbetreuung zu nutzen</li>
        <li>Die Sicherheit der App zu gefährden oder zu umgehen</li>
      </ul>

      <h2>6. Verfügbarkeit und Änderungen</h2>
      
      <h3>6.1 Verfügbarkeit</h3>
      <p>
        Wir bemühen uns um eine hohe Verfügbarkeit der App. Ein Anspruch auf ständige 
        Erreichbarkeit besteht jedoch nicht. Wartungsarbeiten werden nach Möglichkeit 
        angekündigt.
      </p>

      <h3>6.2 Änderungen</h3>
      <p>
        Wir behalten uns vor, die App und ihre Funktionen zu ändern, zu erweitern 
        oder einzustellen. Bei wesentlichen Änderungen werden Sie informiert.
      </p>

      <h2>7. Haftung</h2>
      
      <h3>7.1 Haftungsausschluss</h3>
      <p>
        Die Nutzung der App erfolgt auf eigene Verantwortung. Wir haften nicht für:
      </p>
      <ul>
        <li>Technische Störungen oder Ausfälle</li>
        <li>Datenverlust (außer bei Vorsatz oder grober Fahrlässigkeit)</li>
        <li>Missverständnisse aufgrund unvollständiger Angaben</li>
      </ul>

      <h3>7.2 Haftung bei Personenschäden</h3>
      <p>
        Die Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der 
        Gesundheit sowie bei Vorsatz oder grober Fahrlässigkeit bleibt unberührt.
      </p>

      <h2>8. Beendigung der Nutzung</h2>
      
      <h3>8.1 Kündigung durch Nutzer</h3>
      <p>
        Sie können Ihr Konto jederzeit löschen:
      </p>
      <ul>
        <li>In der App: Profil → Einstellungen → "Konto löschen"</li>
        <li>Per E-Mail an: {settings.supportEmail}</li>
      </ul>

      <h3>8.2 Kündigung durch die Schule</h3>
      <p>
        Die Schule kann Nutzerkonten löschen, wenn:
      </p>
      <ul>
        <li>Das Kind die Schule verlässt</li>
        <li>Gegen diese Nutzungsbedingungen verstoßen wird</li>
        <li>Falsche Angaben gemacht wurden</li>
      </ul>

      <h2>9. Datenschutz</h2>
      <p>
        Der Schutz Ihrer Daten ist uns wichtig. Details zur Datenverarbeitung 
        finden Sie in unserer <strong>Datenschutzerklärung</strong>.
      </p>

      <h2>10. Support und Kontakt</h2>
      
      <div className="grid md:grid-cols-2 gap-4 not-prose">
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Technischer Support</h4>
          <p className="flex items-center gap-2 mt-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.supportEmail}`} className="text-blue-600 hover:underline">
              {settings.supportEmail}
            </a>
          </p>
          {settings.supportPhone && (
            <p className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" />
              <span>{settings.supportPhone}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Erreichbar: {settings.supportHours}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Schulleitung</h4>
          <p>{settings.principalName}</p>
          <p className="flex items-center gap-2 mt-2">
            <Mail className="w-4 h-4" />
            <a href={`mailto:${settings.principalEmail}`} className="text-blue-600 hover:underline">
              {settings.principalEmail}
            </a>
          </p>
          {settings.principalPhone && (
            <p className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" />
              <span>{settings.principalPhone}</span>
            </p>
          )}
        </div>
      </div>

      {settings.hortLeaderName && (
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg not-prose mt-4">
          <h4 className="font-semibold mb-2">Hortleitung</h4>
          <p>{settings.hortLeaderName}</p>
          {settings.hortLeaderPhone && (
            <p className="flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4" />
              <span>{settings.hortLeaderPhone}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Sprechzeiten: {settings.hortLeaderHours}
          </p>
        </div>
      )}

      <h2>11. Schlussbestimmungen</h2>
      
      <h3>11.1 Änderungen der Nutzungsbedingungen</h3>
      <p>
        Wir behalten uns vor, diese Nutzungsbedingungen zu ändern. Bei wesentlichen 
        Änderungen werden Sie per Nachricht in der App oder per E-Mail informiert.
      </p>

      <h3>11.2 Salvatorische Klausel</h3>
      <p>
        Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder 
        werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
      </p>

      <h3>11.3 Anwendbares Recht</h3>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des 
        UN-Kaufrechts.
      </p>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500 mt-6 not-prose">
        <p className="text-sm">
          <strong>Hinweis:</strong> Diese Nutzungsbedingungen wurden sorgfältig erstellt. 
          Wir empfehlen dennoch eine rechtliche Prüfung durch einen Fachanwalt für IT-Recht.
        </p>
      </div>
    </div>
  );
}
