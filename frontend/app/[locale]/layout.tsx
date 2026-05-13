import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDirection, isSupportedLocale, type Locale } from "@/i18n";
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

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body>{children}</body>
    </html>
  );
}
