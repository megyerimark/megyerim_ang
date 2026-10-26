import { LEGAL_INFO, LegalInfo, missingLegalFields } from './legal-info';

describe('missingLegalFields', () => {
  it('lists every required field while the config is empty', () => {
    const empty: LegalInfo = { ...LEGAL_INFO, operatorName: null, hosting: { name: null, address: null, email: null, website: null } };
    expect(missingLegalFields(empty)).toContain('szolgáltató neve');
    expect(missingLegalFields(empty)).toContain('tárhelyszolgáltató neve');
  });

  it('returns nothing once all required data is filled in', () => {
    const filled: LegalInfo = {
      ...LEGAL_INFO,
      operatorName: 'Teszt Elek ev.', address: '1000 Budapest, Fő utca 1.', email: 'a@b.hu',
      taxNumber: '12345678-1-23', registrationNumber: '12345678', registry: 'Belügyminisztérium',
      effectiveDate: '2026. november 1.',
      hosting: { name: 'Tárhely Kft.', address: '1000 Budapest', email: 'info@tarhely.hu', website: null },
    };
    expect(missingLegalFields(filled)).toEqual([]);
  });
});
