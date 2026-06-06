import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { Plus, ChevronRight, Calendar, Users, BarChart2 } from "lucide-react";

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

  const active = events.filter(e => e.paid && new Date(e.event_date) >= new Date());
  const past   = events.filter(e => e.paid && new Date(e.event_date) < new Date());
  const drafts = events.filter(e => !e.paid);

  const firstName = profile?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "ciao";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t("greeting")}, {firstName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {active.length} {t("events_active")} · {past.length} {t("events_done")}
          </p>
        </div>
        <button
          className="btn-ghost text-sm"
          onClick={signOut}
          style={{ color: "var(--text-tertiary)" }}
        >
          {t("logout")}
        </button>
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <span style={{ fontSize: "24px" }}>🎉</span>
          </div>
          <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            {t("no_events")}
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {t("no_events_sub")}
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> {t("new_event")}
          </button>
        </div>
      )}

      {/* Sezione: In corso */}
      {active.length > 0 && (
        <>
          <p className="section-label">{t("section_ongoing")}</p>
          {active.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={() => navigate(`/eventi/${ev.id}`)}
              t={t}
            />
          ))}
        </>
      )}

      {/* Sezione: Bozze */}
      {drafts.length > 0 && (
        <>
          <p className="section-label mt-5">{t("status_draft")}</p>
          {drafts.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={() => navigate(`/eventi/${ev.id}`)}
              t={t}
            />
          ))}
        </>
      )}

      {/* Sezione: Conclusi */}
      {past.length > 0 && (
        <>
          <p className="section-label mt-5">{t("section_past")}</p>
          {past.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={() => navigate(`/eventi/${ev.id}`)}
              t={t}
            />
          ))}
        </>
      )}

      {/* Bottone nuovo evento */}
      {events.length > 0 && (
        <button
          className="w-full mt-4 py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
          style={{
            border: "1.5px dashed var(--border-strong)",
            color: "var(--text-secondary)",
            background: "none",
            cursor: "pointer",
          }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> {t("new_event")}
        </button>
      )}

      {/* Modal acquisto */}
      {showModal && (
        <PurchaseModal onClose={() => setShowModal(false)} t={t} />
      )}
    </div>
  );
}

// ── Card evento ──────────────────────────────────────────────
function EventCard({ event, onClick, t }) {
  const preset = PRESETS[event.preset] || PRESETS.altro;
  const isPast = new Date(event.event_date) < new Date();

  const statusLabel = !event.paid
    ? t("status_draft")
    : isPast
    ? t("status_past")
    : t("status_active");

  const statusClass = !event.paid
    ? "pill-warning"
    : isPast
    ? "pill-neutral"
    : "pill-success";

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString("it-IT", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div
      className="card mb-3 cursor-pointer"
      onClick={onClick}
      style={{ transition: "border-color 0.15s" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl flex-shrink-0"
          style={{ background: "var(--bg-secondary)" }}
        >
          {preset.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-semibold text-base truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {event.name}
            </p>
            <span className={`status-pill ${statusClass} flex-shrink-0`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {dateStr} · {event.planned_guests} ospiti · {preset.label}
          </p>
        </div>
        <ChevronRight
          size={18}
          style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
        />
      </div>

      {/* Mini KPI */}
      <div
        className="grid grid-cols-3 rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {[
          { label: t("kpi_budget"),    value: "€0"  },
          { label: t("kpi_confirmed"), value: "0"   },
          { label: t("kpi_roadmap"),   value: "0/0" },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex flex-col items-center py-2 px-1"
            style={{
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
              background: "var(--bg-secondary)",
            }}
          >
            <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
              {kpi.label}
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {kpi.value}
            </p>
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
    } catch (err) {
      setError(t("error_generic"));
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {t("new_event_title")}
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          {t("new_event_sub")}
        </p>

        {/* Riepilogo prezzo */}
        <div className="card-secondary mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("access_event")}
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              €2,99
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("vat_included")}
            </span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              —
            </span>
          </div>
          <div
            className="flex justify-between items-center pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("total_label")}
            </span>
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              €2,99
            </span>
          </div>
        </div>

        {/* Feature list */}
        <ul className="space-y-2 mb-5">
          {features.map(f => (
            <li
              key={f}
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--success)", fontWeight: 600 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <div
            className="rounded-lg p-3 mb-4 text-sm"
            style={{
              background: "var(--danger-light)",
              color: "var(--danger-text)",
            }}
          >
            {error}
          </div>
        )}

        <button
          className="btn-primary w-full mb-3 py-3 text-base"
          onClick={handleCheckout}
          disabled={loading}
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading
            ? "Reindirizzamento..."
            : `🔒 ${t("proceed_payment")} · €2,99`}
        </button>
        <button
          className="btn-secondary w-full py-2.5"
          onClick={onClose}
          disabled={loading}
        >
          {t("cancel")}
        </button>
        <p
          className="text-center text-xs mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          {t("secure_stripe")}
        </p>
      </div>
    </div>
  );
}
