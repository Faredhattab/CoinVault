import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDirection, isSupportedLocale, type Locale, getMessages } from "@/i18n";
import { NextIntlClientProvider } from "next-intl";
import "./styles.css";

export const metadata: Metadata = {
  title: "CoinVault",
  description: "Local foundation for the CoinVault collection platform"
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const messages = getMessages(locale);

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
