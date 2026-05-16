import Link from "next/link";
import { getMessages, normalizeLocale } from "@/i18n";
import { UserCircle, Activity, Shield, LayoutDashboard } from "lucide-react";

export default async function AdminPlaceholder({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <p className="eyebrow">{messages.common.phase}</p>
        <div className="flex items-center gap-3 mt-2 mb-4">
          <h1 className="text-3xl font-bold text-[#20221f]">{messages.admin.title}</h1>
          <LayoutDashboard className="w-8 h-8 text-[#20221f]" />
        </div>
        <p className="text-[#3e443b] max-w-prose">{messages.admin.description}</p>
      </header>

      <nav className="grid gap-3" aria-label={messages.common.navigation}>
        <Link
          href={`/${locale}/health`}
          className="status-row hover:border-[#20221f] transition-colors group no-underline"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded bg-[#f7f7f2] text-[#5d6558] group-hover:bg-[#20221f] group-hover:text-white transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#20221f] block">{messages.admin.healthLink}</span>
              <span className="text-sm text-[#5d6558]">Check system core foundations</span>
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/sessions`}
          className="status-row hover:border-[#20221f] transition-colors group no-underline"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded bg-[#f7f7f2] text-[#5d6558] group-hover:bg-[#20221f] group-hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#20221f] block">{messages.admin.sessionsLink}</span>
              <span className="text-sm text-[#5d6558]">Manage active login points</span>
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}`}
          className="button secondary mt-4 justify-start gap-2"
        >
          <UserCircle className="w-5 h-5" />
          <span>{messages.admin.publicLink}</span>
        </Link>
      </nav>
    </div>
  );
}
