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
      <div className="status-header">
        <p>
          <strong>{labels.aggregate}:</strong>{" "}
          <span className={statusClass(health.status)}>{labels[health.status]}</span>
        </p>
        <p className="status-timestamp">
          <small>Last checked: {checkedAt}</small>
        </p>
      </div>
      <ul className="status-list" aria-label={labels.aggregate}>
        {serviceOrder.map((service) => (
          <li className="status-row" key={service}>
            <div className="status-info">
              <strong className="status-name">{labels[service]}</strong>
              <div className="status-message">{health.services[service].message}</div>
            </div>
            <span className={statusClass(health.services[service].status)}>
              {labels[health.services[service].status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
