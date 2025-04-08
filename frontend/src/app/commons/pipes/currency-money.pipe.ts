import { Pipe, PipeTransform } from '@angular/core';
import {
  DEFAULT_CURRENCY,
  EXCHANGE_RATE_VN_USD,
  LOCALE_STRING_US,
  LOCALE_STRING_VN,
  VI_CURRENCY,
  VI_LANGUAGE,
} from '@commons/constants';
@Pipe({
  name: 'currencyMoney',
  standalone: true,
})
export class CurrencyMoneyPipe implements PipeTransform {
  getUserLanguage = () => {
    const userLanguage = navigator.language?.split('-')[0];
    return VI_LANGUAGE === userLanguage ? VI_CURRENCY : DEFAULT_CURRENCY;
  };

  convertVNDToUSD(vndAmount: number, exchangeRate: number = EXCHANGE_RATE_VN_USD) {
    return +vndAmount / +exchangeRate;
  }
  transform(value: number): string {
    const currency = this.getUserLanguage();
    let localeString = LOCALE_STRING_VN;
    if (currency !== VI_CURRENCY) {
      localeString = LOCALE_STRING_US;
      const currencyExchange = localStorage.getItem('Currency_exchange') || EXCHANGE_RATE_VN_USD;
      value = this.convertVNDToUSD(value, +currencyExchange);
    }
    return value.toLocaleString(localeString, {
      style: 'currency',
      currency,
    });
  }
}
