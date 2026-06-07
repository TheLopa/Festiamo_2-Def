import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import {
  BarChart2, CheckSquare, Users, UserCheck,
  TrendingUp, ClipboardList, Calendar
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

  const [event,    setEvent]   = useState(null);
  const [kpi,      setKpi]     = useState(null);
  const [loading,  setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => { fetchAll(); }, [eventId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [
        { data: ev },
        { data: budgetCats },
        { data: tasks },
        { data: guests },
        { data: scenarios },
        { data: survey },
        { data: att },
      ] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).single(),
        supabase.from("budget_categories").select("*, budget_items(*)").eq("event_id", eventId),
        supabase.from("roadmap_tasks").select("id, status").eq("event_id", eventId),
        supabase.from("guests").select("id, confirmed").eq("event_id", eventId),
        supabase.from("scenarios").select("id, net_amount").eq("event_id", eventId).order("net_amount", { ascending: false }),
        supabase.from("survey_responses").select("id").eq("event_id", eventId),
        supabase.from("attendance").select("id").eq("event_id", eventId).eq("present", true),
      ]);

      let budgetTot = 0;
      (budgetCats || []).forEach(cat =>
        (cat.budget_items || []).forEach(item => { budgetTot += item.amount || 0; })
      );

      const fmt = n => new Intl.NumberFormat("it-IT", {
        style: "currency", currency: "EUR", maximumFractionDigits: 0
      }).format(n);

      setKpi({
        budgetStr:    fmt(budgetTot),
        tasksStr:     `${(tasks||[]).filter(t => t.status === "done").length}/${(tasks||[]).length}`,
        invitatiStr:  String((guests||[]).filter(g => g.confirmed).length),
        invitatiTot:  (guests||[]).length,
        presentiStr:  String((att||[]).length),
        nettoStr:     scenarios?.length ? fmt(scenarios[0].net_amount) : "—",
        nettoPos:     scenarios?.length ? scenarios[0].net_amount >= 0 : null,
        surveyStr:    String((survey||[]).length),
      });

      setEvent(ev);
      if (ev?.event_date) {
        const diff = Math.ceil((new Date(ev.event_date) - new Date()) / 86400000);
        setDaysLeft(diff);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"40vh" }}>
        <div style={{
          width:28, height:28, borderRadius:"50%",
          border:"3px solid var(--brand)", borderTopColor:"transparent",
          animation:"spin 0.7s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const preset = PRESETS[event?.preset] || PRESETS.altro;

  const countdownColor = daysLeft === null ? "var(--brand)"
    : daysLeft <= 7  ? "#ef4444"
    : daysLeft <= 30 ? "var(--warning)"
    : "var(--brand)";

  const countdownText = daysLeft === null ? "—"
    : daysLeft > 0   ? `${daysLeft} giorni`
    : daysLeft === 0 ? "Oggi! 🎉"
    : "Concluso";

  const countdownLabel = daysLeft > 0
    ? "Mancano all'evento"
    : daysLeft === 0 ? "È oggi!"
    : "Evento concluso";

  const sections = [
    {
      key:   "budget",
      label: t("budget"),
      Icon:  BarChart2,
      value: kpi?.budgetStr || "€0",
      sub:   "preventivato",
      color: "var(--success)",
      bg:    "var(--success-light)",
    },
    {
      key:   "roadmap",
      label: t("roadmap"),
      Icon:  CheckSquare,
      value: kpi?.tasksStr || "0/0",
      sub:   t("tasks_done"),
      color: "var(--warning)",
      bg:    "var(--warning-light)",
    },
    {
      key:   "invitati",
      label: t("guests"),
      Icon:  Users,
      value: kpi?.invitatiStr || "0",
      sub:   `confermati su ${kpi?.invitatiTot ?? 0}`,
      color: "var(--brand)",
      bg:    "var(--brand-light)",
    },
    {
      key:   "presenze",
      label: t("attendance"),
      Icon:  UserCheck,
      value: kpi?.presentiStr || "0",
      sub:   t("present"),
      color: "var(--success)",
      bg:    "var(--success-light)",
    },
    {
      key:   "scenari",
      label: t("scenarios"),
      Icon:  TrendingUp,
      value: kpi?.nettoStr || "—",
      sub:   "netto stimato",
      color: kpi?.nettoPos === false ? "#ef4444" : "var(--warning)",
      bg:    "var(--warning-light)",
    },
    {
      key:   "survey",
      label: t("survey"),
      Icon:  ClipboardList,
      value: kpi?.surveyStr || "0",
      sub:   "risposte",
      color: "var(--brand)",
      bg:    "var(--brand-light)",
    },
  ];

  return (
    <div>
      {/* Header evento: emoji + nome + data */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{
          width:44, height:44, borderRadius:14, flexShrink:0,
          background:"var(--bg-secondary)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22,
        }}>
          {preset.emoji}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{
            margin:0, fontSize:18, fontWeight:700,
            color:"var(--text-primary)",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {event?.name || "Evento"}
          </h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)", marginTop:2 }}>
            {event?.event_date
              ? new Date(event.event_date).toLocaleDateString("it-IT", {
                  day:"numeric", month:"long", year:"numeric"
                })
              : "Data non impostata"
            } · {preset.label}
          </p>
        </div>
      </div>

      {/* Countdown banner */}
      <div style={{
        borderRadius:16, padding:"14px 16px", marginBottom:16,
        background:"var(--brand-light)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {countdownLabel}
          </p>
          <p style={{
            margin:"4px 0 0", fontSize:26, fontWeight:800, lineHeight:1,
            color: countdownColor,
          }}>
            {countdownText}
          </p>
        </div>
        <Calendar size={30} style={{ color:"var(--brand)", opacity:0.3, flexShrink:0 }} />
      </div>

      {/* Avviso data mancante */}
      {!event?.event_date && (
        <div style={{
          borderRadius:12, padding:"10px 14px", marginBottom:16,
          background:"var(--warning-light)",
          color:"var(--warning)", fontSize:13,
        }}>
          ⚠️ Imposta la data dell'evento nelle Impostazioni
        </div>
      )}

      {/* Label sezione */}
      <p style={{
        margin:"0 0 10px", fontSize:10, fontWeight:600,
        letterSpacing:"0.1em", textTransform:"uppercase",
        color:"var(--text-tertiary)",
      }}>
        Panoramica
      </p>

      {/* Griglia KPI 2 colonne */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => navigate(`/eventi/${eventId}/${s.key}`)}
            onPointerDown={e  => e.currentTarget.style.transform = "scale(0.96)"}
            onPointerUp={e    => e.currentTarget.style.transform = "scale(1)"}
            onPointerLeave={e => e.currentTarget.style.transform = "scale(1)"}
            style={{
              background:"var(--bg-secondary)",
              border:"1px solid var(--border)",
              borderRadius:16, padding:"14px 14px 12px",
              textAlign:"left", cursor:"pointer",
              transition:"transform 0.1s",
              WebkitTapHighlightColor:"transparent",
            }}
          >
            <div style={{
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              width:34, height:34, borderRadius:10,
              background: s.bg, marginBottom:10,
            }}>
              <s.Icon size={17} style={{ color: s.color }} />
            </div>
            <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>{s.label}</p>
            <p style={{
              margin:"3px 0 0", fontSize:22, fontWeight:800, lineHeight:1,
              color:"var(--text-primary)", wordBreak:"break-all",
            }}>
              {s.value}
            </p>
            <p style={{ margin:"3px 0 0", fontSize:11, color:"var(--text-tertiary)", lineHeight:1.3 }}>
              {s.sub}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
