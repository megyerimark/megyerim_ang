import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { I18nTitleStrategy } from './i18n/title.strategy';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { routes } from './app.routes';
export const appConfig: ApplicationConfig = {
    providers: [provideBrowserGlobalErrorListeners(), provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })), provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })), { provide: TitleStrategy, useClass: I18nTitleStrategy }]
};
