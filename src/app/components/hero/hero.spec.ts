import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Hero } from './hero';

describe('Hero', () => {
  it('renders the portfolio headline and quote action', async () => {
    await TestBed.configureTestingModule({ imports: [Hero], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    const title = html.querySelector('h1');
    expect(title?.getAttribute('aria-label')).toBe('Ne csak jelen legyél online. Emelkedj ki.');
    expect(title?.textContent).toContain('Emelkedj ki.');
    expect(html.querySelector('a[href="/ajanlatkeres"]')).toBeTruthy();
  });
});
