import { getTranslations } from "next-intl/server";
import SessionsPageClient from "./SessionsPageClient";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sessions" });

  return {
    title: t("title"),
  };
}

export default function SessionsPage() {
  return <SessionsPageClient />;
}
