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

  const eventTabs = [
    { key: "panoramica",   label: t("overview"),    path: null            },
    { key: "budget",       label: t("budget"),      path: "budget"        },
    { key: "roadmap",      label: t("roadmap"),     path: "roadmap"       },
    { key: "invitati",     label: t("guests"),      path: "invitati"      },
    { key: "presenze",     label: t("attendance"),  path: "presenze"      },
    { key: "scenari",      label: t("scenarios"),   path: "scenari"       },
    { key: "survey",       label: t("survey"),      path: "survey"        },
    { key: "impostazioni", label: t("settings"),    path: "impostazioni"  },
  ];

  function isActive(path) {
    if (!path) return location.pathname === `/eventi/${eventId}`;
    return location.pathname.endsWith(`/${path}`);
  }

  // Preset dell'evento per mostrare emoji (opzionale, solo se disponibile)
  // Se non vuoi passare i dati evento all'AppLayout lascia solo il titolo
  // dalla location state o dal DOM — per ora usiamo solo il path

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", display:"flex", flexDirection:"column" }}>

      {/* ── HEADER ── */}
      <header style={{
        position:"sticky", top:0, zIndex:40,
        background:"color-mix(in srgb, var(--bg-primary) 85%, transparent)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:"1px solid var(--border)",
      }}>
        <div style={{
          maxWidth:672, margin:"0 auto",
          padding: isEventPage ? "10px 16px 0" : "10px 16px",
        }}>

          {isEventPage ? (
            /* ── Navbar evento ── */
            <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:8 }}>
              {/* Back */}
              <button
                onClick={() => navigate("/eventi")}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  padding:"6px 6px 6px 2px", marginLeft:-4,
                  borderRadius:10, color:"var(--text-tertiary)",
                  display:"flex", alignItems:"center",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <ChevronLeft size={22} />
              </button>

              {/* Titolo + data */}
              <div style={{ flex:1, minWidth:0 }}>
                <h1 style={{
                  margin:0, fontSize:17, fontWeight:700, lineHeight:1.2,
                  color:"var(--text-primary)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>
                  {/* Il nome evento viene mostrato dall'EventDashboard nel contenuto,
                      qui mettiamo un placeholder generico che puoi sostituire
                      passando il nome via context o location.state */}
                  Evento
                </h1>
                <p style={{
                  margin:0, fontSize:12, color:"var(--text-tertiary)", lineHeight:1.2, marginTop:1,
                }}>
                  &nbsp;
                </p>
              </div>

              {/* Settings */}
              <button
                onClick={() => navigate(`/eventi/${eventId}/impostazioni`)}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  padding:6, borderRadius:10, color:"var(--text-tertiary)",
                  display:"flex", alignItems:"center",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <Settings size={20} />
              </button>
            </div>
          ) : (
            /* ── Navbar lista eventi ── */
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:32, height:32, borderRadius:10,
                  background:"var(--brand)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16,
                }}>
                  ✨
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>
                  Festiamo
                </span>
              </div>
              <button
                onClick={() => navigate("/eventi/impostazioni-profilo")}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  padding:6, borderRadius:10, color:"var(--text-tertiary)",
                  display:"flex", alignItems:"center",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <Settings size={20} />
              </button>
            </div>
          )}

          {/* ── Tab bar evento (scrollabile) ── */}
          {isEventPage && (
            <div style={{
              display:"flex", overflowX:"auto", scrollbarWidth:"none",
              gap:0, marginLeft:-16, marginRight:-16, paddingLeft:16, paddingRight:16,
            }}>
              {eventTabs.map(tab => {
                const active = isActive(tab.path);
                return (
                  <button
                    key={tab.key}
                    onClick={() =>
                      tab.path === null
                        ? navigate(`/eventi/${eventId}`)
                        : navigate(`/eventi/${eventId}/${tab.path}`)
                    }
                    style={{
                      flexShrink:0,
                      background:"none", border:"none", cursor:"pointer",
                      padding:"8px 12px",
                      fontSize:13, fontWeight: active ? 600 : 400,
                      whiteSpace:"nowrap",
                      color: active ? "var(--brand)" : "var(--text-tertiary)",
                      borderBottom: active
                        ? "2px solid var(--brand)"
                        : "2px solid transparent",
                      transition:"color 0.15s, border-color 0.15s",
                      WebkitTapHighlightColor:"transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENUTO ── */}
      <main style={{
        flex:1,
        maxWidth:672, margin:"0 auto", width:"100%",
        padding:"20px 16px 96px",
      }}>
        <Outlet />
      </main>

      {/* ── BOTTOM NAV (solo lista eventi) ── */}
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
