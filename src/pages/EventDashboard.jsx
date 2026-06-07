import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [kpi, setKpi] = useState({
    budgetPreventivato: 0,
    roadmapCompletati: 0,
    roadmapTotali: 0,
    invitatiConfermati: 0,
    invitatiTotali: 0,
    presenti: 0,
    scenarioNettoMigliore: null,
    surveyRisposte: 0,
  });
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [
          { data: ev },
          { data: budgetCats },
          { data: tasks },
          { data: guests },
          { data: scenarios },
          { data: survey },
        ] = await Promise.all([
          supabase.from("events").select("*").eq("id", id).single(),
          supabase.from("budget_categories").select("*, budget_items(*)").eq("event_id", id),
          supabase.from("roadmap_tasks").select("id, status").eq("event_id", id),
          supabase.from("guests").select("id, confirmed").eq("event_id", id),
          supabase.from("scenarios").select("id, net_amount").eq("event_id", id).order("net_amount", { ascending: false }),
          supabase.from("survey_responses").select("id").eq("event_id", id),
        ]);

        // Budget preventivato
        let budgetTot = 0;
        (budgetCats || []).forEach((cat) => {
          (cat.budget_items || []).forEach((item) => {
            budgetTot += item.amount || 0;
          });
        });

        // Tasks
        const totTasks = (tasks || []).length;
        const doneTasks = (tasks || []).filter((t) => t.status === "done").length;

        // Guests
        const totGuests = (guests || []).length;
        const confGuests = (guests || []).filter((g) => g.confirmed).length;

        // Scenari
        const bestNet = scenarios && scenarios.length > 0 ? scenarios[0].net_amount : null;

        // Presenti (attendance)
        const { data: att } = await supabase
          .from("attendance")
          .select("id")
          .eq("event_id", id)
          .eq("present", true);
        const presenti = (att || []).length;

        setEvent(ev);
        setKpi({
          budgetPreventivato: budgetTot,
          roadmapCompletati: doneTasks,
          roadmapTotali: totTasks,
          invitatiConfermati: confGuests,
          invitatiTotali: totGuests,
          presenti,
          scenarioNettoMigliore: bestNet,
          surveyRisposte: (survey || []).length,
        });

        // Countdown
        if (ev?.date) {
          const diff = Math.ceil(
            (new Date(ev.date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          setDaysLeft(diff);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const fmt = (n) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  const presetLabel = {
    compleanno: "🎂 Compleanno",
    laurea: "🎓 Laurea",
    addio_nubilato: "💍 Addio al nubilato",
    festa_aziendale: "🏢 Festa aziendale",
    cena_privata: "🍽️ Cena privata",
    battesimo_comunione: "⛪ Battesimo/Comunione",
    altro: "🎉 Altro",
  };

  const SECTIONS = [
    {
      key: "budget",
      label: "Budget",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      value: fmt(kpi.budgetPreventivato),
      sub: "preventivato",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      key: "roadmap",
      label: "Roadmap",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      value: `${kpi.roadmapCompletati}/${kpi.roadmapTotali}`,
      sub: "task completati",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      key: "invitati",
      label: "Invitati",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      value: kpi.invitatiConfermati,
      sub: `confermati su ${kpi.invitatiTotali}`,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      key: "presenze",
      label: "Presenze",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      value: kpi.presenti,
      sub: "presenti",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      key: "scenari",
      label: "Scenari",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
        </svg>
      ),
      value: kpi.scenarioNettoMigliore !== null ? fmt(kpi.scenarioNettoMigliore) : "—",
      sub: "netto stimato",
      color:
        kpi.scenarioNettoMigliore === null
          ? "text-slate-400"
          : kpi.scenarioNettoMigliore >= 0
          ? "text-green-400"
          : "text-red-400",
      bg:
        kpi.scenarioNettoMigliore === null
          ? "bg-slate-500/10"
          : kpi.scenarioNettoMigliore >= 0
          ? "bg-green-500/10"
          : "bg-red-500/10",
      border:
        kpi.scenarioNettoMigliore === null
          ? "border-slate-500/20"
          : kpi.scenarioNettoMigliore >= 0
          ? "border-green-500/20"
          : "border-red-500/20",
    },
    {
      key: "survey",
      label: "Survey",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <rect x="9" y="2" width="6" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 14h6M9 10h6M9 18h4" />
        </svg>
      ),
      value: kpi.surveyRisposte,
      sub: "risposte",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  const TABS = [
    { key: "panoramica", label: "Panoramica" },
    { key: "budget", label: "Budget" },
    { key: "roadmap", label: "Roadmap" },
    { key: "invitati", label: "Invitati" },
    { key: "presenze", label: "Presenze" },
    { key: "scenari", label: "Scenari" },
    { key: "survey", label: "Survey" },
    { key: "impostazioni", label: "Impostazioni" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        {/* Navbar con back + titolo */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => navigate("/events")}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Torna alla lista eventi"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate leading-tight">
              {event?.name || "Evento"}
            </h1>
            {event && (
              <p className="text-xs text-slate-400 truncate leading-tight mt-0.5">
                {new Date(event.date).toLocaleDateString("it-IT", {
                  day: "numeric", month: "long", year: "numeric",
                })}
                {event.preset && (
                  <span className="ml-2">{presetLabel[event.preset] || event.preset}</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(`/events/${id}/impostazioni`)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors flex-shrink-0"
            aria-label="Impostazioni"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Tab bar scrollabile */}
        <div className="flex overflow-x-auto scrollbar-none px-4 pb-0 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                tab.key === "panoramica"
                  ? null
                  : navigate(`/events/${id}/${tab.key}`)
              }
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${
                tab.key === "panoramica"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenuto ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Countdown banner */}
        {daysLeft !== null && (
          <div className="mx-4 mt-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-blue-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">Mancano all'evento</p>
              <p className={`text-xl font-bold mt-0.5 leading-none ${
                daysLeft <= 7 ? "text-red-400" : daysLeft <= 30 ? "text-amber-400" : "text-blue-400"
              }`}>
                {daysLeft > 0 ? `${daysLeft} giorni` : daysLeft === 0 ? "Oggi! 🎉" : "Concluso"}
              </p>
            </div>
          </div>
        )}

        {/* Label sezione */}
        <div className="px-4 mt-5 mb-3">
          <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Panoramica</p>
        </div>

        {/* Griglia KPI — 2 colonne su mobile */}
        <div className="px-4 grid grid-cols-2 gap-3 pb-8">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => navigate(`/events/${id}/${s.key}`)}
              className={`rounded-xl border ${s.border} ${s.bg} p-4 text-left active:scale-95 transition-transform`}
            >
              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-3">
                <span className={s.color}>{s.icon}</span>
                <span className="text-xs font-medium text-slate-300">{s.label}</span>
              </div>
              {/* Value */}
              <p className={`text-2xl font-bold leading-none ${s.color} break-all`}>{s.value}</p>
              {/* Sub */}
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">{s.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
