import { Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Locale } from './models';

const STORAGE_KEY = 'listgenerator.locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly current = signal<Locale>(this.readInitial());

  constructor(private transloco: TranslocoService) {
    this.transloco.setActiveLang(this.current());
  }

  setLocale(locale: Locale): void {
    this.current.set(locale);
    this.transloco.setActiveLang(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // localStorage puede no estar disponible (modo privado, etc.); no es critico.
    }
  }

  private readInitial(): Locale {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch {
      // ignorar
    }
    return 'es';
  }
}
