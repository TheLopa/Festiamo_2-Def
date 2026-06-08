import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { TrendingUp, Plus, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";

export default function Scenarios() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [event,       setEvent]       = useState(null);
  const [scenarios,   setScenarios]   = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toastMsg,    setToastMsg]    = useState("");
  const [openCards,   setOpenCards]   = useState({});

  useEffect(() => { fetchData(); }, [eventId]);

  function showToast(msg = "Salvato") {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function fetchData() {
    const [evRes, scRes, catRes] = await Promise.all([
      supabase.from("events").select("planned_guests, drinks_per_person").eq("id", eventId).single(),
      supabase.from("scenarios").select("*, scenario_categories(*)").eq("event_id", eventId).order("sort_order"),
      supabase.from("budget_categories").select("*, budget_items(*)").eq("event_id", eventId),
    ]);
    setEvent(evRes.data);
    setScenarios(scRes.data || []);
    const items = (catRes.data || []).flatMap(c => c.budget_items || []);
    setBudgetItems(items);
    // Apri tutti gli scenari di default
    const open = {};
    (scRes.data || []).forEach(s => { open[s.id] = true; });
    setOpenCards(open);
    setLoading(false);
  }

  const budgetBase   = event?.planned_guests || 1;
  const budgetTotale = budgetItems.reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);

  function costoScenario(sc) {
    const ratio    = (sc.guests_count || 0) / budgetBase;
    const variabili = budgetItems.filter(i => i.is_variable).reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);
    const fissi     = budgetTotale - variabili;
    return Math.round(fissi + variabili * ratio);
  }

  function guadagnoScenario(sc) {
    if (sc.mode === "fixed") return (sc.guests_count || 0) * (parseFloat(sc.quota_fixed) || 0);
    return (sc.scenario_categories || []).reduce(
      (s, c) => s + (parseInt(c.people_count) || 0) * (parseFloat(c.quota) || 0), 0
    );
  }

  function bestIdx() {
    let best = -1, bestN = -Infinity;
    scenarios.forEach((sc, i) => {
      const n = guadagnoScenario(sc) - costoScenario(sc);
      if (n > bestN) { bestN = n; best = i; }
    });
    return best;
  }

  function fmt(n)       { return "€" + Math.abs(Math.round(n)).toLocaleString("it-IT"); }
  function fmtSigned(n) { return (n >= 0 ? "+" : "−") + "€" + Math.abs(Math.round(n)).toLocaleString("it-IT"); }

  async function addScenario() {
    const { data } = await supabase
      .from("scenarios")
      .insert({
        event_id: eventId, name: "Nuovo scenario",
        guests_count: event?.planned_guests || 100,
        mode: "fixed", quota_fixed: 0, sort_order: scenarios.length,
      })
      .select("*, scenario_categories(*)").single();
    if (data) {
      setScenarios(prev => [...prev, data]);
      setOpenCards(prev => ({ ...prev, [data.id]: true }));
    }
    showToast("Scenario aggiunto");
  }

  async function duplicateScenario(sc) {
    const { data } = await supabase
      .from("scenarios")
      .insert({
        event_id: eventId, name: sc.name + " (copia)",
        guests_count: sc.guests_count, mode: sc.mode,
        quota_fixed: sc.quota_fixed, sort_order: scenarios.length,
      })
      .select("*, scenario_categories(*)").single();
    if (data) {
      if (sc.scenario_categories?.length) {
        const { data: cats } = await supabase
          .from("scenario_categories")
          .insert(sc.scenario_categories.map(c => ({
            scenario_id: data.id, name: c.name,
            people_count: c.people_count, quota: c.quota,
          }))).select();
        data.scenario_categories = cats || [];
      }
      setScenarios(prev => [...prev, data]);
      setOpenCards(prev => ({ ...prev, [data.id]: true }));
    }
    showToast("Scenario duplicato");
  }

  async function deleteScenario(id) {
    setScenarios(prev => prev.filter(s => s.id !== id));
    await supabase.from("scenarios").delete().eq("id", id);
    showToast("Eliminato");
  }

  async function updateScenario(id, field, value) {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    clearTimeout(window._scenTimer);
    window._scenTimer = setTimeout(async () => {
      setSaving(true);
      await supabase.from("scenarios").update({ [field]: value }).eq("id", id);
      setSaving(false);
      showToast();
    }, 600);
  }

  async function addCategory(scenarioId) {
    const { data } = await supabase
      .from("scenario_categories")
      .insert({ scenario_id: scenarioId, name: "Categoria", people_count: 0, quota: 0 })
      .select().single();
    if (data) {
      setScenarios(prev => prev.map(s => s.id === scenarioId
        ? { ...s, scenario_categories: [...(s.scenario_categories || []), data] } : s
      ));
    }
  }

  async function updateCategory(scenarioId, catId, field, value) {
    setScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, scenario_categories: s.scenario_categories.map(c =>
        c.id === catId ? { ...c, [field]: value } : c
      )};
    }));
    clearTimeout(window._catTimer);
    window._catTimer = setTimeout(async () => {
      await supabase.from("scenario_categories").update({ [field]: value }).eq("id", catId);
    }, 600);
  }

  async function deleteCategory(scenarioId, catId) {
    setScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, scenario_categories: s.scenario_categories.filter(c => c.id !== catId) };
    }));
    await supabase.from("scenario_categories").delete().eq("id", catId);
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

  const best = bestIdx();

  const inputStyle = {
    background:"var(--bg-primary)", border:"1px solid var(--border)",
    borderRadius:8, padding:"9px 11px", color:"var(--text-primary)",
    fontSize:14, width:"100%", boxSizing:"border-box",
  };

  const segmentStyle = (active) => ({
    flex:1, padding:"8px", fontSize:13, fontWeight: active ? 600 : 400,
    background: active ? "var(--brand-light)" : "transparent",
    color: active ? "var(--brand)" : "var(--text-secondary)",
    border:"none", cursor:"pointer",
    WebkitTapHighlightColor:"transparent",
    borderRadius:8,
  });

  return (
    <div style={{ paddingBottom:32 }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"var(--success)", color:"#fff",
          padding:"8px 20px", borderRadius:20, fontSize:13, fontWeight:600,
          zIndex:300, pointerEvents:"none", whiteSpace:"nowrap",
        }}>
          {toastMsg} ✓
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background:"var(--warning-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <TrendingUp size={20} style={{ color:"var(--warning)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Scenari</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : "Simulatore guadagno"}
          </p>
        </div>
      </div>

      {/* Budget di riferimento */}
      <div style={{
        background:"var(--bg-secondary)", border:"1px solid var(--border)",
        borderRadius:16, padding:"14px 16px", marginBottom:16,
      }}>
        <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:600,
          color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
          🔗 Budget di riferimento
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
          {[
            { label:"Totale prev.", value: fmt(budgetTotale) },
            { label:"Ospiti base", value: budgetBase },
            { label:"€/ospite",   value: budgetBase ? fmt(budgetTotale / budgetBase) : "—" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ margin:0, fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{s.value}</p>
              <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--text-tertiary)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scenari */}
      {scenarios.map((sc, idx) => {
        const costo    = costoScenario(sc);
        const guadagno = guadagnoScenario(sc);
        const netto    = guadagno - costo;
        const isBest   = idx === best && scenarios.length > 1;
        const isOpen   = openCards[sc.id] !== false;

        return (
          <div key={sc.id} style={{
            background:"var(--bg-secondary)",
            border: isBest ? "2px solid var(--success)" : "1px solid var(--border)",
            borderRadius:16, overflow:"hidden", marginBottom:12,
          }}>

            {/* Header scenario */}
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"12px 16px",
              borderBottom:"1px solid var(--border)",
            }}>
              {/* Nome editabile */}
              <input
                value={sc.name}
                onChange={e => updateScenario(sc.id, "name", e.target.value)}
                style={{
                  flex:1, background:"none", border:"none", outline:"none",
                  fontSize:15, fontWeight:700, color:"var(--text-primary)",
                  minWidth:0,
                }}
              />
              {isBest && (
                <span style={{
                  flexShrink:0, fontSize:11, fontWeight:700, padding:"3px 8px",
                  borderRadius:20, background:"var(--success-light)", color:"var(--success)",
                }}>
                  🏆 Migliore
                </span>
              )}
              <button onClick={() => duplicateScenario(sc)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"var(--text-tertiary)", display:"flex", padding:4, flexShrink:0 }}>
                <Copy size={16}/>
              </button>
              {scenarios.length > 1 && (
                <button onClick={() => deleteScenario(sc.id)}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    color:"var(--text-tertiary)", display:"flex", padding:4, flexShrink:0 }}>
                  <Trash2 size={16}/>
                </button>
              )}
              <button
                onClick={() => setOpenCards(p => ({ ...p, [sc.id]: !isOpen }))}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"var(--text-tertiary)", display:"flex", padding:4, flexShrink:0 }}>
                {isOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </button>
            </div>

            {/* Metriche — sempre visibili */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
              padding:"14px 16px", gap:8, textAlign:"center",
              borderBottom: isOpen ? "1px solid var(--border)" : "none",
            }}>
              <div>
                <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>Costo</p>
                <p style={{ margin:"3px 0 0", fontSize:18, fontWeight:800, color:"var(--danger)" }}>
                  {fmt(costo)}
                </p>
              </div>
              <div>
                <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>Ricavo</p>
                <p style={{ margin:"3px 0 0", fontSize:18, fontWeight:800, color:"var(--success)" }}>
                  {fmt(guadagno)}
                </p>
              </div>
              <div>
                <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>Netto</p>
                <p style={{ margin:"3px 0 0", fontSize:18, fontWeight:800,
                  color: netto >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtSigned(netto)}
                </p>
              </div>
            </div>

            {/* Dettaglio espandibile */}
            {isOpen && (
              <div style={{ padding:"16px" }}>

                {/* Ospiti — stepper */}
                <div style={{ marginBottom:16 }}>
                  <p style={{ margin:"0 0 8px", fontSize:13, color:"var(--text-secondary)", fontWeight:500 }}>
                    Numero ospiti
                  </p>
                  <div style={{
                    display:"flex", alignItems:"center", gap:12,
                    background:"var(--bg-primary)", border:"1px solid var(--border)",
                    borderRadius:12, padding:"4px",
                  }}>
                    <button
                      onClick={() => updateScenario(sc.id, "guests_count", Math.max(1, (sc.guests_count || 1) - 1))}
                      style={{
                        width:44, height:44, borderRadius:10, flexShrink:0,
                        background:"var(--bg-secondary)", border:"1px solid var(--border)",
                        fontSize:22, cursor:"pointer", color:"var(--text-primary)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >−</button>
                    <span style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:800,
                      color:"var(--text-primary)" }}>
                      {sc.guests_count || 0}
                    </span>
                    <button
                      onClick={() => updateScenario(sc.id, "guests_count", (sc.guests_count || 0) + 1)}
                      style={{
                        width:44, height:44, borderRadius:10, flexShrink:0,
                        background:"var(--bg-secondary)", border:"1px solid var(--border)",
                        fontSize:22, cursor:"pointer", color:"var(--text-primary)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >+</button>
                  </div>
                </div>

                {/* Modalità guadagno — segment control */}
                <div style={{ marginBottom:16 }}>
                  <p style={{ margin:"0 0 8px", fontSize:13, color:"var(--text-secondary)", fontWeight:500 }}>
                    Modalità guadagno
                  </p>
                  <div style={{
                    display:"flex", background:"var(--bg-primary)",
                    border:"1px solid var(--border)", borderRadius:10, padding:3, gap:3,
                  }}>
                    <button onClick={() => updateScenario(sc.id, "mode", "fixed")}
                      style={segmentStyle(sc.mode === "fixed")}>
                      Quota fissa
                    </button>
                    <button onClick={() => updateScenario(sc.id, "mode", "categorie")}
                      style={segmentStyle(sc.mode === "categorie")}>
                      Per categorie
                    </button>
                  </div>
                </div>

                {/* Quota fissa */}
                {sc.mode === "fixed" && (
                  <div style={{ marginBottom:4 }}>
                    <p style={{ margin:"0 0 8px", fontSize:13, color:"var(--text-secondary)", fontWeight:500 }}>
                      Quota per persona (€)
                    </p>
                    <input type="number" style={inputStyle} min="0" step="1"
                      value={sc.quota_fixed || ""} placeholder="0"
                      onChange={e => updateScenario(sc.id, "quota_fixed", parseFloat(e.target.value) || 0)} />
                    {sc.quota_fixed > 0 && (
                      <p style={{ margin:"6px 0 0", fontSize:12, color:"var(--text-tertiary)" }}>
                        {sc.guests_count} ospiti × €{sc.quota_fixed} = {fmt((sc.guests_count || 0) * sc.quota_fixed)}
                      </p>
                    )}
                  </div>
                )}

                {/* Categorie personalizzate */}
                {sc.mode === "categorie" && (
                  <div>
                    <p style={{ margin:"0 0 10px", fontSize:13, color:"var(--text-secondary)", fontWeight:500 }}>
                      Categorie
                    </p>
                    {(sc.scenario_categories || []).map(cat => (
                      <div key={cat.id} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                          <input type="text" style={{ ...inputStyle, flex:1 }} placeholder="Nome categoria"
                            value={cat.name}
                            onChange={e => updateCategory(sc.id, cat.id, "name", e.target.value)} />
                          <button onClick={() => deleteCategory(sc.id, cat.id)}
                            style={{ background:"none", border:"none", cursor:"pointer",
                              color:"var(--text-tertiary)", display:"flex", padding:4, flexShrink:0 }}>
                            <Trash2 size={16}/>
                          </button>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                          <div>
                            <p style={{ margin:"0 0 4px", fontSize:11, color:"var(--text-tertiary)" }}>Persone</p>
                            <input type="number" style={inputStyle} placeholder="0" min="0"
                              value={cat.people_count || ""}
                              onChange={e => updateCategory(sc.id, cat.id, "people_count", parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <p style={{ margin:"0 0 4px", fontSize:11, color:"var(--text-tertiary)" }}>Quota €</p>
                            <input type="number" style={inputStyle} placeholder="0" min="0"
                              value={cat.quota || ""}
                              onChange={e => updateCategory(sc.id, cat.id, "quota", parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>
                        {cat.people_count > 0 && cat.quota > 0 && (
                          <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--text-tertiary)" }}>
                            {cat.people_count} × €{cat.quota} = {fmt(cat.people_count * cat.quota)}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addCategory(sc.id)}
                      style={{
                        display:"flex", alignItems:"center", gap:6,
                        background:"none", border:"none", cursor:"pointer",
                        color:"var(--brand)", fontSize:13, fontWeight:500, padding:0,
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >
                      <Plus size={15}/> Aggiungi categoria
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Aggiungi scenario */}
      <button
        onClick={addScenario}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          padding:"13px 16px", background:"none",
          border:"1px dashed var(--border)", borderRadius:16, cursor:"pointer",
          color:"var(--brand)", fontSize:14, fontWeight:500,
          WebkitTapHighlightColor:"transparent",
        }}
      >
        <Plus size={16}/> Aggiungi scenario
      </button>
    </div>
  );
}
