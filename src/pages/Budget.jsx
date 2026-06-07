import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { Plus, Trash2, ChevronDown, ChevronUp, BarChart2, Info, X } from "lucide-react";

const DEFAULT_DRINKS = {
  alcolici: [
    { name: "Vino",     perc: 40, drinksPerBot: 5,  price: 6  },
    { name: "Birra",    perc: 35, drinksPerBot: 1,  price: 2  },
    { name: "Prosecco", perc: 10, drinksPerBot: 6,  price: 8  },
    { name: "Spirits",  perc: 15, drinksPerBot: 20, price: 15 },
  ],
  analcoliche: [
    { name: "Acqua",           perc: 50, drinksPerBot: 8, price: 1.5 },
    { name: "Succhi e bibite", perc: 30, drinksPerBot: 6, price: 2   },
    { name: "Soft drink",      perc: 20, drinksPerBot: 4, price: 2.5 },
  ],
};

function fmt(n) {
  return "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");
}
function fmtDiff(n) {
  return (n > 0 ? "+" : n < 0 ? "-" : "") + "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");
}

export default function Budget() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [event,      setEvent]      = useState(null);
  const [categories, setCategories] = useState([]);
  const [drinks,     setDrinks]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toastMsg,   setToastMsg]   = useState("");
  const [openCats,   setOpenCats]   = useState({});
  const [addForms,   setAddForms]   = useState({});
  const [newItems,   setNewItems]   = useState({});
  const [showDrinksInfo,    setShowDrinksInfo]    = useState(false);
  const [openDrinksSection, setOpenDrinksSection] = useState({ alc: true, analc: true });
  // Modal aggiungi voce
  const [modal, setModal] = useState(null); // { catId }
  const [modalForm, setModalForm] = useState({ label: "", prev: "", real: "" });
  // Modal aggiungi bevanda
  const [drinkModal, setDrinkModal] = useState(null); // { type }
  const [drinkForm, setDrinkForm]   = useState({ name: "", perc: "10", drinksPerBot: "6", price: "5" });

  useEffect(() => { fetchData(); }, [eventId]);

  function showToast(msg = t("saved")) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function fetchData() {
    const { data: ev } = await supabase
      .from("events")
      .select("planned_guests, drinks_per_person, preset")
      .eq("id", eventId)
      .single();
    setEvent(ev);

    const { data: cats } = await supabase
      .from("budget_categories")
      .select("*, budget_items(*)")
      .eq("event_id", eventId)
      .order("sort_order");

    if (cats && cats.length > 0) {
      const standard = cats.filter(c => c.name !== "Bevande");
      const bevCat   = cats.find(c => c.name === "Bevande");
      setCategories(standard);
      const open = {};
      standard.forEach(c => { open[c.id] = true; });
      setOpenCats(open);

      if (bevCat) {
        const items = bevCat.budget_items || [];
        const alc   = items.filter(i => i.formula_key === "alcolico").map(i => ({
          id: i.id, name: i.label,
          perc: i.percentage || 0, drinksPerBot: i.drinks_per_bottle || 1, price: i.unit_cost || 0,
        }));
        const analc = items.filter(i => i.formula_key === "analcolico").map(i => ({
          id: i.id, name: i.label,
          perc: i.percentage || 0, drinksPerBot: i.drinks_per_bottle || 1, price: i.unit_cost || 0,
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
      setCategories(cats.map(c => ({ ...c, budget_items: [] })));
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
      .select().single();
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
    const { data: createdItems } = await supabase.from("budget_items").insert(items).select();
    if (createdItems) {
      const alc   = createdItems.filter(i => i.formula_key === "alcolico").map(i => ({
        id: i.id, name: i.label, perc: i.percentage, drinksPerBot: i.drinks_per_bottle, price: i.unit_cost,
      }));
      const analc = createdItems.filter(i => i.formula_key === "analcolico").map(i => ({
        id: i.id, name: i.label, perc: i.percentage, drinksPerBot: i.drinks_per_bottle, price: i.unit_cost,
      }));
      setDrinks({ catId: bevCat.id, alcolici: alc, analcoliche: analc });
    }
  }

  const ospiti       = event?.planned_guests   || 0;
  const drinksXpers  = event?.drinks_per_person || 0;

  function calcBot(perc, drinksPerBot) {
    return Math.ceil((ospiti * drinksXpers * (perc / 100)) / drinksPerBot);
  }
  function calcCosto(perc, drinksPerBot, price) {
    return calcBot(perc, drinksPerBot) * price;
  }

  const totaleDrinks = drinks
    ? [...(drinks.alcolici || []), ...(drinks.analcoliche || [])].reduce(
        (s, d) => s + calcCosto(d.perc, d.drinksPerBot, d.price), 0
      )
    : 0;

  const totStandard = categories.reduce((acc, cat) => {
    const items = cat.budget_items || [];
    return {
      prev: acc.prev + items.reduce((s, i) => s + (parseFloat(i.unit_cost)    || 0), 0),
      real: acc.real + items.reduce((s, i) => s + (parseFloat(i.actual_spend) || 0), 0),
    };
  }, { prev: 0, real: 0 });

  const totPrev = totStandard.prev + totaleDrinks;
  const totReal = totStandard.real;
  const diff    = totReal - totPrev;

  async function updateItem(itemId, catId, field, value) {
    const num = parseFloat(value) || 0;
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return { ...cat, budget_items: cat.budget_items.map(item =>
        item.id === itemId ? { ...item, [field]: num } : item
      )};
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

  async function addItem() {
    if (!modal) return;
    const { catId } = modal;
    const label = modalForm.label?.trim();
    if (!label) return;
    const prev = parseFloat(modalForm.prev) || 0;
    const real = parseFloat(modalForm.real) || 0;
    const { data } = await supabase
      .from("budget_items")
      .insert({ category_id: catId, event_id: eventId, label, kind: "fixed", unit_cost: prev, actual_spend: real })
      .select().single();
    if (data) {
      setCategories(prev => prev.map(cat => {
        if (cat.id !== catId) return cat;
        return { ...cat, budget_items: [...cat.budget_items, data] };
      }));
    }
    setModal(null);
    setModalForm({ label: "", prev: "", real: "" });
    showToast();
  }

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
      : field === "drinksPerBot" ? "drinks_per_bottle" : "unit_cost";
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
    setDrinks(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
    if (drink?.id) await supabase.from("budget_items").delete().eq("id", drink.id);
    showToast();
  }

  async function addDrink() {
    if (!drinkModal) return;
    const { type } = drinkModal;
    const name = drinkForm.name?.trim();
    if (!name) return;
    const formulaKey = type === "alcolici" ? "alcolico" : "analcolico";
    const { data } = await supabase
      .from("budget_items")
      .insert({
        category_id: drinks.catId, event_id: eventId,
        label: name, kind: "formula", formula_key: formulaKey,
        percentage: parseFloat(drinkForm.perc) || 10,
        drinks_per_bottle: parseFloat(drinkForm.drinksPerBot) || 6,
        unit_cost: parseFloat(drinkForm.price) || 5,
        actual_spend: 0, is_variable: true,
      })
      .select().single();
    if (data) {
      setDrinks(prev => ({
        ...prev,
        [type]: [...prev[type], {
          id: data.id, name: data.label,
          perc: data.percentage, drinksPerBot: data.drinks_per_bottle, price: data.unit_cost,
        }],
      }));
    }
    setDrinkModal(null);
    setDrinkForm({ name: "", perc: "10", drinksPerBot: "6", price: "5" });
    showToast();
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

  const percSumAlc   = (drinks?.alcolici   || []).reduce((s, d) => s + (d.perc || 0), 0);
  const percSumAnalc = (drinks?.analcoliche || []).reduce((s, d) => s + (d.perc || 0), 0);

  const cardStyle = {
    background:"var(--bg-secondary)",
    border:"1px solid var(--border)",
    borderRadius:16, overflow:"hidden",
    marginBottom:12,
  };

  const inputStyle = {
    background:"var(--bg-primary)",
    border:"1px solid var(--border)",
    borderRadius:8, padding:"8px 10px",
    color:"var(--text-primary)", fontSize:14,
    width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ paddingBottom:32 }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"var(--success)", color:"#fff",
          padding:"8px 20px", borderRadius:20, fontSize:13, fontWeight:600,
          zIndex:100, pointerEvents:"none",
        }}>
          {toastMsg} ✓
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background:"var(--success-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <BarChart2 size={20} style={{ color:"var(--success)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>
            {t("budget")}
          </h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : t("autosave")}
          </p>
        </div>
      </div>

      {/* Totali 3 card */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        <div style={{ ...cardStyle, marginBottom:0, padding:"14px 14px 12px" }}>
          <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>Preventivato</p>
          <p style={{ margin:"4px 0 0", fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>{fmt(totPrev)}</p>
        </div>
        <div style={{ ...cardStyle, marginBottom:0, padding:"14px 14px 12px" }}>
          <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>Speso</p>
          <p style={{ margin:"4px 0 0", fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>{fmt(totReal)}</p>
        </div>
        <div style={{ ...cardStyle, marginBottom:0, padding:"14px 14px 12px", gridColumn:"1/-1" }}>
          <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>Differenza (reale − prev.)</p>
          <p style={{ margin:"4px 0 0", fontSize:20, fontWeight:800,
            color: diff > 0 ? "var(--danger)" : diff < 0 ? "var(--success)" : "var(--text-tertiary)" }}>
            {fmtDiff(diff)}
          </p>
        </div>
      </div>

      {/* Categorie standard */}
      {categories.map(cat => {
        const items   = cat.budget_items || [];
        const catPrev = items.reduce((s, i) => s + (parseFloat(i.unit_cost)    || 0), 0);
        const catReal = items.reduce((s, i) => s + (parseFloat(i.actual_spend) || 0), 0);
        const isOpen  = openCats[cat.id] !== false;

        return (
          <div key={cat.id} style={cardStyle}>
            {/* Header categoria */}
            <button
              onClick={() => setOpenCats(p => ({ ...p, [cat.id]: !isOpen }))}
              style={{
                width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"13px 16px", background:"none", border:"none", cursor:"pointer",
                borderBottom: isOpen ? "1px solid var(--border)" : "none",
                WebkitTapHighlightColor:"transparent",
              }}
            >
              <span style={{ fontSize:15, fontWeight:600, color:"var(--text-primary)" }}>{cat.name}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--text-tertiary)" }}>
                  {fmt(catPrev)} prev
                </span>
                {isOpen
                  ? <ChevronUp size={16} style={{ color:"var(--text-tertiary)" }} />
                  : <ChevronDown size={16} style={{ color:"var(--text-tertiary)" }} />}
              </div>
            </button>

            {isOpen && (
              <div>
                {items.map(item => {
                  const d = (parseFloat(item.actual_spend) || 0) - (parseFloat(item.unit_cost) || 0);
                  return (
                    <div key={item.id} style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                      {/* Nome + diff + elimina */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:14, fontWeight:500, color:"var(--text-primary)", flex:1, marginRight:8 }}>
                          {item.label}
                        </span>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:13, fontWeight:600,
                            color: d > 0 ? "var(--danger)" : d < 0 ? "var(--success)" : "var(--text-tertiary)" }}>
                            {fmtDiff(d)}
                          </span>
                          <button
                            onClick={() => deleteItem(item.id, cat.id)}
                            style={{ background:"none", border:"none", cursor:"pointer",
                              padding:4, color:"var(--text-tertiary)", display:"flex" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      {/* Input prev + reale affiancati */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <div>
                          <p style={{ margin:"0 0 4px", fontSize:11, color:"var(--text-tertiary)" }}>Prev. €</p>
                          <input
                            type="number" style={inputStyle}
                            value={item.unit_cost || ""} placeholder="0"
                            onChange={e => updateItem(item.id, cat.id, "unit_cost", e.target.value)}
                          />
                        </div>
                        <div>
                          <p style={{ margin:"0 0 4px", fontSize:11, color:"var(--text-tertiary)" }}>Reale €</p>
                          <input
                            type="number" style={inputStyle}
                            value={item.actual_spend || ""} placeholder="0"
                            onChange={e => updateItem(item.id, cat.id, "actual_spend", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Aggiungi voce */}
                <button
                  onClick={() => { setModal({ catId: cat.id }); setModalForm({ label:"", prev:"", real:"" }); }}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:8,
                    padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
                    color:"var(--brand)", fontSize:14, fontWeight:500,
                    WebkitTapHighlightColor:"transparent",
                  }}
                >
                  <Plus size={16} /> Aggiungi voce
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Sezione Bevande */}
      {drinks && (
        <div style={cardStyle}>
          {/* Header bevande */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"13px 16px", borderBottom:"1px solid var(--border)",
          }}>
            <span style={{ fontSize:15, fontWeight:600, color:"var(--text-primary)" }}>🍷 Bevande</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, color:"var(--text-tertiary)" }}>{fmt(totaleDrinks)} prev.</span>
              <button
                onClick={() => setShowDrinksInfo(p => !p)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"var(--text-tertiary)", display:"flex", padding:4 }}
              >
                <Info size={16} />
              </button>
            </div>
          </div>

          {/* Info formula */}
          {showDrinksInfo && (
            <div style={{
              padding:"12px 16px", fontSize:12,
              background:"var(--brand-light)", color:"var(--brand-text, var(--brand))",
              borderBottom:"1px solid var(--border)", lineHeight:1.5,
            }}>
              Formula: ospiti × drinks/pers × % ÷ drinks/bott × €/bott<br/>
              Alcolici: <strong style={{ color: percSumAlc === 100 ? "var(--success)" : "var(--danger)" }}>{percSumAlc}%</strong>
              {" · "}Analcoliche: <strong style={{ color: percSumAnalc === 100 ? "var(--success)" : "var(--danger)" }}>{percSumAnalc}%</strong>
              <br/><span style={{ opacity:0.7 }}>Ogni gruppo deve sommare a 100%</span>
            </div>
          )}

          {/* Alcolici */}
          <button
            onClick={() => setOpenDrinksSection(p => ({ ...p, alc: !p.alc }))}
            style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"11px 16px", background:"none", border:"none",
              borderBottom:"1px solid var(--border)", cursor:"pointer",
              WebkitTapHighlightColor:"transparent",
            }}
          >
            <span style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>🍺 Alcolici</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12, fontWeight:600,
                color: percSumAlc === 100 ? "var(--success)" : "var(--danger)" }}>{percSumAlc}%</span>
              {openDrinksSection.alc ? <ChevronUp size={14} style={{ color:"var(--text-tertiary)" }}/> : <ChevronDown size={14} style={{ color:"var(--text-tertiary)" }}/>}
            </div>
          </button>

          {openDrinksSection.alc && (
            <div>
              {(drinks.alcolici || []).map((d, i) => {
                const bot   = calcBot(d.perc, d.drinksPerBot);
                const costo = calcCosto(d.perc, d.drinksPerBot, d.price);
                return (
                  <div key={i} style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{d.name}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"var(--success)" }}>{fmt(costo)}</span>
                        <button onClick={() => deleteDrink("alcolici", i)}
                          style={{ background:"none", border:"none", cursor:"pointer",
                            color:"var(--text-tertiary)", display:"flex", padding:4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin:"0 0 8px", fontSize:11, color:"var(--text-tertiary)" }}>
                      {ospiti} osp × {drinksXpers} drinks × {d.perc}% ÷ {d.drinksPerBot} = <strong>{bot} bott.</strong> × €{d.price}
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                      {[
                        { label:"% drinks", field:"perc",        val:d.perc,        min:0, max:100, step:1 },
                        { label:"Drinks/bott.", field:"drinksPerBot", val:d.drinksPerBot, min:1, step:1 },
                        { label:"€/bott.",  field:"price",       val:d.price,       min:0, step:0.5 },
                      ].map(({ label, field, val, ...rest }) => (
                        <div key={field}>
                          <p style={{ margin:"0 0 4px", fontSize:10, color:"var(--text-tertiary)" }}>{label}</p>
                          <input type="number" style={{ ...inputStyle, fontSize:13, padding:"7px 8px" }}
                            value={val} {...rest}
                            onChange={e => updateDrink("alcolici", i, field, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => { setDrinkModal({ type:"alcolici" }); setDrinkForm({ name:"", perc:"10", drinksPerBot:"6", price:"5" }); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
                  padding:"11px 16px", background:"none", border:"none", cursor:"pointer",
                  color:"var(--brand)", fontSize:13, WebkitTapHighlightColor:"transparent" }}
              >
                <Plus size={15} /> Aggiungi alcolico
              </button>
            </div>
          )}

          {/* Analcoliche */}
          <button
            onClick={() => setOpenDrinksSection(p => ({ ...p, analc: !p.analc }))}
            style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"11px 16px", background:"none", border:"none",
              borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}
          >
            <span style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>🥤 Analcoliche</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12, fontWeight:600,
                color: percSumAnalc === 100 ? "var(--success)" : "var(--danger)" }}>{percSumAnalc}%</span>
              {openDrinksSection.analc ? <ChevronUp size={14} style={{ color:"var(--text-tertiary)" }}/> : <ChevronDown size={14} style={{ color:"var(--text-tertiary)" }}/>}
            </div>
          </button>

          {openDrinksSection.analc && (
            <div>
              {(drinks.analcoliche || []).map((d, i) => {
                const bot   = calcBot(d.perc, d.drinksPerBot);
                const costo = calcCosto(d.perc, d.drinksPerBot, d.price);
                return (
                  <div key={i} style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{d.name}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"var(--success)" }}>{fmt(costo)}</span>
                        <button onClick={() => deleteDrink("analcoliche", i)}
                          style={{ background:"none", border:"none", cursor:"pointer",
                            color:"var(--text-tertiary)", display:"flex", padding:4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin:"0 0 8px", fontSize:11, color:"var(--text-tertiary)" }}>
                      {ospiti} osp × {drinksXpers} drinks × {d.perc}% ÷ {d.drinksPerBot} = <strong>{bot} bott.</strong> × €{d.price}
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                      {[
                        { label:"% drinks",    field:"perc",        val:d.perc,        min:0, max:100, step:1 },
                        { label:"Drinks/bott.", field:"drinksPerBot", val:d.drinksPerBot, min:1, step:1 },
                        { label:"€/bott.",     field:"price",       val:d.price,       min:0, step:0.5 },
                      ].map(({ label, field, val, ...rest }) => (
                        <div key={field}>
                          <p style={{ margin:"0 0 4px", fontSize:10, color:"var(--text-tertiary)" }}>{label}</p>
                          <input type="number" style={{ ...inputStyle, fontSize:13, padding:"7px 8px" }}
                            value={val} {...rest}
                            onChange={e => updateDrink("analcoliche", i, field, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => { setDrinkModal({ type:"analcoliche" }); setDrinkForm({ name:"", perc:"10", drinksPerBot:"6", price:"5" }); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
                  padding:"11px 16px", background:"none", border:"none", cursor:"pointer",
                  color:"var(--brand)", fontSize:13, WebkitTapHighlightColor:"transparent" }}
              >
                <Plus size={15} /> Aggiungi analcolico
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal aggiungi voce ── */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, zIndex:200,
          background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"flex-end",
        }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{
            width:"100%", background:"var(--bg-secondary)",
            borderRadius:"20px 20px 0 0", padding:"24px 20px 40px",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Aggiungi voce</h2>
              <button onClick={() => setModal(null)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Nome voce</p>
              <input type="text" style={{ ...inputStyle, fontSize:15 }} placeholder="es. DJ, Fotografo..."
                value={modalForm.label} autoFocus
                onChange={e => setModalForm(p => ({ ...p, label: e.target.value }))} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              <div>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Preventivo €</p>
                <input type="number" style={inputStyle} placeholder="0"
                  value={modalForm.prev}
                  onChange={e => setModalForm(p => ({ ...p, prev: e.target.value }))} />
              </div>
              <div>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Reale €</p>
                <input type="number" style={inputStyle} placeholder="0"
                  value={modalForm.real}
                  onChange={e => setModalForm(p => ({ ...p, real: e.target.value }))} />
              </div>
            </div>
            <button
              onClick={addItem}
              style={{
                width:"100%", padding:"14px", borderRadius:14,
                background:"var(--brand)", border:"none", cursor:"pointer",
                color:"#fff", fontSize:15, fontWeight:700,
              }}
            >
              Aggiungi
            </button>
          </div>
        </div>
      )}

      {/* ── Modal aggiungi bevanda ── */}
      {drinkModal && (
        <div style={{
          position:"fixed", inset:0, zIndex:200,
          background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"flex-end",
        }}
          onClick={e => { if (e.target === e.currentTarget) setDrinkModal(null); }}
        >
          <div style={{
            width:"100%", background:"var(--bg-secondary)",
            borderRadius:"20px 20px 0 0", padding:"24px 20px 40px",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>
                Aggiungi {drinkModal.type === "alcolici" ? "alcolico" : "analcolico"}
              </h2>
              <button onClick={() => setDrinkModal(null)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Nome</p>
              <input type="text" style={{ ...inputStyle, fontSize:15 }} placeholder="es. Aperol, Tè freddo..."
                value={drinkForm.name} autoFocus
                onChange={e => setDrinkForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                { label:"% drinks", key:"perc",        placeholder:"10" },
                { label:"Drinks/bott.", key:"drinksPerBot", placeholder:"6"  },
                { label:"€/bott.",  key:"price",       placeholder:"5"  },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p style={{ margin:"0 0 6px", fontSize:12, color:"var(--text-tertiary)" }}>{label}</p>
                  <input type="number" style={inputStyle} placeholder={placeholder}
                    value={drinkForm[key]}
                    onChange={e => setDrinkForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button
              onClick={addDrink}
              style={{
                width:"100%", padding:"14px", borderRadius:14,
                background:"var(--brand)", border:"none", cursor:"pointer",
                color:"#fff", fontSize:15, fontWeight:700,
              }}
            >
              Aggiungi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
