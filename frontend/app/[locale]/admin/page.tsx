'use client'

import Link from "next/link";
import { getMessages, normalizeLocale } from "@/i18n";
import { UserCircle, Activity, Shield, LayoutDashboard, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { use } from "react";

export default function AdminPlaceholder({
  params: paramsPromise
}: {
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const locale = normalizeLocale(params.locale);
  const messages = getMessages(locale);
  const { user, loading } = useAuth();

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <p className="eyebrow">{messages.common.phase}</p>
        <div className="flex items-center gap-3 mt-2 mb-4">
          <h1 className="text-3xl font-bold text-[#20221f]">{messages.admin.title}</h1>
          <LayoutDashboard className="w-8 h-8 text-[#20221f]" />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 mb-4 text-[#5d6558] h-7">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm italic">Loading profile...</span>
          </div>
        ) : user ? (
          <p className="text-xl font-medium text-[#20221f] mb-4">
            {messages.admin.welcome.replace('{name}', user.display_name || user.email)}
          </p>
        ) : (
          <div className="h-7 mb-4" /> // Spacer to avoid layout shift
        )}

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
              <span className="text-sm text-[#5d6558]">{messages.admin.healthDesc}</span>
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
              <span className="text-sm text-[#5d6558]">{messages.admin.sessionsDesc}</span>
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/settings`}
          className="status-row hover:border-[#20221f] transition-colors group no-underline"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded bg-[#f7f7f2] text-[#5d6558] group-hover:bg-[#20221f] group-hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#20221f] block">{messages.admin.settingsLink}</span>
              <span className="text-sm text-[#5d6558]">{messages.admin.settingsDesc}</span>
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
