import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Home } from './home';

describe('Prémium főoldal üzleti logikája', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient()] }));

  it('az új főcímmel indul, és csak valódi referenciákat tesz elérhetővé', () => {
    const home = TestBed.runInInjectionContext(() => new Home());
    expect(home.heroHeadline()).toBe('Ne csak jelen legyél online. Emelkedj ki.');
    home.projects.set([
      { id: 1, title: 'Demo', slug: 'demo', is_demo: true },
      { id: 2, title: 'Valódi', slug: 'valodi', is_demo: false }
    ] as any);
    expect(home.realProjects().map(item => item.title)).toEqual(['Valódi']);
  });

  it('a becslés paraméterváltozásra frissül', () => {
    const home = TestBed.runInInjectionContext(() => new Home());
    home.inquiryCount.set(60);
    home.inquiryMinutes.set(15);
    expect(home.savedHours()).toBe(6);
  });

  it('a projektkezdő választás és az összehasonlító nézet változtatható', () => {
    const home = TestBed.runInInjectionContext(() => new Home());
    home.briefType.set('custom');
    home.comparisonView.set('before');
    expect(home.briefType()).toBe('custom');
    expect(home.comparisonView()).toBe('before');
  });
});
