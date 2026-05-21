import { getRequestConfig } from 'next-intl/server';
import { isSupportedLocale, type Locale } from './index';

export default getRequestConfig(async ({ requestLocale }) => {
  // This will typically correspond to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !isSupportedLocale(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default
  };
});
