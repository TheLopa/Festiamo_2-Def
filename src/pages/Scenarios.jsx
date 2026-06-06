import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { TrendingUp, Plus, Trash2, Copy, LayoutList, LayoutGrid } from "lucide-react";

export default function Scenarios() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [event, setEvent]           = useState(null);
  const [scenarios, setScenarios]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [compactView, setCompactView]   = useState(false);

  useEffect(() => { fetchData(); }, [eventId]);

  async function fetchData() {
    const [evRes, scRes, catRes] = await Promise.all([
      supabase.from("events").select("planned_guests, drinks_per_person").eq("id", eventId).single(),
      supabase.from("scenarios").select("*, scenario_categories(*)").eq("event_id", eventId).order("sort_order"),
      supabase.from("budget_categories").select("*, budget_items(*)").eq("event_id", eventId),
    ]);

    setEvent(evRes.data);
    setScenarios(scRes.data || []);

    // Calcola totale budget preventivato
    const cats  = catRes.data || [];
    const items = cats.flatMap(c => c.budget_items || []);
    setBudgetItems(items);
    setCategories(cats);
    setLoading(false);
  }

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  // Calcola costo scenario proporzionale al budget
  const budgetBase = event?.planned_guests || 1;
  const budgetTotale = budgetItems.reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);

  function costoScenario(sc) {
    const ratio    = (sc.guests_count || 0) / budgetBase;
    const variabili = budgetItems.filter(i => i.is_variable).reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);
    const fissi     = budgetTotale - variabili;
    return Math.round(fissi + variabili * ratio);
  }

  function guadagnoScenario(sc) {
    if (sc.mode === "fixed") {
      return (sc.guests_count || 0) * (parseFloat(sc.quota_fixed) || 0);
    }
    return (sc.scenario_categories || []).reduce((s, c) =>
      s + (parseInt(c.people_count) || 0) * (parseFloat(c.quota) || 0), 0
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

  function fmt(n) { return "€" + Math.abs(Math.round(n)).toLocaleString("it-IT"); }
  function fmtSigned(n) { return (n >= 0 ? "+" : "-") + "€" + Math.abs(Math.round(n)).toLocaleString("it-IT"); }

  async function addScenario() {
    const { data } = await supabase
      .from("scenarios")
      .insert({
        event_id: eventId,
        name: t("new_scenario"),
        guests_count: event?.planned_guests || 100,
        mode: "fixed",
        quota_fixed: 0,
        sort_order: scenarios.length,
      })
      .select("*, scenario_categories(*)")
      .single();
    if (data) setScenarios(prev => [...prev, data]);
    showToast();
  }

  async function duplicateScenario(sc) {
    const { data } = await supabase
      .from("scenarios")
      .insert({
        event_id: eventId,
        name: sc.name + " (copia)",
        guests_count: sc.guests_count,
        mode: sc.mode,
        quota_fixed: sc.quota_fixed,
        sort_order: scenarios.length,
      })
      .select("*, scenario_categories(*)")
      .single();
    if (data) {
      // Duplica anche le categorie
      if (sc.scenario_categories?.length) {
        const { data: cats } = await supabase
          .from("scenario_categories")
          .insert(sc.scenario_categories.map(c => ({
            scenario_id: data.id, name: c.name,
            people_count: c.people_count, quota: c.quota,
          })))
          .select();
        data.scenario_categories = cats || [];
      }
      setScenarios(prev => [...prev, data]);
    }
    showToast();
  }

  async function deleteScenario(id) {
    setScenarios(prev => prev.filter(s => s.id !== id));
    await supabase.from("scenarios").delete().eq("id", id);
    showToast();
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
      .select()
      .single();
    if (data) {
      setScenarios(prev => prev.map(s => s.id === scenarioId
        ? { ...s, scenario_categories: [...(s.scenario_categories || []), data] }
        : s
      ));
    }
  }

  async function updateCategory(scenarioId, catId, field, value) {
    setScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      return {
        ...s,
        scenario_categories: s.scenario_categories.map(c =>
          c.id === catId ? { ...c, [field]: value } : c
        ),
      };
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
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  const best = bestIdx();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "var(--warning-light)" }}>
          <TrendingUp size={20} style={{ color: "var(--warning)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("scenarios")}</h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t("simulator")}</p>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{t("saved")} ✓</span>
        )}
      </div>

      {/* Dati budget di riferimento */}
      <div className="card mb-4" style={{ background: "var(--bg-secondary)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 14 }}>🔗</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Dati dal budget
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{fmt(budgetTotale)}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Totale prev.</p>
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{budgetBase}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ospiti base</p>
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {budgetBase ? fmt(budgetTotale / budgetBase) : "—"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>€/ospite</p>
          </div>
        </div>
      </div>

      {/* Toggle vista */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Vista</span>
        <div className="flex border rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <button onClick={() => setCompactView(false)}
            className="px-3 py-1.5 text-xs flex items-center gap-1"
            style={{
              background: !compactView ? "var(--brand-light)" : "var(--bg-primary)",
              color: !compactView ? "var(--brand-text)" : "var(--text-secondary)",
              border: "none", cursor: "pointer",
            }}>
            <LayoutGrid size={13} /> {t("detail_view")}
          </button>
          <button onClick={() => setCompactView(true)}
            className="px-3 py-1.5 text-xs flex items-center gap-1"
            style={{
              background: compactView ? "var(--brand-light)" : "var(--bg-primary)",
              color: compactView ? "var(--brand-text)" : "var(--text-secondary)",
              border: "none", cursor: "pointer",
            }}>
            <LayoutList size={13} /> {t("compact_view")}
          </button>
        </div>
      </div>

      {/* Scenari */}
      {scenarios.map((sc, idx) => {
        const costo    = costoScenario(sc);
        const guadagno = guadagnoScenario(sc);
        const netto    = guadagno - costo;
        const isBest   = idx === best && scenarios.length > 1;

        return (
          <div key={sc.id} className="card mb-3"
            style={{ padding: 0, overflow: "hidden",
              border: isBest ? "2px solid var(--success)" : "1px solid var(--border)" }}>

            {/* Header scenario */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ background: "var(--bg-secondary)" }}>
              <input
                className="flex-1 text-sm font-semibold bg-transparent border-none outline-none"
                style={{ color: "var(--text-primary)" }}
                value={sc.name}
                onChange={e => updateScenario(sc.id, "name", e.target.value)}
              />
              {isBest && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--success-light)", color: "var(--success-text)" }}>
                  {t("best")}
                </span>
              )}
              <button onClick={() => duplicateScenario(sc)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <Copy size={14} />
              </button>
              {scenarios.length > 1 && (
                <button onClick={() => deleteScenario(sc.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Metriche */}
            <div className="grid grid-cols-3 px-4 py-3 gap-2 text-center">
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>{t("cost")}</p>
                <p className="text-base font-bold" style={{ color: "var(--danger)" }}>{fmt(costo)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>{t("revenue")}</p>
                <p className="text-base font-bold" style={{ color: "var(--success)" }}>{fmt(guadagno)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>{t("net")}</p>
                <p className="text-base font-bold"
                  style={{ color: netto >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtSigned(netto)}
                </p>
              </div>
            </div>

            {/* Dettaglio — nascosto in vista compatta */}
            {!compactView && (
              <div className="px-4 pb-4 space-y-3"
                style={{ borderTop: "1px solid var(--border)" }}>

                {/* Ospiti */}
                <div className="pt-3">
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {t("guests_count")}
                  </p>
                  <div className="stepper">
                    <button className="stepper-btn"
                      onClick={() => updateScenario(sc.id, "guests_count", Math.max(1, (sc.guests_count || 1) - 1))}>
                      −
                    </button>
                    <span className="stepper-val">{sc.guests_count || 0}</span>
                    <button className="stepper-btn"
                      onClick={() => updateScenario(sc.id, "guests_count", (sc.guests_count || 0) + 1)}>
                      +
                    </button>
                  </div>
                </div>

                {/* Modalità guadagno */}
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Modalità guadagno
                  </p>
                  <div className="flex border rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}>
                    <button onClick={() => updateScenario(sc.id, "mode", "fixed")}
                      className="flex-1 py-2 text-xs"
                      style={{
                        background: sc.mode === "fixed" ? "var(--brand-light)" : "var(--bg-primary)",
                        color: sc.mode === "fixed" ? "var(--brand-text)" : "var(--text-secondary)",
                        border: "none", cursor: "pointer",
                      }}>
                      {t("fixed_quota")}
                    </button>
                    <button onClick={() => updateScenario(sc.id, "mode", "categorie")}
                      className="flex-1 py-2 text-xs"
                      style={{
                        background: sc.mode === "categorie" ? "var(--brand-light)" : "var(--bg-primary)",
                        color: sc.mode === "categorie" ? "var(--brand-text)" : "var(--text-secondary)",
                        border: "none", cursor: "pointer",
                      }}>
                      {t("categories")}
                    </button>
                  </div>
                </div>

                {/* Quota fissa */}
                {sc.mode === "fixed" && (
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      {t("quota_per_person")}
                    </p>
                    <input type="number" className="input-base" min="0" step="1"
                      value={sc.quota_fixed || ""}
                      placeholder="0"
                      onChange={e => updateScenario(sc.id, "quota_fixed", parseFloat(e.target.value) || 0)} />
                  </div>
                )}

                {/* Categorie personalizzate */}
                {sc.mode === "categorie" && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                      {t("categories")} · Nome · N. persone · € quota
                    </p>
                    {(sc.scenario_categories || []).map(cat => (
                      <div key={cat.id} className="flex gap-2 mb-2 items-center">
                        <input type="text" className="input-base flex-1 text-sm" placeholder="Nome"
                          value={cat.name}
                          onChange={e => updateCategory(sc.id, cat.id, "name", e.target.value)} />
                        <input type="number" className="input-base text-sm" style={{ width: 56 }}
                          placeholder="N." min="0"
                          value={cat.people_count || ""}
                          onChange={e => updateCategory(sc.id, cat.id, "people_count", parseInt(e.target.value) || 0)} />
                        <input type="number" className="input-base text-sm" style={{ width: 56 }}
                          placeholder="€" min="0"
                          value={cat.quota || ""}
                          onChange={e => updateCategory(sc.id, cat.id, "quota", parseFloat(e.target.value) || 0)} />
                        <button onClick={() => deleteCategory(sc.id, cat.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addCategory(sc.id)}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}>
                      <Plus size={13} /> {t("add_category")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Aggiungi scenario */}
      <button onClick={addScenario}
        className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
        style={{ border: "1.5px dashed var(--border-strong)", color: "var(--text-secondary)",
          background: "none", cursor: "pointer" }}>
        <Plus size={16} /> {t("add_scenario")}
      </button>
    </div>
  );
}
