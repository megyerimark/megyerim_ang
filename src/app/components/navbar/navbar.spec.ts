import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';

describe('Navbar', () => {
  it('renders the brand and theme button', async () => {
    await TestBed.configureTestingModule({ imports: [Navbar], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('MEGYERI MÁRK MÁTÉ');
    expect(html.querySelector('button.theme-btn')).toBeTruthy();
  });
});
