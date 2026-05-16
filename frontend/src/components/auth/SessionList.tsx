"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { authService } from "@/services/auth-service";
import { Monitor, Smartphone, Tablet, Globe, Clock, Shield, Trash2, AlertCircle } from "lucide-react";

interface Session {
  id: string;
  device_info: {
    browser?: string;
    os?: string;
    device_type?: string;
  };
  ip_address?: string;
  last_activity: string;
  expires_at: string;
  is_current?: boolean;
}

interface SessionListProps {
  onSessionRevoked?: () => void;
}

export default function SessionList({ onSessionRevoked }: SessionListProps) {
  const t = useTranslations("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await authService.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    if (!confirm(t("confirmRevoke"))) {
      return;
    }

    try {
      setRevokingId(sessionId);

      await authService.revokeSession(sessionId);

      // Remove from list
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (onSessionRevoked) {
        onSessionRevoked();
      }
    } catch (err) {
      console.error("Error revoking session:", err);
      alert(t("revokeError"));
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
      case "phone":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      case "desktop":
        return <Monitor className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getDeviceLabel = (session: Session) => {
    const { browser, os } = session.device_info || {};
    const parts = [browser, os].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : t("unknownDevice");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#20221f]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-[#ffd9d6] border border-[#7b1d17] text-[#7b1d17] p-4 rounded flex items-start gap-3"
        role="alert"
      >
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="grid gap-2">
          <p className="font-bold">{error}</p>
          <button
            onClick={loadSessions}
            className="text-sm font-bold underline hover:no-underline text-left"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-[#d8dccf] rounded bg-white/50">
        <Shield className="w-12 h-12 text-[#d8dccf] mx-auto mb-4" />
        <p className="text-[#5d6558] font-medium">{t("noSessions")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3" data-testid="session-list">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`status-row ${session.is_current ? 'border-2 border-[#20221f]' : ''}`}
          data-testid="session-item"
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded ${session.is_current ? 'bg-[#20221f] text-white' : 'bg-[#f7f7f2] text-[#5d6558]'}`}>
              {getDeviceIcon(session.device_info?.device_type)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-[#20221f] truncate">
                  {getDeviceLabel(session)}
                </h3>
                {session.is_current && (
                  <span className="status-pill status-ok text-[0.75rem] py-1 px-3 min-w-0">
                    {t("currentSession")}
                  </span>
                )}
              </div>

              <div className="grid sm:flex sm:gap-4 text-sm text-[#5d6558]">
                {session.ip_address && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{session.ip_address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(session.last_activity)}</span>
                </div>
              </div>
            </div>
          </div>

          {!session.is_current && (
            <button
              onClick={() => handleRevoke(session.id)}
              disabled={revokingId === session.id}
              className="button text-red-700 border-red-700 hover:bg-red-50 py-1.5 px-3 min-h-0 text-sm gap-2"
              data-testid="revoke-session-btn"
            >
              <Trash2 className="w-4 h-4" />
              <span>{revokingId === session.id ? t("revoking") : t("revoke")}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

