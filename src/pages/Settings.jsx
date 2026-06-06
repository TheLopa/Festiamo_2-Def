import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { useTheme } from "../context/ThemeContext";
import { Settings as SettingsIcon, AlertTriangle } from "lucide-react";

const PRESETS = [
  { key: "compleanno", emoji: "🎂" },
  { key: "laurea",     emoji: "🎓" },
  { key: "nubilato",   emoji: "💍" },
  { key: "aziendale",  emoji: "🏢" },
  { key: "cena",       emoji: "🍽️" },
  { key: "battesimo",  emoji: "✝️" },
  { key: "altro",      emoji: "🎉" },
];

export default function Settings() {
  const { eventId } = useParams();
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();

  const [event, setEvent]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [showWarning, setShowWarning]     = useState(false);
  const [pendingPreset, setPendingPreset] = useState(null);
  const [toastVisible, setToastVisible]   = useState(false);

  useEffect(() => { fetchEvent(); }, [eventId]);

  async function fetchEvent() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    setEvent(data);
    setLoading(false);
  }

  const autoSave = useCallback(async (updates) => {
    setSaving(true);
    await supabase.from("events").update(updates).eq("id", eventId);
    setSaving(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }, [eventId]);

  function handleField(field, value) {
    setEvent(prev => ({ ...prev, [field]: value }));
    clearTimeout(window._saveTimer);
    window._saveTimer = setTimeout(() => autoSave({ [field]: value }), 800);
  }

  function handlePresetClick(key) {
    if (key === event?.preset) return;
    setPendingPreset(key);
    setShowWarning(true);
  }

  async function confirmPreset() {
    setEvent(prev => ({ ...prev, preset: pendingPreset }));
    setShowWarning(false);
    await autoSave({ preset: pendingPreset });
    setPendingPreset(null);
  }

  function cancelPreset() {
    setShowWarning(false);
    setPendingPreset(null);
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
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "var(--brand-light)" }}
        >
          <SettingsIcon size={20} style={{ color: "var(--brand)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t("settings")}
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

      {/* Dettagli evento */}
      <p className="section-label">Dettagli evento</p>
      <div className="card mb-4">
        <div className="mb-4">
          <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {t("event_name")}
          </label>
          <input
            type="text"
            className="input-base"
            value={event?.name || ""}
            onChange={e => handleField("name", e.target.value)}
            placeholder="Es. Compleanno Sofia"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {t("event_date")}
          </label>
          <input
            type="date"
            className="input-base"
            value={event?.event_date || ""}
            onChange={e => handleField("event_date", e.target.value)}
          />
        </div>
      </div>

      {/* Parametri */}
      <p className="section-label">Parametri</p>
      <div className="card mb-4">
        <div className="mb-4">
          <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {t("planned_guests")}
          </label>
          <div className="stepper">
            <button
              className="stepper-btn"
              onClick={() => handleField("planned_guests", Math.max(1, (event?.planned_guests || 1) - 1))}
            >−</button>
            <span className="stepper-val">{event?.planned_guests || 0}</span>
            <button
              className="stepper-btn"
              onClick={() => handleField("planned_guests", (event?.planned_guests || 0) + 1)}
            >+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {t("drinks_per_person")}
          </label>
          <div className="stepper">
            <button
              className="stepper-btn"
              onClick={() => handleField("drinks_per_person", Math.max(1, (event?.drinks_per_person || 1) - 1))}
            >−</button>
            <span className="stepper-val">{event?.drinks_per_person || 0}</span>
            <button
              className="stepper-btn"
              onClick={() => handleField("drinks_per_person", (event?.drinks_per_person || 0) + 1)}
            >+</button>
          </div>
        </div>
      </div>

      {/* Preset */}
      <p className="section-label">{t("preset")}</p>
      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePresetClick(p.key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: event?.preset === p.key ? "var(--brand-light)" : "var(--bg-secondary)",
                color: event?.preset === p.key ? "var(--brand-text)" : "var(--text-primary)",
                border: event?.preset === p.key
                  ? "2px solid var(--brand)"
                  : "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <span>{p.emoji}</span>
              <span>{t(`preset_${p.key}`)}</span>
            </button>
          ))}
        </div>

        {showWarning && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: "var(--warning-light)", border: "1px solid var(--warning)" }}
          >
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: "var(--warning-text)" }}>
                {t("preset_warning")}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 py-2 text-sm" onClick={cancelPreset}>
                {t("cancel")}
              </button>
              <button
                onClick={confirmPreset}
                className="flex-1 py-2 text-sm rounded-full font-semibold"
                style={{
                  background: "var(--danger-light)",
                  color: "var(--danger-text)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("change_preset")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferenze app */}
      <p className="section-label">{t("app_settings")}</p>
      <div className="card mb-4">
        <div className="mb-4">
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
            {t("theme")}
          </label>
          <div className="flex gap-2">
            {["dark", "light"].map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: theme === th ? "var(--brand-light)" : "var(--bg-secondary)",
                  color: theme === th ? "var(--brand-text)" : "var(--text-secondary)",
                  border: theme === th ? "2px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                {th === "dark" ? `🌙 ${t("theme_dark")}` : `☀️ ${t("theme_light")}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
            {t("language")}
          </label>
          <div className="flex gap-2">
            {["it", "en"].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: lang === l ? "var(--brand-light)" : "var(--bg-secondary)",
                  color: lang === l ? "var(--brand-text)" : "var(--text-secondary)",
                  border: lang === l ? "2px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                {l === "it" ? `🇮🇹 ${t("lang_it")}` : `🇬🇧 ${t("lang_en")}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
