export interface LegalSettings {
  schoolName: string;
  schoolStreet: string;
  schoolZip: string;
  schoolCity: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  dsbName: string;
  dsbEmail: string;
  dsbPhone: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  hortLeaderName: string;
  hortLeaderPhone: string;
  hortLeaderHours: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  lastUpdated: string;
  version: string;
}

export const defaultLegalSettings: LegalSettings = {
  schoolName: 'Grundschule Auma',
  schoolStreet: '[Straße und Hausnummer]',
  schoolZip: '[PLZ]',
  schoolCity: 'Auma-Weidatal',
  schoolPhone: '[Telefonnummer]',
  schoolEmail: '[E-Mail-Adresse]',
  schoolWebsite: '',
  dsbName: '[Name des Datenschutzbeauftragten]',
  dsbEmail: '[E-Mail des DSB]',
  dsbPhone: '',
  principalName: '[Name der Schulleitung]',
  principalEmail: '[E-Mail der Schulleitung]',
  principalPhone: '',
  hortLeaderName: '',
  hortLeaderPhone: '',
  hortLeaderHours: 'Montag - Freitag, 12:00 - 17:00 Uhr',
  supportEmail: '[Support-E-Mail]',
  supportPhone: '',
  supportHours: 'Montag - Freitag, 8:00 - 16:00 Uhr',
  lastUpdated: '2025-10-30',
  version: '1.0',
};
