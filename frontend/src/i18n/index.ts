import ar from "./ar.json";
import en from "./en.json";

export type Locale = "en" | "ar";

export const supportedLocales: Locale[] = ["en", "ar"];

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function normalizeLocale(value: string): Locale {
  return isSupportedLocale(value) ? value : "en";
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getMessages(locale: Locale) {
  return locale === "ar" ? ar : en;
}
