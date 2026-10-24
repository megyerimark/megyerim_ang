import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/** Accessible enhancement: content stays visible without JS, observers or under reduced motion. */
@Directive({ selector: '[premiumReveal]', standalone: true })
export class PremiumReveal implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private readonly targets = '.process-step, .faq-item, .promise-card, .service-tile, .portfolio-card, .comparison-stage, .lab-controls, .lab-stage, .brief-panel, .estimate-card, .about-art, .about-copy, .section-heading-row, .transformation-header, .cta-panel';

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = this.element.nativeElement;
    // Per-item stagger instead of hiding a whole section at once.
    const items = Array.from(host.querySelectorAll<HTMLElement>(this.targets));
    if (!items.length) items.push(host);
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aurora-visible');
          this.observer?.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -28px 0px', threshold: 0.04 });
    for (const [index, node] of items.entries()) {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.93 && rect.bottom > 0) continue;
      node.classList.add('aurora-reveal-item');
      node.style.setProperty('--aurora-stagger', `${Math.min(index % 4, 3) * 85}ms`);
      node.style.setProperty('--aurora-reveal-x', `${index % 2 ? 18 : -18}px`);
      this.observer.observe(node);
    }
  }
  ngOnDestroy(): void { this.observer?.disconnect(); }
}
