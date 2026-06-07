import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import {
  BarChart2, CheckSquare, Users, UserCheck,
  TrendingUp, ClipboardList, Calendar, ChevronLeft, Settings
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

const TABS = [
  { key: "panoramica", label: "Panoramica" },
  { key: "budget",     label: "Budget"     },
  { key: "roadmap",    label: "Roadmap"    },
  { key: "invitati",   label: "Invitati"   },
  { key: "presenze",   label: "Presenze"   },
  { key: "scenari",    label: "Scenari"    },
  { key: "survey",     label: "Survey"     },
  { key: "impostazioni", label: "Impostazioni" },
];

export default function EventDashboard() {
  const { eventId } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();

  const [event,   setEvent]   = useState(null);
  const [kpi,     setKpi]     = useState(null);
  const [loading, setLoading] = useState(true);
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

      // Budget preventivato
      let budgetTot = 0;
      (budgetCats || []).forEach(cat =>
        (cat.budget_items || []).forEach(item => { budgetTot += item.amount || 0; })
      );

      const fmt = n => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

      setKpi({
        budgetStr:   fmt(budgetTot),
        tasksStr:    `${(tasks||[]).filter(t=>t.status==="done").length}/${(tasks||[]).length}`,
        invitatiStr: String((guests||[]).filter(g=>g.confirmed).length),
        invitatiTot: (guests||[]).length,
        presentiStr: String((att||[]).length),
        nettoStr:    scenarios?.length ? fmt(scenarios[0].net_amount) : "—",
        nettoPositivo: scenarios?.length ? scenarios[0].net_amount >= 0 : null,
        surveyStr:   String((survey||[]).length),
      });

      setEvent(ev);
      if (ev?.event_date) {
        const diff = Math.ceil((new Date(ev.event_date) - new Date()) / 86400000);
        setDaysLeft(diff);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div style={{
          width:32, height:32, borderRadius:"50%",
          border:"3px solid var(--brand)", borderTopColor:"transparent",
          animation:"spin 0.7s linear infinite"
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const preset = PRESETS[event?.preset] || PRESETS.altro;

  const countdownColor = daysLeft === null ? "var(--brand)"
    : daysLeft <= 7  ? "var(--danger, #ef4444)"
    : daysLeft <= 30 ? "var(--warning)"
    : "var(--brand)";

  const countdownText = daysLeft === null ? "—"
    : daysLeft > 0  ? `${daysLeft} giorni`
    : daysLeft === 0 ? "Oggi! 🎉"
    : "Concluso";

  const sections = [
    {
      key:   "budget",
      label: t("budget"),
      Icon:  BarChart2,
      value: kpi?.budgetStr  || "€0",
      sub:   "preventivato",
      color: "var(--success)",
      bg:    "var(--success-light)",
    },
    {
      key:   "roadmap",
      label: t("roadmap"),
      Icon:  CheckSquare,
      value: kpi?.tasksStr   || "0/0",
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
      value: kpi?.nettoStr   || "—",
      sub:   "netto stimato",
      color: kpi?.nettoPositivo === false ? "var(--danger, #ef4444)" : "var(--warning)",
      bg:    "var(--warning-light)",
    },
    {
      key:   "survey",
      label: t("survey"),
      Icon:  ClipboardList,
      value: kpi?.surveyStr  || "0",
      sub:   "risposte",
      color: "var(--brand)",
      bg:    "var(--brand-light)",
    },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", display:"flex", flexDirection:"column" }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        position:"sticky", top:0, zIndex:20,
        background:"var(--bg-primary)",
        borderBottom:"1px solid var(--border)",
        backdropFilter:"blur(12px)",
      }}>
        {/* Navbar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px 8px" }}>
          <button
            onClick={() => navigate("/eventi")}
            style={{
              background:"none", border:"none", cursor:"pointer",
              padding:8, marginLeft:-8, borderRadius:10,
              color:"var(--text-tertiary)", display:"flex", alignItems:"center",
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:18 }}>{preset.emoji}</span>
              <h1 style={{
                margin:0, fontSize:17, fontWeight:700,
                color:"var(--text-primary)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {event?.name || "Evento"}
              </h1>
            </div>
            {event?.event_date && (
              <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)", marginTop:1 }}>
                {new Date(event.event_date).toLocaleDateString("it-IT", {
                  day:"numeric", month:"long", year:"numeric"
                })} · {preset.label}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(`/eventi/${eventId}/impostazioni`)}
            style={{
              background:"none", border:"none", cursor:"pointer",
              padding:8, borderRadius:10,
              color:"var(--text-tertiary)", display:"flex", alignItems:"center",
            }}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Tab bar scrollabile */}
        <div style={{
          display:"flex", overflowX:"auto", padding:"0 16px",
          gap:4, scrollbarWidth:"none",
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => tab.key !== "panoramica" && navigate(`/eventi/${eventId}/${tab.key}`)}
              style={{
                flexShrink:0, padding:"8px 12px",
                background:"none", border:"none", cursor:"pointer",
                fontSize:13, fontWeight:500, whiteSpace:"nowrap",
                borderBottom: tab.key === "panoramica"
                  ? "2px solid var(--brand)"
                  : "2px solid transparent",
                color: tab.key === "panoramica"
                  ? "var(--brand)"
                  : "var(--text-tertiary)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenuto ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 32px" }}>

        {/* Countdown banner */}
        <div style={{
          borderRadius:16, padding:"14px 16px",
          background:"var(--brand-light)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:20,
        }}>
          <div>
            <p style={{ margin:0, fontSize:12, color:"var(--brand-text, var(--text-tertiary))" }}>
              {daysLeft > 0 ? "Mancano all'evento" : daysLeft === 0 ? "È oggi!" : "Evento concluso"}
            </p>
            <p style={{
              margin:"4px 0 0", fontSize:28, fontWeight:800, lineHeight:1,
              color: countdownColor,
            }}>
              {countdownText}
            </p>
          </div>
          <Calendar size={32} style={{ color:"var(--brand)", opacity:0.35, flexShrink:0 }} />
        </div>

        {/* Avviso data mancante */}
        {!event?.event_date && (
          <div style={{
            borderRadius:12, padding:"10px 14px", marginBottom:16,
            background:"var(--warning-light)", color:"var(--warning-text, var(--warning))",
            fontSize:13,
          }}>
            ⚠️ Imposta la data dell'evento nelle Impostazioni
          </div>
        )}

        {/* Label */}
        <p style={{
          margin:"0 0 10px", fontSize:10, fontWeight:600,
          letterSpacing:"0.1em", textTransform:"uppercase",
          color:"var(--text-tertiary)",
        }}>
          Panoramica
        </p>

        {/* Griglia KPI 2 colonne */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:12,
        }}>
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => navigate(`/eventi/${eventId}/${s.key}`)}
              style={{
                background:"var(--bg-secondary)",
                border:"1px solid var(--border)",
                borderRadius:16, padding:"14px 14px 12px",
                textAlign:"left", cursor:"pointer",
                transition:"transform 0.1s",
                WebkitTapHighlightColor:"transparent",
              }}
              onPointerDown={e => e.currentTarget.style.transform="scale(0.96)"}
              onPointerUp={e   => e.currentTarget.style.transform="scale(1)"}
              onPointerLeave={e => e.currentTarget.style.transform="scale(1)"}
            >
              {/* Icona */}
              <div style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width:36, height:36, borderRadius:10,
                background: s.bg, marginBottom:10,
              }}>
                <s.Icon size={18} style={{ color: s.color }} />
              </div>
              {/* Label */}
              <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>{s.label}</p>
              {/* Valore */}
              <p style={{
                margin:"3px 0 0", fontSize:22, fontWeight:800, lineHeight:1,
                color:"var(--text-primary)", wordBreak:"break-all",
              }}>
                {s.value}
              </p>
              {/* Sub */}
              <p style={{ margin:"3px 0 0", fontSize:11, color:"var(--text-tertiary)", lineHeight:1.3 }}>
                {s.sub}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
