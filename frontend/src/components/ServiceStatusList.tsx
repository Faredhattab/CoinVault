export type HealthStatus = "ok" | "degraded" | "unavailable";

export type ServiceHealth = {
  status: HealthStatus;
  latency_ms?: number;
  message: string;
};

export type FoundationHealth = {
  status: HealthStatus;
  checked_at: string;
  services: Record<"web" | "backend" | "database" | "auth" | "storage", ServiceHealth>;
};

type HealthLabels = {
  aggregate: string;
  web: string;
  backend: string;
  database: string;
  auth: string;
  storage: string;
  ok: string;
  degraded: string;
  unavailable: string;
};

const serviceOrder = ["web", "backend", "database", "auth", "storage"] as const;

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
  return (
    <div>
      <p>
        <strong>{labels.aggregate}:</strong>{" "}
        <span className={statusClass(health.status)}>{labels[health.status]}</span>
      </p>
      <ul className="status-list" aria-label={labels.aggregate}>
        {serviceOrder.map((service) => (
          <li className="status-row" key={service}>
            <span>
              <strong>{labels[service]}</strong>
              <br />
              {health.services[service].message}
            </span>
            <span className={statusClass(health.services[service].status)}>
              {labels[health.services[service].status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
