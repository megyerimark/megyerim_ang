import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({selector:'app-hero',standalone:true,imports:[RouterLink],templateUrl:'./hero.html',styleUrl:'./hero.scss'})
export class Hero {
 @Input() headline='Prémium weboldalak, amelyek nemcsak szépek.';
 @Input() description='Egyedi digitális megoldások vállalkozásoknak, modern megjelenéssel és átgondolt felhasználói élménnyel.';
 tiltX=0;tiltY=0;
 move(e:MouseEvent){const b=(e.currentTarget as HTMLElement).getBoundingClientRect();this.tiltX=((e.clientY-b.top)/b.height-.5)*-7;this.tiltY=((e.clientX-b.left)/b.width-.5)*10;}
 reset(){this.tiltX=0;this.tiltY=0;}
}
