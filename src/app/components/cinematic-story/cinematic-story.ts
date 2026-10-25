import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cinematic-story',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cinematic-story.html',
  styleUrls: ['./cinematic-story.scss', './cinematic-story-v12.scss']
})
export class CinematicStory implements AfterViewInit, OnDestroy {
  @ViewChild('storySection', { static: true }) private section!: ElementRef<HTMLElement>;
  readonly progress = signal(0);
  readonly chapters = [
    { number: '01', title: 'Stratégia', description: 'Először megértjük a vállalkozásod célját.' },
    { number: '02', title: 'Dizájn', description: 'A tartalom és az arculat saját karaktert kap.' },
    { number: '03', title: 'Fejlesztés', description: 'A különálló elemekből egységes élmény épül.' },
    { number: '04', title: 'Minden eszközön', description: 'A weboldal mobilon is természetesen működik.' }
  ];
  readonly chapter = computed(() => this.chapters[Math.min(3, Math.floor(this.progress() * 4))]);
  readonly stageTransform = computed(() => `rotateX(${11 - this.progress() * 7}deg) rotateY(${-14 + this.progress() * 9}deg)`);
  readonly wireTransform = computed(() => this.layerTransform(-60, 105, -170));
  readonly visualTransform = computed(() => this.layerTransform(36, 50, 40));
  readonly contentTransform = computed(() => this.layerTransform(-16, -23, 125));
  readonly menuTransform = computed(() => this.layerTransform(0, -72, 215));
  readonly galleryTransform = computed(() => this.layerTransform(16, 70, 165));
  readonly mobileTransform = computed(() => `translate3d(${Math.round((1 - this.progress()) * 40)}px, ${Math.round((1 - this.progress()) * 24)}px, 145px) rotateY(-9deg)`);
  readonly phoneOpacity = computed(() => Math.max(.84, Math.min(1, .84 + this.progress() * .5)));
  readonly percentage = computed(() => String(Math.round(this.progress() * 100)).padStart(2, '0'));
  private scheduled = 0;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { this.scheduled = window.requestAnimationFrame(() => { this.scheduled = 0; this.progress.set(.87); }); return; }
    window.addEventListener('scroll', this.queueUpdate, { passive: true });
    window.addEventListener('resize', this.queueUpdate, { passive: true });
    this.queueUpdate();
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('scroll', this.queueUpdate);
    window.removeEventListener('resize', this.queueUpdate);
    if (this.scheduled) window.cancelAnimationFrame(this.scheduled);
  }

  private readonly queueUpdate = (): void => {
    if (this.scheduled) return;
    this.scheduled = window.requestAnimationFrame(() => {
      this.scheduled = 0;
      const rect = this.section.nativeElement.getBoundingClientRect();
      if (window.innerWidth <= 870) {
        // On touch devices the section does not pin; animate the same layers as it passes through view.
        const visibleJourney = Math.max(1, rect.height + window.innerHeight);
        this.progress.set(Math.max(0, Math.min(1, (window.innerHeight - rect.top) / visibleJourney)));
        return;
      }
      const distance = Math.max(1, rect.height - window.innerHeight);
      this.progress.set(Math.max(0, Math.min(1, -rect.top / distance)));
    });
  };

  private layerTransform(x: number, y: number, z: number): string {
    const remaining = 1 - Math.min(1, this.progress() / .83);
    return `translate3d(${Math.round(x * remaining)}px, ${Math.round(y * remaining)}px, ${Math.round(z * remaining)}px)`;
  }
}
