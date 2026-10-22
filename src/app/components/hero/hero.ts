import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroSculpture } from '../hero-sculpture/hero-sculpture';
@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [RouterLink, HeroSculpture],
    templateUrl: './hero.html',
    styleUrl: './hero.scss'
})
export class Hero {
    @Input()
    headline = 'Ne csak jelen legyél online. Emelkedj ki.';
    @Input()
    description = 'Egyedi weboldalakat és prémium digitális megoldásokat készítek vállalkozásoknak – hogy a megjelenésed bizalmat építsen, és támogassa az ügyfélszerzést.';
    get titleLead(): string { const idx = this.headline.lastIndexOf('. '); return idx > 0 ? this.headline.slice(0, idx + 1) : this.headline; }
    get titleAccent(): string { const idx = this.headline.lastIndexOf('. '); return idx > 0 ? this.headline.slice(idx + 2) : ''; }
}
