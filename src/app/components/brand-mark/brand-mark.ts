import { Component, input } from '@angular/core';

/**
 * Az „M.” monogram – ugyanaz a forma, mint a favicon (public/favicon.svg): fehér M, lila–cián pont.
 * A fejlécben, a láblécben és a „Rólam” részen is ezt használjuk, hogy kis méretben is egységes legyen a márka.
 * framed = sötét, lekerekített négyzetben (mint a favicon / profilkép); különben csak a jel.
 */
@Component({
    selector: 'app-brand-mark',
    standalone: true,
    template: `
        <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" style="stop-color: var(--k-b79cff)"/><stop offset="1" style="stop-color: var(--k-8bc5ff)"/>
                </linearGradient>
            </defs>
            @if (framed()) {<rect class="frame" x="1" y="1" width="62" height="62" rx="16"/>}
            <path class="m" d="M14 45V19h8l10 14 10-14h8v26h-8V32L32 45 22 32v13z"/>
            <circle cx="51" cy="48" r="4" [attr.fill]="'url(#' + gid + ')'"/>
        </svg>
    `,
    styles: [`
        :host { display: inline-block; width: 1em; height: 1em; line-height: 0; }
        svg { width: 100%; height: 100%; overflow: visible; }
        .frame { fill: var(--k-0d1426); stroke: var(--k-a99cf0-4d); stroke-width: 1.5; }
        .m { fill: currentColor; }
    `],
})
export class BrandMark {
    readonly framed = input(true);
    private static seq = 0;
    /** Oldalanként több példány is lehet – a színátmenet azonosítója legyen egyedi. */
    readonly gid = `mm-dot-${++BrandMark.seq}`;
}
