import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Hero } from './hero';

describe('Hero', () => {
  it('renders the portfolio headline and quote action', async () => {
    await TestBed.configureTestingModule({ imports: [Hero], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('h1')?.textContent).toContain('Prémium weboldalak');
    expect(html.querySelector('a[href="/ajanlatkeres"]')).toBeTruthy();
  });
});
