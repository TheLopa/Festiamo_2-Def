import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import {
  BarChart2, CheckSquare, Users, UserCheck,
  TrendingUp, ClipboardList, Settings, Calendar
} from "lucide-react";

const PRESETS = {
  compleanno: { label: "Compleanno",          emoji: "🎂" },
  laurea:     { label: "Laurea",              emoji: "🎓" },
  nubilato:   { label: "Addio al nubilato",   emoji: "💍" },
  aziendale:  { label: "Festa aziendale",     emoji: "🏢" },
  cena:       { label: "Cena privata",        emoji: "🍽️" },
  battesimo:  { label: "Battesimo/Comunione", emoji: "✝️" },
  altro:      { label: "Altro",               emoji: "🎉" },
};

export default function EventDashboard() {
  const { eventId } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();

  const [event, setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => { fetchEvent(); }, [eventId]);

  async function fetchEvent() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    setEvent(data);
    if (data?.event_date) {
      const diff = Math.ceil(
        (new Date(data.event_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      setDaysLeft(diff);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  const preset = PRESETS[event?.preset] || PRESETS.altro;

  const countdownLabel = daysLeft === null
    ? "—"
    : daysLeft > 0
    ? `${daysLeft} ${t("days_left")}`
    : daysLeft === 0
    ? t("today")
    : t("concluded");

  const sections = [
    {
      key: "budget",
      label: t("budget"),
      icon: BarChart2,
      value: "€0",
      sub: "preventivato",
      color: "var(--success)",
      bg: "var(--success-light)",
    },
    {
      key: "roadmap",
      label: t("roadmap"),
      icon: CheckSquare,
      value: "0/0",
      sub: t("tasks_done"),
      color: "var(--warning)",
      bg: "var(--warning-light)",
    },
    {
      key: "invitati",
      label: t("guests"),
      icon: Users,
      value: "0",
      sub: t("confirmed"),
      color: "var(--brand)",
      bg: "var(--brand-light)",
    },
    {
      key: "presenze",
      label: t("attendance"),
      icon: UserCheck,
      value: "0",
      sub: t("present"),
      color: "var(--success)",
      bg: "var(--success-light)",
    },
    {
      key: "scenari",
      label: t("scenarios"),
      icon: TrendingUp,
      value: "—",
      sub: "netto stimato",
      color: "var(--warning)",
      bg: "var(--warning-light)",
    },
    {
      key: "survey",
      label: t("survey"),
      icon: ClipboardList,
      value: "0",
      sub: "risposte",
      color: "var(--brand)",
      bg: "var(--brand-light)",
    },
  ];

  return (
    <div>
      {/* Header evento */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl flex-shrink-0"
          style={{ background: "var(--bg-secondary)" }}
        >
          {preset.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="text-xl font-bold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {event?.name || "Nuovo evento"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {event?.event_date
              ? new Date(event.event_date).toLocaleDateString("it-IT", {
                  day: "2-digit", month: "long", year: "numeric",
                })
              : "Data non impostata"} · {preset.label}
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div
        className="rounded-2xl p-4 mb-5 flex items-center justify-between"
        style={{ background: "var(--brand-light)" }}
      >
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: "var(--brand-text)" }}>
            {daysLeft > 0 ? "Mancano all'evento" : daysLeft === 0 ? "È oggi!" : "Evento concluso"}
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--brand-text)" }}>
            {countdownLabel}
          </p>
        </div>
        <Calendar size={36} style={{ color: "var(--brand)", opacity: 0.4 }} />
      </div>

      {/* Avvisi */}
      {!event?.event_date && (
        <div
          className="rounded-xl p-3 mb-4 flex items-center gap-2 text-sm"
          style={{ background: "var(--warning-light)", color: "var(--warning-text)" }}
        >
          ⚠️ Imposta la data dell'evento nelle Impostazioni
        </div>
      )}

      {/* KPI sezioni */}
      <p className="section-label">{t("overview")}</p>
      <div className="grid grid-cols-2 gap-3">
        {sections.map(s => (
          <button
            key={s.key}
            className="card text-left"
            onClick={() => navigate(`/eventi/${eventId}/${s.key}`)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl mb-3"
              style={{ background: s.bg }}
            >
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
              {s.label}
            </p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {s.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {s.sub}
            </p>
          </button>
        ))}
      </div>

      {/* Bottone impostazioni */}
      <button
        className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
        style={{
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          background: "none",
          cursor: "pointer",
        }}
        onClick={() => navigate(`/eventi/${eventId}/impostazioni`)}
      >
        <Settings size={16} /> {t("settings")}
      </button>
    </div>
  );
}
