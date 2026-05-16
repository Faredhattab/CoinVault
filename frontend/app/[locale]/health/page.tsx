import { ServiceStatusList, type FoundationHealth } from "@/components/ServiceStatusList";
import { getMessages, normalizeLocale } from "@/i18n";
import { Activity } from "lucide-react";

async function getHealth(): Promise<FoundationHealth> {
  const fallback: FoundationHealth = {
    status: "unavailable",
    checked_at: new Date().toISOString(),
    services: {
      web: { status: "ok", message: "Frontend shell reachable" },
      backend: { status: "unavailable", message: "Backend health endpoint unavailable" },
      database: { status: "unavailable", message: "Not checked" },
      migrations: { status: "unavailable", message: "Not checked" },
      auth: { status: "unavailable", message: "Not checked" },
      admin: { status: "unavailable", message: "Not checked" },
      storage: { status: "unavailable", message: "Not checked" }
    }
  };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${baseUrl}/api/v1/health`, { cache: "no-store" });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as FoundationHealth;
  } catch {
    return fallback;
  }
}

export default async function HealthPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const messages = getMessages(locale);
  const health = await getHealth();

  return (
    <main className="shell">
      <div className="panel max-w-3xl">
        <header className="mb-6">
          <p className="eyebrow">{messages.common.phase}</p>
          <div className="flex items-center gap-3 mt-2 mb-4">
            <h1 className="text-3xl font-bold text-[#20221f]">{messages.health.title}</h1>
            <Activity className="w-8 h-8 text-[#20221f]" />
          </div>
          <p className="text-[#3e443b] max-w-prose">{messages.health.description}</p>
        </header>

        <ServiceStatusList health={health} labels={messages.health} />
      </div>
    </main>
  );
}
