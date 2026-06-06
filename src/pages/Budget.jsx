import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { Plus, Trash2, ChevronDown, ChevronUp, BarChart2, Info } from "lucide-react";

// ── Bevande di default per preset ────────────────────────────
const DEFAULT_DRINKS = {
  alcolici: [
    { name: "Vino",    perc: 40, drinksPerBot: 5,  price: 6  },
    { name: "Birra",   perc: 35, drinksPerBot: 1,  price: 2  },
    { name: "Prosecco",perc: 10, drinksPerBot: 6,  price: 8  },
    { name: "Spirits", perc: 15, drinksPerBot: 20, price: 15 },
  ],
  analcoliche: [
    { name: "Acqua",          perc: 50, drinksPerBot: 8, price: 1.5 },
    { name: "Succhi e bibite",perc: 30, drinksPerBot: 6, price: 2   },
    { name: "Soft drink",     perc: 20, drinksPerBot: 4, price: 2.5 },
  ],
};

export default function Budget() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [event, setEvent]           = useState(null);
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [openCats, setOpenCats]     = useState({});
  const [addForms, setAddForms]     = useState({});
  const [newItems, setNewItems]     = useState({});
  const [showDrinksInfo, setShowDrinksInfo] = useState(false);
  const [openDrinksSection, setOpenDrinksSection] = useState({ alc: true, analc: true });

  useEffect(() => { fetchData(); }, [eventId]);

  async function fetchData() {
    // Carica evento
    const { data: ev } = await supabase
      .from("events")
      .select("planned_guests, drinks_per_person, preset")
      .eq("id", eventId)
      .single();
    setEvent(ev);

    // Carica categorie standard
    const { data: cats } = await supabase
      .from("budget_categories")
      .select("*, budget_items(*)")
      .eq("event_id", eventId)
      .order("sort_order");

    if (cats && cats.length > 0) {
      // Separa bevande dalle categorie standard
      const standard = cats.filter(c => c.name !== "Bevande");
      const bevCat   = cats.find(c => c.name === "Bevande");
      setCategories(standard);
      const open = {};
      standard.forEach(c => { open[c.id] = true; });
      setOpenCats(open);

      // Carica dati bevande da budget_items della categoria Bevande
      if (bevCat) {
        const items = bevCat.budget_items || [];
        const alc   = items.filter(i => i.formula_key === "alcolico").map(i => ({
          id: i.id, name: i.label,
          perc: i.percentage || 0,
          drinksPerBot: i.drinks_per_bottle || 1,
          price: i.unit_cost || 0,
        }));
        const analc = items.filter(i => i.formula_key === "analcolico").map(i => ({
          id: i.id, name: i.label,
          perc: i.percentage || 0,
          drinksPerBot: i.drinks_per_bottle || 1,
          price: i.unit_cost || 0,
        }));
        setDrinks({ catId: bevCat.id, alcolici: alc, analcoliche: analc });
      } else {
        await createDrinksCategory();
      }
    } else {
      await createDefaultCategories(ev);
    }
    setLoading(false);
  }

  async function createDefaultCategories(ev) {
    const names = ["Catering", "Musica", "Location", "Extra"];
    const { data: cats } = await supabase
      .from("budget_categories")
      .insert(names.map((name, i) => ({ event_id: eventId, name, sort_order: i })))
      .select();
    if (cats) {
      const withItems = cats.map(c => ({ ...c, budget_items: [] }));
      setCategories(withItems);
      const open = {};
      cats.forEach(c => { open[c.id] = true; });
      setOpenCats(open);
    }
    await createDrinksCategory();
  }

  async function createDrinksCategory() {
    const { data: bevCat } = await supabase
      .from("budget_categories")
      .insert({ event_id: eventId, name: "Bevande", sort_order: 99 })
      .select()
      .single();

    if (!bevCat) return;

    const items = [
      ...DEFAULT_DRINKS.alcolici.map(d => ({
        category_id: bevCat.id, event_id: eventId,
        label: d.name, kind: "formula", formula_key: "alcolico",
        percentage: d.perc, drinks_per_bottle: d.drinksPerBot,
        unit_cost: d.price, actual_spend: 0, is_variable: true,
      })),
      ...DEFAULT_DRINKS.analcoliche.map(d => ({
        category_id: bevCat.id, event_id: eventId,
        label: d.name, kind: "formula", formula_key: "analcolico",
        percentage: d.perc, drinks_per_bottle: d.drinksPerBot,
        unit_cost: d.price, actual_spend: 0, is_variable: true,
      })),
    ];

    const { data: createdItems } = await supabase
      .from("budget_items")
      .insert(items)
      .select();

    if (createdItems) {
      const alc   = createdItems.filter(i => i.formula_key === "alcolico").map(i => ({
        id: i.id, name: i.label,
        perc: i.percentage, drinksPerBot: i.drinks_per_bottle, price: i.unit_cost,
      }));
      const analc = createdItems.filter(i => i.formula_key === "analcolico").map(i => ({
        id: i.id, name: i.label,
        perc: i.percentage, drinksPerBot: i.drinks_per_bottle, price: i.unit_cost,
      }));
      setDrinks({ catId: bevCat.id, alcolici: alc, analcoliche: analc });
    }
  }

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  // ── Calcoli bevande ───────────────────────────────────────
  const ospiti = event?.planned_guests || 0;
  const drinksXpersona = event?.drinks_per_person || 0;

  function calcBot(perc, drinksPerBot) {
    return Math.ceil((ospiti * drinksXpersona * (perc / 100)) / drinksPerBot);
  }

  function calcCosto(perc, drinksPerBot, price) {
    return calcBot(perc, drinksPerBot) * price;
  }

  const totaleDrinks = drinks
    ? [...(drinks.alcolici || []), ...(drinks.analcoliche || [])].reduce(
        (s, d) => s + calcCosto(d.perc, d.drinksPerBot, d.price), 0
      )
    : 0;

  // ── Totali generali ───────────────────────────────────────
  const totStandard = categories.reduce((acc, cat) => {
    const items = cat.budget_items || [];
    return {
      prev: acc.prev + items.reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0),
      real: acc.real + items.reduce((s, i) => s + (parseFloat(i.actual_spend) || 0), 0),
    };
  }, { prev: 0, real: 0 });

  const totPrev = totStandard.prev + totaleDrinks;
  const totReal = totStandard.real;
  const diff    = totReal - totPrev;

  function fmt(n) {
    return "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");
  }
  function fmtDiff(n) {
    return (n > 0 ? "+" : n < 0 ? "-" : "") + "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");
  }

  // ── Update item standard ──────────────────────────────────
  async function updateItem(itemId, catId, field, value) {
    const num = parseFloat(value) || 0;
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        budget_items: cat.budget_items.map(item =>
          item.id === itemId ? { ...item, [field]: num } : item
        ),
      };
    }));
    clearTimeout(window._budgetTimer);
    window._budgetTimer = setTimeout(async () => {
      setSaving(true);
      await supabase.from("budget_items").update({ [field]: num }).eq("id", itemId);
      setSaving(false);
      showToast();
    }, 800);
  }

  async function deleteItem(itemId, catId) {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return { ...cat, budget_items: cat.budget_items.filter(i => i.id !== itemId) };
    }));
    await supabase.from("budget_items").delete().eq("id", itemId);
    showToast();
  }

  async function addItem(catId) {
    const form  = newItems[catId] || {};
    const label = form.label?.trim();
    if (!label) return;
    const prev = parseFloat(form.prev) || 0;
    const real = parseFloat(form.real) || 0;
    const { data } = await supabase
      .from("budget_items")
      .insert({ category_id: catId, event_id: eventId, label, kind: "fixed", unit_cost: prev, actual_spend: real })
      .select()
      .single();
    if (data) {
      setCategories(prev => prev.map(cat => {
        if (cat.id !== catId) return cat;
        return { ...cat, budget_items: [...cat.budget_items, data] };
      }));
    }
    setNewItems(prev => ({ ...prev, [catId]: {} }));
    setAddForms(prev => ({ ...prev, [catId]: false }));
    showToast();
  }

  // ── Update bevanda ────────────────────────────────────────
  async function updateDrink(type, index, field, value) {
    const num = parseFloat(value) || 0;
    setDrinks(prev => {
      const arr = [...prev[type]];
      arr[index] = { ...arr[index], [field]: num };
      return { ...prev, [type]: arr };
    });
    const drink = drinks[type][index];
    if (!drink?.id) return;
    const dbField = field === "perc" ? "percentage"
      : field === "drinksPerBot" ? "drinks_per_bottle"
      : "unit_cost";
    clearTimeout(window._drinkTimer);
    window._drinkTimer = setTimeout(async () => {
      setSaving(true);
      await supabase.from("budget_items").update({ [dbField]: num }).eq("id", drink.id);
      setSaving(false);
      showToast();
    }, 800);
  }

  async function deleteDrink(type, index) {
    const drink = drinks[type][index];
    setDrinks(prev => {
      const arr = prev[type].filter((_, i) => i !== index);
      return { ...prev, [type]: arr };
    });
    if (drink?.id) {
      await supabase.from("budget_items").delete().eq("id", drink.id);
    }
    showToast();
  }

  async function addDrink(type) {
    const name = prompt(`Nome ${type === "alcolici" ? "alcolico" : "analcolico"}:`);
    if (!name?.trim()) return;
    const formulaKey = type === "alcolici" ? "alcolico" : "analcolico";
    const { data } = await supabase
      .from("budget_items")
      .insert({
        category_id: drinks.catId, event_id: eventId,
        label: name.trim(), kind: "formula", formula_key: formulaKey,
        percentage: 10, drinks_per_bottle: 6, unit_cost: 5, actual_spend: 0, is_variable: true,
      })
      .select()
      .single();
    if (data) {
      setDrinks(prev => ({
        ...prev,
        [type]: [...prev[type], {
          id: data.id, name: data.label,
          perc: 10, drinksPerBot: 6, price: 5,
        }],
      }));
    }
    showToast();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  const percSumAlc   = (drinks?.alcolici   || []).reduce((s, d) => s + (d.perc || 0), 0);
  const percSumAnalc = (drinks?.analcoliche || []).reduce((s, d) => s + (d.perc || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "var(--success-light)" }}>
          <BarChart2 size={20} style={{ color: "var(--success)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("budget")}</h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : t("autosave")}
          </p>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{t("saved")} ✓</span>
        )}
      </div>

      {/* Totali */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card">
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{t("budgeted")}</p>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(totPrev)}</p>
        </div>
        <div className="card">
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{t("spent")}</p>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(totReal)}</p>
        </div>
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{t("difference")} (reale − prev.)</p>
          <p className="text-xl font-bold"
            style={{ color: diff > 0 ? "var(--danger)" : diff < 0 ? "var(--success)" : "var(--text-tertiary)" }}>
            {fmtDiff(diff)}
          </p>
        </div>
      </div>

      {/* Categorie standard */}
      {categories.map(cat => {
        const items  = cat.budget_items || [];
        const catPrev = items.reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);
        const catReal = items.reduce((s, i) => s + (parseFloat(i.actual_spend) || 0), 0);
        const isOpen  = openCats[cat.id] !== false;

        return (
          <div key={cat.id} className="card mb-3" style={{ padding: 0, overflow: "hidden" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: "var(--bg-secondary)", border: "none", cursor: "pointer" }}
              onClick={() => setOpenCats(p => ({ ...p, [cat.id]: !isOpen }))}
            >
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{cat.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {fmt(catPrev)} prev · {fmt(catReal)} reale
                </span>
                {isOpen
                  ? <ChevronUp size={16} style={{ color: "var(--text-tertiary)" }} />
                  : <ChevronDown size={16} style={{ color: "var(--text-tertiary)" }} />}
              </div>
            </button>

            {isOpen && (
              <div>
                {items.length > 0 && (
                  <div className="grid px-4 py-2 text-xs"
                    style={{ gridTemplateColumns: "1fr 70px 70px 60px 32px", gap: "4px",
                      color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
                    <span>Voce</span>
                    <span style={{ textAlign: "right" }}>Prev.</span>
                    <span style={{ textAlign: "right" }}>Reale</span>
                    <span style={{ textAlign: "right" }}>Diff.</span>
                    <span />
                  </div>
                )}

                {items.map(item => {
                  const d = (parseFloat(item.actual_spend) || 0) - (parseFloat(item.unit_cost) || 0);
                  return (
                    <div key={item.id} className="grid px-4 py-2 items-center"
                      style={{ gridTemplateColumns: "1fr 70px 70px 60px 32px", gap: "4px",
                        borderBottom: "1px solid var(--border)" }}>
                      <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{item.label}</span>
                      <input type="number" className="input-base text-right text-xs px-1 py-1"
                        style={{ minWidth: 0 }} value={item.unit_cost || ""} placeholder="0"
                        onChange={e => updateItem(item.id, cat.id, "unit_cost", e.target.value)} />
                      <input type="number" className="input-base text-right text-xs px-1 py-1"
                        style={{ minWidth: 0 }} value={item.actual_spend || ""} placeholder="0"
                        onChange={e => updateItem(item.id, cat.id, "actual_spend", e.target.value)} />
                      <span className="text-xs font-medium text-right"
                        style={{ color: d > 0 ? "var(--danger)" : d < 0 ? "var(--success)" : "var(--text-tertiary)" }}>
                        {fmtDiff(d)}
                      </span>
                      <button className="btn-ghost p-1" style={{ color: "var(--text-tertiary)" }}
                        onClick={() => deleteItem(item.id, cat.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {addForms[cat.id] ? (
                  <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <input type="text" className="input-base mb-2" placeholder={t("item_name")}
                      value={newItems[cat.id]?.label || ""}
                      onChange={e => setNewItems(p => ({ ...p, [cat.id]: { ...p[cat.id], label: e.target.value } }))} />
                    <div className="flex gap-2 mb-2">
                      <input type="number" className="input-base flex-1" placeholder="Preventivo €"
                        value={newItems[cat.id]?.prev || ""}
                        onChange={e => setNewItems(p => ({ ...p, [cat.id]: { ...p[cat.id], prev: e.target.value } }))} />
                      <input type="number" className="input-base flex-1" placeholder="Reale €"
                        value={newItems[cat.id]?.real || ""}
                        onChange={e => setNewItems(p => ({ ...p, [cat.id]: { ...p[cat.id], real: e.target.value } }))} />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary flex-1 py-2 text-sm"
                        onClick={() => setAddForms(p => ({ ...p, [cat.id]: false }))}>{t("cancel")}</button>
                      <button className="btn-primary flex-1 py-2 text-sm" onClick={() => addItem(cat.id)}>{t("add")}</button>
                    </div>
                  </div>
                ) : (
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{ color: "var(--brand)", background: "none", border: "none",
                      borderTop: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => setAddForms(p => ({ ...p, [cat.id]: true }))}>
                    <Plus size={15} /> {t("add_item")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Sezione Bevande */}
      {drinks && (
        <div className="card mb-3" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header bevande */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: "var(--bg-secondary)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Bevande
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {fmt(totaleDrinks)} prev.
              </span>
              <button onClick={() => setShowDrinksInfo(p => !p)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* Info box */}
          {showDrinksInfo && (
            <div className="px-4 py-3 text-xs" style={{ background: "var(--brand-light)",
              color: "var(--brand-text)", borderBottom: "1px solid var(--border)" }}>
              Formula: <strong>ospiti ({ospiti}) × drinks/persona ({drinksXpersona}) × % ÷ drinks/bottiglia × €/bottiglia</strong>.
              Le percentuali di alcolici e analcoliche devono sommare ciascuna a 100%.
              Alcolici: <strong style={{ color: percSumAlc === 100 ? "var(--success)" : "var(--danger)" }}>{percSumAlc}%</strong> ·
              Analcoliche: <strong style={{ color: percSumAnalc === 100 ? "var(--success)" : "var(--danger)" }}>{percSumAnalc}%</strong>
            </div>
          )}

          {/* Alcolici */}
          <div>
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-sm"
              style={{ background: "none", border: "none", borderBottom: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text-secondary)" }}
              onClick={() => setOpenDrinksSection(p => ({ ...p, alc: !p.alc }))}
            >
              <span>🍷 Alcolici</span>
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{
                  color: percSumAlc === 100 ? "var(--success)" : "var(--danger)" }}>
                  {percSumAlc}%
                </span>
                {openDrinksSection.alc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {openDrinksSection.alc && (
              <div>
                {(drinks.alcolici || []).map((d, i) => {
                  const bot   = calcBot(d.perc, d.drinksPerBot);
                  const costo = calcCosto(d.perc, d.drinksPerBot, d.price);
                  return (
                    <div key={i} className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{fmt(costo)}</span>
                          <button onClick={() => deleteDrink("alcolici", i)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                        {ospiti} osp × {drinksXpersona} drinks × {d.perc}% ÷ {d.drinksPerBot} = <strong>{bot} bott.</strong> × €{d.price}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>% drinks</p>
                          <input type="number" className="input-base text-sm" value={d.perc}
                            min="0" max="100" step="1"
                            onChange={e => updateDrink("alcolici", i, "perc", e.target.value)} />
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Drinks/bott.</p>
                          <input type="number" className="input-base text-sm" value={d.drinksPerBot}
                            min="1" step="1"
                            onChange={e => updateDrink("alcolici", i, "drinksPerBot", e.target.value)} />
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>€/bott.</p>
                          <input type="number" className="input-base text-sm" value={d.price}
                            min="0" step="0.5"
                            onChange={e => updateDrink("alcolici", i, "price", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
                  style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => addDrink("alcolici")}>
                  <Plus size={15} /> Aggiungi alcolico
                </button>
              </div>
            )}
          </div>

          {/* Analcoliche */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-sm"
              style={{ background: "none", border: "none", borderBottom: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text-secondary)" }}
              onClick={() => setOpenDrinksSection(p => ({ ...p, analc: !p.analc }))}
            >
              <span>🥤 Analcoliche</span>
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{
                  color: percSumAnalc === 100 ? "var(--success)" : "var(--danger)" }}>
                  {percSumAnalc}%
                </span>
                {openDrinksSection.analc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {openDrinksSection.analc && (
              <div>
                {(drinks.analcoliche || []).map((d, i) => {
                  const bot   = calcBot(d.perc, d.drinksPerBot);
                  const costo = calcCosto(d.perc, d.drinksPerBot, d.price);
                  return (
                    <div key={i} className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{fmt(costo)}</span>
                          <button onClick={() => deleteDrink("analcoliche", i)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                        {ospiti} osp × {drinksXpersona} drinks × {d.perc}% ÷ {d.drinksPerBot} = <strong>{bot} bott.</strong> × €{d.price}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>% drinks</p>
                          <input type="number" className="input-base text-sm" value={d.perc}
                            min="0" max="100" step="1"
                            onChange={e => updateDrink("analcoliche", i, "perc", e.target.value)} />
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Drinks/bott.</p>
                          <input type="number" className="input-base text-sm" value={d.drinksPerBot}
                            min="1" step="1"
                            onChange={e => updateDrink("analcoliche", i, "drinksPerBot", e.target.value)} />
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>€/bott.</p>
                          <input type="number" className="input-base text-sm" value={d.price}
                            min="0" step="0.5"
                            onChange={e => updateDrink("analcoliche", i, "price", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
                  style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => addDrink("analcoliche")}>
                  <Plus size={15} /> Aggiungi analcolico
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
