import React from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Book, Users, UserCog, Settings, MessageSquare, FileText, CheckCircle2, X, Info } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface HelpGuideProps {
  onClose: () => void;
}

export default function HelpGuide({ onClose }: HelpGuideProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b border-white/20 shadow-lg sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Book className="h-8 w-8 text-white" />
                <h1 className="text-3xl text-white">Benutzeranleitung</h1>
              </div>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-8 pr-4">
                
                {/* Für Eltern */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl">📱 Für Eltern</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Registrierung */}
                    <div>
                      <h3 className="text-2xl mb-4">1. Registrierung</h3>
                      <div className="space-y-3 text-base">
                        <p className="font-semibold">So erstellst du einen Eltern-Account:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          <li>Öffne die App und klicke auf <strong>"Registrieren"</strong></li>
                          <li><strong>Eltern-Informationen:</strong> Gib deinen vollständigen Namen ein (z.B. "Anna Müller")</li>
                          <li><strong>Kind-Informationen:</strong> Vorname, Nachname und Klasse/Hortgruppe</li>
                          <li><strong>Passwort erstellen:</strong>
                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                              <li>Mindestens 6 Zeichen lang</li>
                              <li>Muss mindestens ein Sonderzeichen enthalten (!@#$%^&*...)</li>
                            </ul>
                          </li>
                          <li>Nutzungsbedingungen akzeptieren</li>
                          <li>Klicke auf <strong>"Registrieren"</strong></li>
                        </ol>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                          <p className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            <strong>Fertig!</strong> Du wirst automatisch angemeldet.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Anmeldung */}
                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">2. Anmeldung</h3>
                      <div className="space-y-3 text-base">
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          <li>Öffne die App und klicke auf <strong>"Anmelden"</strong></li>
                          <li>Gib deinen vollständigen Namen ein (z.B. "Anna Müller")</li>
                          <li>Gib dein Passwort ein</li>
                          <li>Optional: Setze "Angemeldet bleiben" für 24 Stunden</li>
                          <li>Klicke auf <strong>"Anmelden"</strong></li>
                        </ol>
                      </div>
                    </div>

                    {/* Passwort vergessen */}
                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">3. Passwort vergessen?</h3>
                      <div className="space-y-3 text-base">
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          <li>Klicke auf <strong>"Passwort vergessen?"</strong></li>
                          <li>Gib den Namen deines Kindes ein (Vor- und Nachname)</li>
                          <li>Klicke auf <strong>"Passwort zurücksetzen"</strong></li>
                          <li>Du erhältst ein temporäres Passwort - kopiere es!</li>
                          <li>Melde dich an und ändere das Passwort im Profil</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Hortzettel verwalten */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl">📋 Hortzettel verwalten</h2>
                  </div>

                  <div className="space-y-6 text-base">
                    {/* Erstellen */}
                    <div>
                      <h3 className="text-2xl mb-4">Hortzettel erstellen</h3>
                      <p className="font-semibold mb-2">So erstellst du einen neuen Hortzettel:</p>
                      <ol className="list-decimal list-inside space-y-3 ml-4">
                        <li>Klicke auf <strong>"+ Neuer Hortzettel"</strong> auf der Startseite</li>
                        <li><strong>Kind auswählen:</strong> Falls du mehrere Kinder hast</li>
                        <li><strong>Woche auswählen:</strong> Die App zeigt automatisch die aktuelle/nächste Woche</li>
                        <li><strong>Hortgruppe wählen:</strong> Hort 1, 2, 3 oder 4</li>
                        <li><strong>Frage beantworten:</strong> "Darf mein Kind alleine Heim gehen?" (Ja/Nein)</li>
                        <li><strong>Abholzeiten festlegen:</strong> Für Montag bis Freitag
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>"Wird nicht abgeholt" (Kind geht alleine)</li>
                            <li>13:30 Uhr</li>
                            <li>14:30 Uhr</li>
                            <li>15:30 Uhr</li>
                            <li>16:00 Uhr</li>
                            <li>Nach 16:00 Uhr</li>
                            <li>Optional: Abholperson angeben (z.B. "Mama", "Oma")</li>
                          </ul>
                        </li>
                        <li><strong>Notizen hinzufügen</strong> (optional): Zusätzliche Hinweise</li>
                        <li>Klicke auf <strong>"Hortzettel erstellen"</strong></li>
                      </ol>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                        <p className="text-blue-800">
                          <strong>💡 Hinweis:</strong> Hortzettel werden ab Samstag automatisch archiviert
                        </p>
                      </div>
                    </div>

                    {/* Bearbeiten */}
                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Hortzettel bearbeiten</h3>
                      <div className="space-y-3">
                        <p className="font-semibold">Änderungen an einem bestehenden Hortzettel vornehmen:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          <li>Öffne den Tab <strong>"Hortzettel"</strong> in der unteren Navigation</li>
                          <li>Wähle den gewünschten Zettel aus der Liste aus</li>
                          <li>Nimm die gewünschten Änderungen vor</li>
                          <li>Klicke unten auf <strong>"Speichern"</strong></li>
                        </ol>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
                          <p className="flex items-center gap-2 text-amber-800">
                            <Info className="h-5 w-5 flex-shrink-0" />
                            <span>
                              <strong>Wichtig:</strong> Eine Änderung des Zettels kann jederzeit über den Hortzettelbereich erfolgen, solange die Bearbeitungszeit nicht abgelaufen ist.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Profil verwalten */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl">👤 Profil & Kinder verwalten</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Kinder hinzufügen */}
                    <div>
                      <h3 className="text-2xl mb-4">Kind hinzufügen:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4 text-base">
                        <li>Gehe zum Profil</li>
                        <li>Klicke auf <strong>"+ Kind hinzufügen"</strong></li>
                        <li>Fülle alle Informationen aus:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li><strong>Vorname, Nachname, Klasse</strong></li>
                            <li><strong>Geburtsdatum:</strong> Für Notfälle wichtig</li>
                            <li><strong>Telefonnummer der Eltern</strong></li>
                            <li><strong>Allergien:</strong> z.B. "Nussallergie"</li>
                            <li><strong>Medizinische Hinweise:</strong> z.B. "Asthma"</li>
                            <li><strong>Abholberechtigung:</strong> Wer darf abholen?</li>
                            <li><strong>Notfallkontakt:</strong> Name und Telefonnummer</li>
                          </ul>
                        </li>
                        <li>Klicke auf <strong>"Kind hinzufügen"</strong></li>
                      </ol>
                    </div>

                    {/* Kind bearbeiten/löschen */}
                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Kind bearbeiten/löschen:</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li><strong>Bearbeiten:</strong> Klicke auf das Stift-Symbol beim Kind</li>
                        <li><strong>Löschen:</strong> Klicke auf das Papierkorb-Symbol</li>
                      </ul>
                    </div>

                    {/* Passwort ändern */}
                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Passwort ändern:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4 text-base">
                        <li>Gehe zum Profil</li>
                        <li>Scrolle zum Bereich "Passwort ändern"</li>
                        <li>Gib das neue Passwort ein (mind. 6 Zeichen + Sonderzeichen)</li>
                        <li>Bestätige das neue Passwort</li>
                        <li>Klicke auf <strong>"Speichern"</strong></li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* Nachrichten */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl">💬 Nachrichten</h2>
                  </div>

                  <div className="space-y-4 text-base">
                    <h3 className="text-xl font-semibold">Neue Nachricht senden:</h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Klicke auf <strong>"Nachrichten"</strong> in der Navigation</li>
                      <li>Klicke auf <strong>"+ Neue Nachricht"</strong></li>
                      <li>Wähle den Empfänger:
                        <ul className="list-disc list-inside ml-6 mt-2">
                          <li><strong>Hortner:</strong> Für Fragen zu Hortzettel, Betreuung</li>
                          <li><strong>Admin:</strong> Für technische Probleme, Feedback</li>
                        </ul>
                      </li>
                      <li>Betreff und Nachricht eingeben</li>
                      <li>Klicke auf <strong>"Senden"</strong></li>
                    </ol>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-xl font-semibold mb-2">Auf Nachricht antworten:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Öffne die Unterhaltung</li>
                        <li>Schreibe deine Antwort im Textfeld unten</li>
                        <li>Klicke auf <strong>"Senden"</strong></li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* Für Hortner */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <UserCog className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl">👥 Für Hortner</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl mb-4">Anmeldung als Hortner:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4 text-base">
                        <li>Klicke auf <strong>"Hortner-Login"</strong></li>
                        <li>Benutzername und Passwort eingeben (vom Admin erhalten)</li>
                        <li>Klicke auf <strong>"Anmelden"</strong></li>
                      </ol>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Hortzettel suchen und filtern:</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li><strong>Nach Woche filtern:</strong> Wähle die gewünschte Woche</li>
                        <li><strong>Nach Hortgruppe filtern:</strong> Wähle Hort 1, 2, 3, 4 oder "Alle"</li>
                        <li><strong>Nach Name suchen:</strong> Gib den Namen ein (Echtzeit-Suche)</li>
                      </ul>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Kindinformationen anzeigen:</h3>
                      <p className="text-base mb-3">Beim Öffnen eines Hortzettels siehst du:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li>Name, Klasse, Geburtsdatum</li>
                        <li>Telefonnummer der Eltern</li>
                        <li>Allergien und medizinische Hinweise</li>
                        <li>Abholberechtigung</li>
                        <li>Notfallkontakt</li>
                        <li>Abholzeiten für jeden Tag</li>
                      </ul>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Hortzettel drucken:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4 text-base">
                        <li>Öffne einen Hortzettel</li>
                        <li>Klicke auf <strong>"Drucken"</strong></li>
                        <li>Wähle Druckoptionen und drucke</li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* Für Administratoren */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl">⚙️ Für Administratoren</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl mb-4">Admin-Dashboard:</h3>
                      <p className="text-base mb-3">Das Admin-Dashboard bietet folgende Bereiche:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li><strong>Übersicht:</strong> Systemstatistiken und Aktivitäten</li>
                        <li><strong>Benutzer:</strong> Eltern und Hortner verwalten</li>
                        <li><strong>Hortzettel:</strong> Alle Hortzettel anzeigen und filtern</li>
                        <li><strong>Einstellungen:</strong> Zeitbeschränkungen, Schulname, Klassen</li>
                        <li><strong>Texte (CMS):</strong> Über 16 Textfelder bearbeiten</li>
                        <li><strong>Nachrichten:</strong> Kommunikation verwalten</li>
                        <li><strong>Design:</strong> Farbthemen und Logo anpassen</li>
                        <li><strong>Rechtliches:</strong> Datenschutz, Impressum, Nutzungsbedingungen</li>
                      </ul>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Content Management (Texte):</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4 text-base">
                        <li>Klicke auf <strong>"Texte"</strong> im Admin-Dashboard</li>
                        <li>Wähle das Textfeld aus, das du bearbeiten möchtest</li>
                        <li>Schreibe den neuen Text</li>
                        <li>Klicke auf <strong>"Speichern"</strong></li>
                        <li>Änderungen sind sofort sichtbar</li>
                      </ol>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-4">Hortner-Accounts verwalten:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4 text-base">
                        <li>Gehe zu <strong>"Benutzer"</strong> → <strong>"Hortner"</strong></li>
                        <li>Klicke auf <strong>"+ Neuer Hortner"</strong></li>
                        <li>Benutzername und Passwort vergeben</li>
                        <li>Speichern</li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* Wichtige Hinweise */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <h2 className="text-3xl mb-6">🔧 Wichtige Hinweise</h2>
                  
                  <div className="space-y-4 text-base">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        ⏰ Automatische Archivierung
                      </h3>
                      <p>Hortzettel werden ab Samstag automatisch archiviert und können nicht mehr bearbeitet werden.</p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        🔒 Sicherheit
                      </h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Passwörter müssen mindestens 6 Zeichen und ein Sonderzeichen enthalten</li>
                        <li>Wähle sichere Passwörter</li>
                        <li>Gib deine Login-Daten nicht weiter</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        📱 Mobilfreundlich
                      </h3>
                      <p>Die App ist für Smartphones, Tablets und Desktop optimiert. Alle Funktionen sind auf allen Geräten verfügbar.</p>
                    </div>
                  </div>
                </section>

                {/* Tipps & Tricks */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
                  <h2 className="text-3xl mb-6">💡 Tipps & Tricks</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl mb-3">Für Eltern:</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li>Erstelle Vorlagen für wiederkehrende Abholzeiten</li>
                        <li>Du kannst mehrere Kinder in einem Account verwalten</li>
                        <li>Aktiviere "Angemeldet bleiben" für 24h Komfort</li>
                        <li>Halte Allergien und Notfallkontakte aktuell</li>
                        <li>Erstelle Hortzettel rechtzeitig vor der Woche</li>
                      </ul>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-3">Für Hortner:</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li>Verwende Filter, um schnell die richtigen Hortzettel zu finden</li>
                        <li>Nutze die Druckfunktion für Papier-Backups</li>
                        <li>Prüfe Allergien und medizinische Hinweise</li>
                        <li>Nutze das Nachrichtensystem für Rückfragen</li>
                      </ul>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-2xl mb-3">Für Admins:</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-base">
                        <li>Exportiere wichtige Daten regelmäßig</li>
                        <li>Passe Texte an die Bedürfnisse deiner Schule an</li>
                        <li>Lege sinnvolle Bearbeitungsfristen fest</li>
                        <li>Nutze das CMS für klare Kommunikation</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Support */}
                <section className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl shadow-xl p-8">
                  <h2 className="text-3xl mb-6">📞 Support</h2>
                  
                  <div className="space-y-4 text-base">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Für Eltern:</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Kontaktiere die Hortner über das Nachrichtensystem</li>
                        <li>Bei technischen Problemen: Schreibe dem Admin</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-2">Für Hortner:</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Kontaktiere den Admin über das Nachrichtensystem</li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/20">
                      <p className="text-center text-lg">
                        🎉 <strong>Viel Erfolg mit der Hortzettel-App!</strong>
                      </p>
                      <p className="text-center mt-2 opacity-90">
                        Letzte Aktualisierung: November 2024
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            </ScrollArea>
          </div>
        </main>
      </div>
    </div>
  );
}