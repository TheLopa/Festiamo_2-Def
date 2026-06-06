import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { Plus, ChevronRight } from "lucide-react";

const PRESETS = {
  compleanno: { label: "Compleanno",          emoji: "🎂" },
  laurea:     { label: "Laurea",              emoji: "🎓" },
  nubilato:   { label: "Addio al nubilato",   emoji: "💍" },
  aziendale:  { label: "Festa aziendale",     emoji: "🏢" },
  cena:       { label: "Cena privata",        emoji: "🍽️" },
  battesimo:  { label: "Battesimo/Comunione", emoji: "✝️" },
  altro:      { label: "Altro",               emoji: "🎉" },
};

export default function EventsList() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  }

  const active = events.filter(e => e.paid && e.event_date && new Date(e.event_date) >= new Date());
  const past   = events.filter(e => e.paid && e.event_date && new Date(e.event_date) < new Date());
  const drafts = events.filter(e => !e.paid);
  const noDate = events.filter(e => e.paid && !e.event_date);

  // Nome utente — prende il first name dal profilo o dalla email
  const firstName = profile?.full_name?.trim().split(" ")[0]
    || user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "ciao";

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 0" }}>
        <p style={{ color:"var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"var(--text-primary)", margin:"0 0 4px", letterSpacing:"-0.02em" }}>
            {t("greeting")}, {firstName} 👋
          </h1>
          <p style={{ fontSize:13, color:"var(--text-secondary)", margin:0 }}>
            {active.length} {t("events_active")} · {past.length} {t("events_done")}
          </p>
        </div>
        <button
          onClick={signOut}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--text-tertiary)", padding:"4px 8px" }}
        >
          {t("logout")}
        </button>
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div style={{
          textAlign:"center", padding:"48px 16px",
          border:"1px dashed var(--border-strong)",
          borderRadius:16,
          marginBottom:16,
        }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
          <p style={{ fontSize:16, fontWeight:600, color:"var(--text-primary)", margin:"0 0 6px" }}>{t("no_events")}</p>
          <p style={{ fontSize:14, color:"var(--text-secondary)", margin:"0 0 20px" }}>{t("no_events_sub")}</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> {t("new_event")}
          </button>
        </div>
      )}

      {/* In corso */}
      {active.length > 0 && (
        <>
          <p className="section-label">{t("section_ongoing")}</p>
          {active.map(ev => <EventCard key={ev.id} event={ev} onClick={() => navigate(`/eventi/${ev.id}`)} t={t} />)}
        </>
      )}

      {/* Senza data */}
      {noDate.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop:20 }}>Da configurare</p>
          {noDate.map(ev => <EventCard key={ev.id} event={ev} onClick={() => navigate(`/eventi/${ev.id}`)} t={t} />)}
        </>
      )}

      {/* Bozze */}
      {drafts.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop:20 }}>{t("status_draft")}</p>
          {drafts.map(ev => <EventCard key={ev.id} event={ev} onClick={() => navigate(`/eventi/${ev.id}`)} t={t} />)}
        </>
      )}

      {/* Conclusi */}
      {past.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop:20 }}>{t("section_past")}</p>
          {past.map(ev => <EventCard key={ev.id} event={ev} onClick={() => navigate(`/eventi/${ev.id}`)} t={t} />)}
        </>
      )}

      {/* Bottone nuovo evento */}
      {events.length > 0 && (
        <button
          onClick={() => setShowModal(true)}
          style={{
            width:"100%", marginTop:12, padding:"14px",
            borderRadius:14, fontSize:14, fontWeight:500,
            border:"1.5px dashed var(--border-strong)",
            color:"var(--text-secondary)", background:"none",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}
        >
          <Plus size={16} /> {t("new_event")}
        </button>
      )}

      {/* Modal acquisto */}
      {showModal && <PurchaseModal onClose={() => setShowModal(false)} t={t} />}
    </div>
  );
}

// ── Card evento ──────────────────────────────────────────────
function EventCard({ event, onClick, t }) {
  const preset  = PRESETS[event.preset] || PRESETS.altro;
  const isPast  = event.event_date && new Date(event.event_date) < new Date();
  const noDate  = !event.event_date;

  const statusLabel = !event.paid ? t("status_draft")
    : isPast ? t("status_past")
    : noDate ? "Da configurare"
    : t("status_active");

  const statusStyle = !event.paid
    ? { background:"var(--warning-light)", color:"var(--warning-text)" }
    : isPast
    ? { background:"var(--bg-tertiary)", color:"var(--text-tertiary)" }
    : noDate
    ? { background:"var(--warning-light)", color:"var(--warning-text)" }
    : { background:"var(--success-light)", color:"var(--success-text)" };

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString("it-IT", { day:"2-digit", month:"short", year:"numeric" })
    : "Data non impostata";

  return (
    <div
      onClick={onClick}
      style={{
        background:"var(--bg-primary)",
        border:"1px solid var(--border)",
        borderRadius:16,
        marginBottom:10,
        cursor:"pointer",
        overflow:"hidden",
      }}
    >
      {/* Header card */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 14px 10px" }}>
        <div style={{
          width:44, height:44, borderRadius:12,
          background:"var(--bg-secondary)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, flexShrink:0,
        }}>
          {preset.emoji}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <p style={{ fontSize:15, fontWeight:600, color:"var(--text-primary)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {event.name}
            </p>
            <span style={{ ...statusStyle, fontSize:11, padding:"2px 8px", borderRadius:20, flexShrink:0, fontWeight:500 }}>
              {statusLabel}
            </span>
          </div>
          <p style={{ fontSize:12, color:"var(--text-tertiary)", margin:"2px 0 0" }}>
            {dateStr} · {event.planned_guests} ospiti · {preset.label}
          </p>
        </div>
        <ChevronRight size={16} style={{ color:"var(--text-tertiary)", flexShrink:0 }} />
      </div>

      {/* KPI */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        borderTop:"1px solid var(--border)",
      }}>
        {[
          { label: t("kpi_budget"),    value: "€0"  },
          { label: t("kpi_confirmed"), value: "0"   },
          { label: t("kpi_roadmap"),   value: "0/0" },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding:"10px 8px",
            textAlign:"center",
            borderRight: i < 2 ? "1px solid var(--border)" : "none",
            background:"var(--bg-secondary)",
          }}>
            <p style={{ fontSize:11, color:"var(--text-tertiary)", margin:"0 0 2px" }}>{kpi.label}</p>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0 }}>{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Modal acquisto ───────────────────────────────────────────
function PurchaseModal({ onClose, t }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const features = [
    "Budget con voci fisse e formule",
    "Roadmap con task e scadenze",
    "Lista invitati + upload Excel",
    "Check-in presenze il giorno dell'evento",
    "Survey con link condivisibile",
    "Simulatore scenari costo/guadagno",
  ];

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Sessione scaduta. Effettua di nuovo il login.");
        setLoading(false);
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            success_url: `${window.location.origin}/acquisto/successo?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${window.location.origin}/eventi`,
          }),
        }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t("error_generic"));
        setLoading(false);
      }
    } catch {
      setError(t("error_generic"));
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 style={{ fontSize:20, fontWeight:700, margin:"0 0 4px", color:"var(--text-primary)" }}>
          {t("new_event_title")}
        </h2>
        <p style={{ fontSize:14, color:"var(--text-secondary)", margin:"0 0 20px" }}>
          {t("new_event_sub")}
        </p>

        {/* Riepilogo prezzo */}
        <div style={{ background:"var(--bg-secondary)", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:14, color:"var(--text-secondary)" }}>{t("access_event")}</span>
            <span style={{ fontSize:14, fontWeight:500, color:"var(--text-primary)" }}>€2,99</span>
          </div>
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:15, fontWeight:600, color:"var(--text-primary)" }}>{t("total_label")}</span>
            <span style={{ fontSize:24, fontWeight:700, color:"var(--text-primary)" }}>€2,99</span>
          </div>
        </div>

        {/* Features */}
        <ul style={{ margin:"0 0 20px", padding:0, listStyle:"none" }}>
          {features.map(f => (
            <li key={f} style={{ display:"flex", gap:8, fontSize:13, color:"var(--text-secondary)", marginBottom:8 }}>
              <span style={{ color:"var(--success)", fontWeight:700 }}>✓</span> {f}
            </li>
          ))}
        </ul>

        {error && (
          <div style={{ background:"var(--danger-light)", color:"var(--danger-text)", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:12 }}>
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width:"100%", justifyContent:"center", padding:"13px", fontSize:15, borderRadius:12, marginBottom:10, opacity: loading ? 0.7 : 1 }}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "Reindirizzamento..." : `🔒 ${t("proceed_payment")} · €2,99`}
        </button>
        <button
          className="btn-secondary"
          style={{ width:"100%", padding:"11px", fontSize:14, borderRadius:12 }}
          onClick={onClose}
          disabled={loading}
        >
          {t("cancel")}
        </button>
        <p style={{ textAlign:"center", fontSize:12, color:"var(--text-tertiary)", marginTop:12 }}>
          {t("secure_stripe")}
        </p>
      </div>
    </div>
  );
}
