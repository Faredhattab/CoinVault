import { Globe, Server, Database, RefreshCw, Key, UserCheck, HardDrive, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

export type HealthStatus = "ok" | "degraded" | "unavailable";

export type ServiceHealth = {
  status: HealthStatus;
  latency_ms?: number;
  message: string;
};

export type FoundationHealth = {
  status: HealthStatus;
  checked_at: string;
  services: Record<
    "web" | "backend" | "database" | "migrations" | "auth" | "admin" | "storage",
    ServiceHealth
  >;
};

type HealthLabels = {
  aggregate: string;
  web: string;
  backend: string;
  database: string;
  migrations: string;
  auth: string;
  admin: string;
  storage: string;
  ok: string;
  degraded: string;
  unavailable: string;
};

const serviceOrder = [
  "web",
  "backend",
  "database",
  "migrations",
  "auth",
  "admin",
  "storage"
] as const;

function statusClass(status: HealthStatus) {
  return `status-pill status-${status}`;
}

const getServiceIcon = (service: string) => {
  switch (service) {
    case "web": return <Globe className="w-5 h-5" />;
    case "backend": return <Server className="w-5 h-5" />;
    case "database": return <Database className="w-5 h-5" />;
    case "migrations": return <RefreshCw className="w-5 h-5" />;
    case "auth": return <Key className="w-5 h-5" />;
    case "admin": return <UserCheck className="w-5 h-5" />;
    case "storage": return <HardDrive className="w-5 h-5" />;
    default: return null;
  }
};

const getStatusIcon = (status: HealthStatus) => {
  switch (status) {
    case "ok": return <CheckCircle2 className="w-4 h-4" />;
    case "degraded": return <AlertTriangle className="w-4 h-4" />;
    case "unavailable": return <XCircle className="w-4 h-4" />;
  }
};

export function ServiceStatusList({
  health,
  labels
}: {
  health: FoundationHealth;
  labels: HealthLabels;
}) {
  const checkedAt = new Date(health.checked_at).toLocaleString();

  return (
    <div className="status-container">
      <div className="status-header bg-white border border-[#d8dccf] rounded p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <strong className="text-[#20221f]">{labels.aggregate}:</strong>
          <span className={`${statusClass(health.status)} flex items-center gap-1.5`}>
            {getStatusIcon(health.status)}
            {labels[health.status]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#5d6558]">
          <Clock className="w-3.5 h-3.5" />
          <span>{checkedAt}</span>
        </div>
      </div>

      <ul className="status-list grid gap-3" aria-label={labels.aggregate}>
        {serviceOrder.map((service) => (
          <li className="status-row" key={service}>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded bg-[#f7f7f2] text-[#5d6558]">
                {getServiceIcon(service)}
              </div>
              <div className="status-info">
                <strong className="status-name text-[#20221f]">{labels[service]}</strong>
                <div className="status-message text-sm text-[#5d6558]">{health.services[service].message}</div>
              </div>
            </div>
            <span className={`${statusClass(health.services[service].status)} flex items-center gap-1.5`}>
              {getStatusIcon(health.services[service].status)}
              {labels[health.services[service].status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

