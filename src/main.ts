import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { PaletteService } from './app/core/palette.service';

// a legutóbbi téma azonnal, az első kirajzolás előtt (ne villanjon az alaptéma)
PaletteService.applyEarly();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
