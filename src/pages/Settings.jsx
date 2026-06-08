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
  const { theme, setTheme }  = useTheme();

  const [event,        setEvent]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toastMsg,     setToastMsg]     = useState("");
  const [showWarning,  setShowWarning]  = useState(false);
  const [pendingPreset,setPendingPreset]= useState(null);

  useEffect(() => { fetchEvent(); }, [eventId]);

  function showToast(msg = "Salvato") {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function fetchEvent() {
    const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
    setEvent(data);
    setLoading(false);
  }

  const autoSave = useCallback(async (updates) => {
    setSaving(true);
    await supabase.from("events").update(updates).eq("id", eventId);
    setSaving(false);
    showToast();
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

  const inputStyle = {
    background:"var(--bg-primary)", border:"1px solid var(--border)",
    borderRadius:10, padding:"11px 12px", color:"var(--text-primary)",
    fontSize:15, width:"100%", boxSizing:"border-box",
  };

  const cardStyle = {
    background:"var(--bg-secondary)", border:"1px solid var(--border)",
    borderRadius:16, padding:"16px", marginBottom:12,
  };

  const labelStyle = {
    display:"block", fontSize:13, fontWeight:500,
    color:"var(--text-secondary)", marginBottom:8,
  };

  const sectionLabel = {
    fontSize:10, fontWeight:600, letterSpacing:"0.1em",
    textTransform:"uppercase", color:"var(--text-tertiary)",
    margin:"0 0 8px",
  };

  const segBtn = (active) => ({
    flex:1, padding:"10px 8px", borderRadius:10,
    fontSize:13, fontWeight: active ? 600 : 400, cursor:"pointer",
    background: active ? "var(--brand-light)" : "var(--bg-primary)",
    color:      active ? "var(--brand)"       : "var(--text-secondary)",
    border:     active ? "2px solid var(--brand)" : "1px solid var(--border)",
    WebkitTapHighlightColor:"transparent",
    transition:"background 0.15s, color 0.15s, border 0.15s",
  });

  const stepperBtn = {
    width:44, height:44, borderRadius:10,
    background:"var(--bg-primary)", border:"1px solid var(--border)",
    fontSize:22, cursor:"pointer", color:"var(--text-primary)",
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0, WebkitTapHighlightColor:"transparent",
  };

  return (
    <div style={{ paddingBottom:40 }}>

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
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background:"var(--brand-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <SettingsIcon size={20} style={{ color:"var(--brand)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>
            {t("settings")}
          </h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : t("autosave")}
          </p>
        </div>
      </div>

      {/* ── Dettagli evento ── */}
      <p style={sectionLabel}>Dettagli evento</p>
      <div style={cardStyle}>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>{t("event_name")}</label>
          <input
            type="text" style={inputStyle}
            value={event?.name || ""} placeholder="Es. Compleanno Sofia"
            onChange={e => handleField("name", e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>{t("event_date")}</label>
          <input
            type="date" style={inputStyle}
            value={event?.event_date || ""}
            onChange={e => handleField("event_date", e.target.value)}
          />
        </div>
      </div>

      {/* ── Parametri ── */}
      <p style={sectionLabel}>Parametri</p>
      <div style={cardStyle}>
        {/* Ospiti */}
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>{t("planned_guests")}</label>
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:"var(--bg-primary)", border:"1px solid var(--border)",
            borderRadius:12, padding:4,
          }}>
            <button
              style={stepperBtn}
              onClick={() => handleField("planned_guests", Math.max(1, (event?.planned_guests || 1) - 1))}
            >−</button>
            <span style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>
              {event?.planned_guests || 0}
            </span>
            <button
              style={stepperBtn}
              onClick={() => handleField("planned_guests", (event?.planned_guests || 0) + 1)}
            >+</button>
          </div>
        </div>

        {/* Drinks per persona */}
        <div>
          <label style={labelStyle}>{t("drinks_per_person")}</label>
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:"var(--bg-primary)", border:"1px solid var(--border)",
            borderRadius:12, padding:4,
          }}>
            <button
              style={stepperBtn}
              onClick={() => handleField("drinks_per_person", Math.max(0, (event?.drinks_per_person || 0) - 0.5))}
            >−</button>
            <span style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>
              {event?.drinks_per_person || 0}
            </span>
            <button
              style={stepperBtn}
              onClick={() => handleField("drinks_per_person", (event?.drinks_per_person || 0) + 0.5)}
            >+</button>
          </div>
        </div>
      </div>

      {/* ── Preset ── */}
      <p style={sectionLabel}>{t("preset")}</p>
      <div style={cardStyle}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {PRESETS.map(p => {
            const active = event?.preset === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handlePresetClick(p.key)}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"12px 14px", borderRadius:12, cursor:"pointer",
                  background: active ? "var(--brand-light)" : "var(--bg-primary)",
                  color:      active ? "var(--brand)"       : "var(--text-primary)",
                  border:     active ? "2px solid var(--brand)" : "1px solid var(--border)",
                  fontSize:14, fontWeight: active ? 600 : 400,
                  transition:"background 0.15s, border 0.15s",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <span style={{ fontSize:20 }}>{p.emoji}</span>
                <span>{t(`preset_${p.key}`)}</span>
              </button>
            );
          })}
        </div>

        {/* Warning cambio preset */}
        {showWarning && (
          <div style={{
            marginTop:16, borderRadius:12, padding:"14px 16px",
            background:"var(--warning-light)", border:"1px solid var(--warning)",
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14 }}>
              <AlertTriangle size={18} style={{ color:"var(--warning)", flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:13, color:"var(--warning)", lineHeight:1.5 }}>
                {t("preset_warning")}
              </p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => { setShowWarning(false); setPendingPreset(null); }}
                style={{
                  flex:1, padding:"11px", borderRadius:10,
                  background:"var(--bg-secondary)", border:"1px solid var(--border)",
                  color:"var(--text-secondary)", fontSize:14, fontWeight:500, cursor:"pointer",
                }}
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmPreset}
                style={{
                  flex:1, padding:"11px", borderRadius:10,
                  background:"var(--danger-light)", border:"1px solid var(--danger)",
                  color:"var(--danger)", fontSize:14, fontWeight:600, cursor:"pointer",
                }}
              >
                {t("change_preset")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Preferenze app ── */}
      <p style={sectionLabel}>{t("app_settings")}</p>
      <div style={cardStyle}>
        {/* Tema */}
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>{t("theme")}</label>
          <div style={{ display:"flex", gap:10, background:"var(--bg-primary)",
            border:"1px solid var(--border)", borderRadius:10, padding:3 }}>
            {["dark", "light"].map(th => (
              <button key={th} onClick={() => setTheme(th)} style={segBtn(theme === th)}>
                {th === "dark" ? `🌙 ${t("theme_dark")}` : `☀️ ${t("theme_light")}`}
              </button>
            ))}
          </div>
        </div>

        {/* Lingua */}
        <div>
          <label style={labelStyle}>{t("language")}</label>
          <div style={{ display:"flex", gap:10, background:"var(--bg-primary)",
            border:"1px solid var(--border)", borderRadius:10, padding:3 }}>
            {["it", "en"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={segBtn(lang === l)}>
                {l === "it" ? `🇮🇹 ${t("lang_it")}` : `🇬🇧 ${t("lang_en")}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
