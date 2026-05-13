import Link from "next/link";
import { getMessages, normalizeLocale } from "@/i18n";

export default async function PublicPlaceholder({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <main className="shell">
      <section className="panel" aria-labelledby="public-title">
        <p className="eyebrow">{messages.common.phase}</p>
        <h1 id="public-title">{messages.public.title}</h1>
        <p>{messages.public.description}</p>
        <nav className="actions" aria-label={messages.common.navigation}>
          <Link className="button secondary" href={`/${locale}/admin`}>
            {messages.public.adminLink}
          </Link>
          <Link className="button" href={`/${locale}/health`}>
            {messages.public.healthLink}
          </Link>
        </nav>
      </section>
    </main>
  );
}
