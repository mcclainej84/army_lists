import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string): Promise<Translation> {
    // Los JSON de traduccion se sirven como estaticos desde /public/i18n, por eso la ruta empieza en /i18n
    // (en Angular 17+ la carpeta "public" reemplaza a "assets" y su contenido se publica en la raiz).
    return new Promise((resolve, reject) => {
      this.http.get<Translation>(`/i18n/${lang}.json`).subscribe({
        next: resolve,
        error: reject,
      });
    });
  }
}
