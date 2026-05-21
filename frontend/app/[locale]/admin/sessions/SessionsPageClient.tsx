"use client";

import { useTranslations } from "next-intl";
import SessionList from "@/components/auth/SessionList";
import { ShieldCheck, Info } from "lucide-react";

export default function SessionsPageClient() {
  const t = useTranslations("sessions");

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <p className="eyebrow">{t("phase") || "Security & Access"}</p>
        <div className="flex items-center gap-3 mt-2 mb-4">
          <h1 className="text-3xl font-bold text-[#20221f]">{t("title")}</h1>
          <ShieldCheck className="w-8 h-8 text-[#20221f]" />
        </div>
        <p className="text-[#3e443b] max-w-prose">{t("description")}</p>
      </header>

      <section
        className="bg-[#f7f7f2] border border-[#d8dccf] rounded p-4 mb-6 flex items-start gap-3"
        aria-labelledby="info-heading"
      >
        <div className="bg-[#20221f] text-white p-1.5 rounded flex-shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-sm">
          <h2 id="info-heading" className="font-bold text-[#20221f] mb-2 uppercase tracking-wider text-xs">
            {t("infoTitle")}
          </h2>
          <ul className="grid gap-2 text-[#5d6558] list-none p-0 m-0">
            <li className="flex items-center gap-2 before:content-['•'] before:text-[#20221f] before:font-bold">
              {t("maxSessions")}
            </li>
            <li className="flex items-center gap-2 before:content-['•'] before:text-[#20221f] before:font-bold">
              {t("sessionTimeout")}
            </li>
            <li className="flex items-center gap-2 before:content-['•'] before:text-[#20221f] before:font-bold">
              {t("cannotRevokeCurrent")}
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="active-sessions-heading">
        <h2 id="active-sessions-heading" className="eyebrow mb-4">
          {t("activeSessionsHeader") || "Active Access Points"}
        </h2>
        <SessionList />
      </section>
    </div>
  );
}
