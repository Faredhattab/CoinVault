from coinvault.api.health import HealthStatus, ServiceHealth, aggregate_status


def test_aggregate_status_ok_when_all_services_ok() -> None:
    services = {
        "web": ServiceHealth(status=HealthStatus.ok, message="ok"),
        "backend": ServiceHealth(status=HealthStatus.ok, message="ok"),
    }
    assert aggregate_status(services) == HealthStatus.ok


def test_aggregate_status_unavailable_when_any_service_unavailable() -> None:
    services = {
        "web": ServiceHealth(status=HealthStatus.ok, message="ok"),
        "database": ServiceHealth(status=HealthStatus.unavailable, message="down"),
    }
    assert aggregate_status(services) == HealthStatus.unavailable


def test_aggregate_status_degraded_when_no_service_unavailable() -> None:
    services = {
        "web": ServiceHealth(status=HealthStatus.ok, message="ok"),
        "backend": ServiceHealth(status=HealthStatus.degraded, message="missing config"),
    }
    assert aggregate_status(services) == HealthStatus.degraded
