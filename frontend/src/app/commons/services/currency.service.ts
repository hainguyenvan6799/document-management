import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly http: HttpClient = inject(HttpClient);
  constructor() {}
  getCurrencyExchange() {
    if (!localStorage.getItem('Currency_exchange')) {
      this.http.get(environment.CURRENCY_SERVICE).subscribe((data: any) => {
        localStorage.setItem('Currency_exchange', data?.result?.VND);
      });
    }
  }
}
