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
    headline = 'Prémium weboldalak, amelyek nemcsak szépek.';
    @Input()
    description = 'Egyedi digitális megoldások vállalkozásoknak, modern megjelenéssel és átgondolt felhasználói élménnyel.';
}
