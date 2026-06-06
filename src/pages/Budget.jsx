import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { Plus, Trash2, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";

export default function Budget() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [openCats, setOpenCats]     = useState({});
  const [addForms, setAddForms]     = useState({});
  const [newItems, setNewItems]     = useState({});

  useEffect(() => { fetchData(); }, [eventId]);

  async function fetchData() {
    const { data: cats } = await supabase
      .from("budget_categories")
      .select("*, budget_items(*)")
      .eq("event_id", eventId)
      .order("sort_order");

    if (cats && cats.length > 0) {
      setCategories(cats);
      const open = {};
      cats.forEach(c => { open[c.id] = true; });
      setOpenCats(open);
    } else {
      await createDefaultCategories();
    }
    setLoading(false);
  }

  async function createDefaultCategories() {
    const defaults = ["Catering", "Musica", "Location", "Bevande", "Extra"];
    const { data: cats } = await supabase
      .from("budget_categories")
      .insert(defaults.map((name, i) => ({
        event_id: eventId, name, sort_order: i
      })))
      .select();
    if (cats) {
      const withItems = cats.map(c => ({ ...c, budget_items: [] }));
      setCategories(withItems);
      const open = {};
      cats.forEach(c => { open[c.id] = true; });
      setOpenCats(open);
    }
  }

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  const totals = categories.reduce((acc, cat) => {
    const items = cat.budget_items || [];
    const prev = items.reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);
    const real = items.reduce((s, i) => s + (parseFloat(i.actual_spend) || 0), 0);
    return { prev: acc.prev + prev, real: acc.real + real };
  }, { prev: 0, real: 0 });

  const diff = totals.real - totals.prev;

  function fmt(n) {
    return "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");
  }

  function fmtDiff(n) {
    return (n > 0 ? "+" : n < 0 ? "-" : "") + "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");
  }

  async function updateItem(itemId, catId, field, value) {
    const num = parseFloat(value) || 0;
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        budget_items: cat.budget_items.map(item =>
          item.id === itemId ? { ...item, [field]: num } : item
        )
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
    const form = newItems[catId] || {};
    const label = form.label?.trim();
    if (!label) return;
    const prev = parseFloat(form.prev) || 0;
    const real = parseFloat(form.real) || 0;
    const { data } = await supabase
      .from("budget_items")
      .insert({
        category_id: catId,
        event_id: eventId,
        label,
        kind: "fixed",
        unit_cost: prev,
        actual_spend: real,
      })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "var(--success-light)" }}
        >
          <BarChart2 size={20} style={{ color: "var(--success)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t("budget")}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : t("autosave")}
          </p>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
            {t("saved")} ✓
          </span>
        )}
      </div>

      {/* Totali */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card">
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{t("budgeted")}</p>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(totals.prev)}</p>
        </div>
        <div className="card">
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{t("spent")}</p>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(totals.real)}</p>
        </div>
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{t("difference")}</p>
          <p
            className="text-xl font-bold"
            style={{ color: diff > 0 ? "var(--danger)" : diff < 0 ? "var(--success)" : "var(--text-tertiary)" }}
          >
            {fmtDiff(diff)}
          </p>
        </div>
      </div>

      {/* Categorie */}
      {categories.map(cat => {
        const items = cat.budget_items || [];
        const catPrev = items.reduce((s, i) => s + (parseFloat(i.unit_cost) || 0), 0);
        const catReal = items.reduce((s, i) => s + (parseFloat(i.actual_spend) || 0), 0);
        const isOpen = openCats[cat.id] !== false;

        return (
          <div
            key={cat.id}
            className="card mb-3"
            style={{ padding: 0, overflow: "hidden" }}
          >
            {/* Header categoria */}
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              style={{
                background: "var(--bg-secondary)",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setOpenCats(p => ({ ...p, [cat.id]: !isOpen }))}
            >
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {cat.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {fmt(catPrev)} prev · {fmt(catReal)} reale
                </span>
                {isOpen
                  ? <ChevronUp size={16} style={{ color: "var(--text-tertiary)" }} />
                  : <ChevronDown size={16} style={{ color: "var(--text-tertiary)" }} />
                }
              </div>
            </button>

            {isOpen && (
              <div>
                {/* Intestazioni colonne */}
                {items.length > 0 && (
                  <div
                    className="grid px-4 py-2 text-xs"
                    style={{
                      gridTemplateColumns: "1fr 70px 70px 60px 32px",
                      gap: "4px",
                      color: "var(--text-tertiary)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span>Voce</span>
                    <span style={{ textAlign: "right" }}>Prev.</span>
                    <span style={{ textAlign: "right" }}>Reale</span>
                    <span style={{ textAlign: "right" }}>Diff.</span>
                    <span />
                  </div>
                )}

                {/* Voci */}
                {items.map(item => {
                  const d = (parseFloat(item.actual_spend) || 0) - (parseFloat(item.unit_cost) || 0);
                  return (
                    <div
                      key={item.id}
                      className="grid px-4 py-2 items-center"
                      style={{
                        gridTemplateColumns: "1fr 70px 70px 60px 32px",
                        gap: "4px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {item.label}
                      </span>
                      <input
                        type="number"
                        className="input-base text-right text-xs px-1 py-1"
                        style={{ minWidth: 0 }}
                        value={item.unit_cost || ""}
                        placeholder="0"
                        onChange={e => updateItem(item.id, cat.id, "unit_cost", e.target.value)}
                      />
                      <input
                        type="number"
                        className="input-base text-right text-xs px-1 py-1"
                        style={{ minWidth: 0 }}
                        value={item.actual_spend || ""}
                        placeholder="0"
                        onChange={e => updateItem(item.id, cat.id, "actual_spend", e.target.value)}
                      />
                      <span
                        className="text-xs font-medium text-right"
                        style={{
                          color: d > 0 ? "var(--danger)" : d < 0 ? "var(--success)" : "var(--text-tertiary)",
                        }}
                      >
                        {fmtDiff(d)}
                      </span>
                      <button
                        className="btn-ghost p-1"
                        style={{ color: "var(--text-tertiary)" }}
                        onClick={() => deleteItem(item.id, cat.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* Form aggiungi voce */}
                {addForms[cat.id] ? (
                  <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <input
                      type="text"
                      className="input-base mb-2"
                      placeholder={t("item_name")}
                      value={newItems[cat.id]?.label || ""}
                      onChange={e => setNewItems(p => ({
                        ...p, [cat.id]: { ...p[cat.id], label: e.target.value }
                      }))}
                    />
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        className="input-base flex-1"
                        placeholder="Preventivo €"
                        value={newItems[cat.id]?.prev || ""}
                        onChange={e => setNewItems(p => ({
                          ...p, [cat.id]: { ...p[cat.id], prev: e.target.value }
                        }))}
                      />
                      <input
                        type="number"
                        className="input-base flex-1"
                        placeholder="Reale €"
                        value={newItems[cat.id]?.real || ""}
                        onChange={e => setNewItems(p => ({
                          ...p, [cat.id]: { ...p[cat.id], real: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary flex-1 py-2 text-sm"
                        onClick={() => setAddForms(p => ({ ...p, [cat.id]: false }))}
                      >
                        {t("cancel")}
                      </button>
                      <button
                        className="btn-primary flex-1 py-2 text-sm"
                        onClick={() => addItem(cat.id)}
                      >
                        {t("add")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{
                      color: "var(--brand)",
                      background: "none",
                      border: "none",
                      borderTop: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                    onClick={() => setAddForms(p => ({ ...p, [cat.id]: true }))}
                  >
                    <Plus size={15} /> {t("add_item")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
