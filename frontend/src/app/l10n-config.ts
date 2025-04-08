import { Injectable } from '@angular/core';
import { L10nConfig, L10nProvider, L10nTranslationLoader } from 'angular-l10n';
import { from, Observable } from 'rxjs';
import { DEFAULT_LANGUAGE, VI_LANGUAGE } from './share/constant';

export const l10nConfig: L10nConfig = {
  format: 'language-region',
  providers: [
    { name: 'errors', asset: 'errors' },
    { name: 'messages', asset: 'messages' },
    { name: 'ui', asset: 'ui' },
  ],
  cache: true,
  keySeparator: '.',
  defaultLocale: {
    language: DEFAULT_LANGUAGE,
    currency: 'USD',
    timeZone: 'America/Los_Angeles',
  },
  schema: [
    {
      locale: {
        language: DEFAULT_LANGUAGE,
        currency: 'USD',
        timeZone: 'America/Los_Angeles',
      },
    },
    {
      locale: {
        language: VI_LANGUAGE,
        currency: 'VND',
        timeZone: 'America/Los_Angeles',
      },
    },
  ],
};
const getUserLanguage = () => {
  const userLanguage = navigator.language?.split('-')[0];
  return [DEFAULT_LANGUAGE, VI_LANGUAGE].includes(userLanguage)
    ? userLanguage
    : DEFAULT_LANGUAGE;
};

@Injectable()
export class TranslationLoader implements L10nTranslationLoader {
  public get(
    _: string,
    provider: L10nProvider
  ): Observable<{ [key: string]: any }> {
    /**
     * Translation files are lazy-loaded via dynamic import and will be split into separate chunks during build.
     * Assets names and keys must be valid variable names
     */
    // const userLanguage = 'vi';
    const userLanguage = getUserLanguage();
    const data = import(`./i18n/${userLanguage}/${provider.asset}.json`);
    // console.log(data.then((ui) => console.log(ui)));
    return from(data);
  }
}
