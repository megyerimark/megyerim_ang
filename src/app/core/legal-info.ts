/**
 * Jogi adatok – EGY HELYEN. Az Impresszum és az Adatkezelési tájékoztató ebből épül fel.
 *
 * TEENDŐ ÉLESÍTÉS ELŐTT: töltsd ki az összes `null` értéket a valós adataiddal.
 * Amíg bármelyik kötelező mező üres, az oldalakon figyelmeztetés jelenik meg.
 * (Egyéni vállalkozóként: nyilvántartási szám és adószám; cégként: cégjegyzékszám és adószám.)
 */
export interface LegalInfo {
  /** Szolgáltató / adatkezelő neve, pl. „Megyeri Márk Máté egyéni vállalkozó” */
  operatorName: string | null;
  /** Székhely / levelezési cím */
  address: string | null;
  email: string | null;
  phone: string | null;
  /** Adószám, pl. 12345678-1-23 */
  taxNumber: string | null;
  /** Egyéni vállalkozói nyilvántartási szám VAGY cégjegyzékszám (ha van; üresen a sor nem jelenik meg) */
  registrationNumber: string | null;
  /** Nyilvántartást vezető szerv, pl. „Belügyminisztérium (EVNY)” (ha van; üresen a sor nem jelenik meg) */
  registry: string | null;
  /** Kamarai tagság (ha van), pl. „Budapesti Kereskedelmi és Iparkamara” */
  chamber: string | null;
  hosting: { name: string | null; address: string | null; email: string | null; website: string | null };
  /** Az e-mailek kiküldéséhez használt szolgáltató (SMTP), ha eltér a tárhelytől */
  emailProvider: string | null;
  /** A tájékoztató hatálybalépése, pl. „2026. november 1.” */
  effectiveDate: string | null;
  /** Az adatmegőrzés hónapokban – egyezzen a backend PORTFOLIO_RETENTION_MONTHS értékével */
  retentionMonths: number;
}

export const LEGAL_INFO: LegalInfo = {
  operatorName: "Megyeri Márk Máté",
  address: "5747 Almáskamarás Dózsa György utca 51",
  email: "megyerimarkmate@megyerimarkmate.hu",
  phone: "+36 (30) 7140806",
  taxNumber: "68419752-1-25",
  // Nyilvántartási szám / nyilvántartó szerv / kamara: egyéni vállalkozás után töltsd ki (addig a sorok nem jelennek meg).
  registrationNumber: null,
  registry: null,
  chamber: null,
  hosting: { name: "Rackhost Zrt.", address: "6722 Szeged, Tisza Lajos körút 41.", email: "info@rackhost.hu"
, website: "www.rackhost.hu" },
  emailProvider: "megyerimarkmate@megyerimarkmate.hu",
  effectiveDate:"2026.11.01",
  retentionMonths: 24,
};

/** Kötelező mezők, amelyek nélkül a jogi oldalak nem teljesek. */
export function missingLegalFields(info: LegalInfo = LEGAL_INFO): string[] {
  const required: [string, string | null][] = [
    ['szolgáltató neve', info.operatorName],
    ['székhely / cím', info.address],
    ['e-mail-cím', info.email],
    ['adószám', info.taxNumber],
    ['tárhelyszolgáltató neve', info.hosting.name],
    ['tárhelyszolgáltató címe', info.hosting.address],
    ['tárhelyszolgáltató elérhetősége', info.hosting.email],
    ['hatálybalépés dátuma', info.effectiveDate],
  ];
  return required.filter(([, value]) => !value || !value.trim()).map(([label]) => label);
}
