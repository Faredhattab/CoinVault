import Link from "next/link";
import { getMessages, normalizeLocale } from "@/i18n";

export default async function AdminPlaceholder({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <main className="shell">
      <section className="panel" aria-labelledby="admin-title">
        <p className="eyebrow">{messages.common.phase}</p>
        <h1 id="admin-title">{messages.admin.title}</h1>
        <p>{messages.admin.description}</p>
        <nav className="actions" aria-label={messages.common.navigation}>
          <Link className="button secondary" href={`/${locale}`}>
            {messages.admin.publicLink}
          </Link>
          <Link className="button" href={`/${locale}/health`}>
            {messages.admin.healthLink}
          </Link>
        </nav>
      </section>
    </main>
  );
}
