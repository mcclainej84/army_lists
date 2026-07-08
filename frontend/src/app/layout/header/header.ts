import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocaleService } from '../../core/locale.service';
import { Locale } from '../../core/models';
import { APP_LAST_UPDATED, APP_VERSION } from '../../version';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslocoModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  localeService = inject(LocaleService);
  version = APP_VERSION;
  lastUpdated = APP_LAST_UPDATED;

  setLocale(locale: Locale): void {
    this.localeService.setLocale(locale);
  }
}
