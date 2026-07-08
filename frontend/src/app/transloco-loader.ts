import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string): Promise<Translation> {
    // Ruta relativa (sin "/" inicial): con barra inicial se resuelve contra la raiz del
    // dominio y rompe en GitHub Pages, donde la app vive en una subruta (/nombre-repo/).
    // En local coincide con la raiz por casualidad, por eso ahi no se notaba el fallo.
    return new Promise((resolve, reject) => {
      this.http.get<Translation>(`i18n/${lang}.json`).subscribe({
        next: resolve,
        error: reject,
      });
    });
  }
}
