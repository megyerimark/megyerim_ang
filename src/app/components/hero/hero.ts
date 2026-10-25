import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './hero.html',
    styleUrl: './hero.scss'
})
export class Hero {
    @Input()
    headline = 'Ne csak jelen legyél online. Emelkedj ki.';
    @Input()
    description = 'Prémium weboldalak, amelyek nemcsak szépek, hanem az ügyfélszerzést is támogatják.';
    get titleLead(): string { const idx = this.headline.lastIndexOf('. '); return idx > 0 ? this.headline.slice(0, idx + 1) : this.headline; }
    get titleAccent(): string { const idx = this.headline.lastIndexOf('. '); return idx > 0 ? this.headline.slice(idx + 2) : ''; }
    moveScene(event: PointerEvent): void {
        if (event.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
        const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
        target.style.setProperty('--scene-ry', `${x * 6}deg`);
        target.style.setProperty('--scene-rx', `${y * -4}deg`);
    }
    resetScene(event: PointerEvent): void {
        const target = event.currentTarget as HTMLElement;
        target.style.setProperty('--scene-ry', '0deg');
        target.style.setProperty('--scene-rx', '0deg');
    }
}
