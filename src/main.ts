import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { PaletteService } from './app/core/palette.service';

// a legutóbbi téma azonnal, az első kirajzolás előtt (ne villanjon az alaptéma)
PaletteService.applyEarly();

// Könnyített mód már az első kirajzolástól: ha ebben a munkamenetben a hero lassú rajzolást mért,
// vagy gyenge a gép (kevés mag / memória), a drága elmosásos effektek ki vannak kapcsolva (styles.scss: .perf-lite).
try {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  if (weak || sessionStorage.getItem('mm-perf-lite') === '1') document.documentElement.classList.add('perf-lite');
} catch { /* privát mód */ }

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
