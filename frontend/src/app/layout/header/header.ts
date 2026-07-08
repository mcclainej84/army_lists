import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
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
  authService = inject(AuthService);
  version = APP_VERSION;
  lastUpdated = APP_LAST_UPDATED;

  setLocale(locale: Locale): void {
    this.localeService.setLocale(locale);
  }

  signIn(): void {
    this.authService.signInWithGoogle().catch(() => {
      // Popup cerrado por el usuario u otro fallo de login: no hay nada mas que hacer aqui,
      // el boton simplemente se queda en estado "sin sesion".
    });
  }

  signOut(): void {
    this.authService.signOutUser();
  }
}
