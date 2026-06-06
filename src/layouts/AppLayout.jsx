import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import {
  Home, Settings, ChevronLeft,
  BarChart2, CheckSquare, Users, UserCheck,
  TrendingUp, ClipboardList
} from "lucide-react";

export default function AppLayout() {
  const { eventId } = useParams();
  const { user }    = useAuth();
  const { t }       = useLang();
  const navigate    = useNavigate();
  const location    = useLocation();

  const isEventPage = !!eventId;

  // Tab bar sezioni evento
  const eventTabs = [
    { key: "budget",       label: t("budget"),     icon: BarChart2,    path: "budget"       },
    { key: "roadmap",      label: t("roadmap"),     icon: CheckSquare,  path: "roadmap"      },
    { key: "invitati",     label: t("guests"),      icon: Users,        path: "invitati"     },
    { key: "presenze",     label: t("attendance"),  icon: UserCheck,    path: "presenze"     },
    { key: "scenari",      label: t("scenarios"),   icon: TrendingUp,   path: "scenari"      },
    { key: "survey",       label: t("survey"),      icon: ClipboardList, path: "survey"      },
    { key: "impostazioni", label: t("settings"),    icon: Settings,     path: "impostazioni" },
  ];

  function isActive(path) {
    return location.pathname.endsWith(`/${path}`);
  }

  function isOverview() {
    return location.pathname === `/eventi/${eventId}`;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ── HEADER ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg-primary) 80%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          {isEventPage ? (
            <button
              className="btn-ghost"
              onClick={() => navigate("/eventi")}
              aria-label={t("nav_back")}
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "var(--brand)" }}
              >
                <span style={{ fontSize: 16 }}>✨</span>
              </div>
              <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Festiamo
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isEventPage && (
              <button
                className="btn-ghost"
                onClick={() => navigate("/eventi/impostazioni-profilo")}
                aria-label={t("nav_settings")}
              >
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Tab bar sezioni evento */}
        {isEventPage && (
          <div className="tab-bar px-4 max-w-2xl mx-auto">
            <button
              className={`tab-item ${isOverview() ? "active" : ""}`}
              onClick={() => navigate(`/eventi/${eventId}`)}
            >
              {t("overview")}
            </button>
            {eventTabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-item ${isActive(tab.path) ? "active" : ""}`}
                onClick={() => navigate(`/eventi/${eventId}/${tab.path}`)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── CONTENUTO ──────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* ── BOTTOM NAV (solo lista eventi) ─────────────── */}
      {!isEventPage && (
        <nav className="bottom-nav">
          <button
            className={`bottom-nav-item ${location.pathname === "/eventi" ? "active" : ""}`}
            onClick={() => navigate("/eventi")}
          >
            <Home size={22} />
            <span>{t("nav_events")}</span>
          </button>
          <button
            className={`bottom-nav-item ${location.pathname === "/profilo" ? "active" : ""}`}
            onClick={() => navigate("/profilo")}
          >
            <Settings size={22} />
            <span>{t("nav_settings")}</span>
          </button>
        </nav>
      )}
    </div>
  );
}
