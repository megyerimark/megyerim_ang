import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * Görgetési megjelenés. JS / IntersectionObserver nélkül a tartalom látható marad.
 * „Mozgás csökkentése” beállításnál (akadálymentesség) nincs mozgás és elmosás, csak finom áttűnés –
 * ezt a WCAG megengedi, és így ott sem tűnik „halottnak” az oldal.
 */
@Directive({ selector: '[premiumReveal]', standalone: true })
export class PremiumReveal implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private readonly targets = '.audience-card, .concept-card, .testimonial-card, .process-step, .faq-item, .promise-card, .service-tile, .portfolio-card, .comparison-stage, .lab-controls, .lab-stage, .brief-panel, .estimate-card, .about-art, .about-copy, .section-heading-row, .transformation-header, .cta-panel';

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const host = this.element.nativeElement;
    // Per-item stagger instead of hiding a whole section at once.
    const items = Array.from(host.querySelectorAll<HTMLElement>(this.targets));
    if (!items.length) items.push(host);
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const node = entry.target as HTMLElement;
          node.classList.add('aurora-visible');
          this.observer?.unobserve(node);
          // A megjelenés után visszaadjuk a kártyák saját (hover) átmeneteit.
          const delay = parseFloat(node.style.getPropertyValue('--aurora-stagger')) || 0;
          setTimeout(() => node.classList.remove('aurora-reveal-item', 'aurora-reveal-soft', 'aurora-visible'), 1250 + delay);
        }
      }
    }, { rootMargin: '0px 0px -28px 0px', threshold: 0.04 });
    for (const [index, node] of items.entries()) {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.93 && rect.bottom > 0) continue;
      node.classList.add('aurora-reveal-item');
      if (reduced) node.classList.add('aurora-reveal-soft');
      node.style.setProperty('--aurora-stagger', `${Math.min(index % 4, 3) * 85}ms`);
      node.style.setProperty('--aurora-reveal-x', `${index % 2 ? 18 : -18}px`);
      this.observer.observe(node);
    }
  }
  ngOnDestroy(): void { this.observer?.disconnect(); }
}
