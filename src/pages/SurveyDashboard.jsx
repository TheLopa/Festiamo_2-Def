import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { ClipboardList, Copy, Download, Eye, EyeOff } from "lucide-react";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "var(--brand-light)",   fg: "var(--brand-text)"  },
  { bg: "var(--success-light)", fg: "var(--success-text)" },
  { bg: "var(--warning-light)", fg: "var(--warning-text)" },
  { bg: "var(--danger-light)",  fg: "var(--danger-text)"  },
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function SurveyDashboard() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [responses, setResponses]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState("dashboard"); // "dashboard" | "form"
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg]     = useState("");

  const surveyUrl = `${window.location.origin}/survey/${eventId}`;

  useEffect(() => { fetchResponses(); }, [eventId]);

  async function fetchResponses() {
    const { data } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false });
    setResponses(data || []);
    setLoading(false);
  }

  function showToast(msg = t("copied")) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      showToast(t("copied"));
    } catch {
      showToast(surveyUrl);
    }
  }

  function downloadCSV() {
    const rows = [["Nome", "Email", "Genere", "Conferma", "In lista", "Data"]];
    responses.forEach(r => {
      rows.push([
        r.respondent_name || "",
        r.respondent_email || "",
        r.gender || "",
        r.confirmation === "yes" ? "Confermato" : "Declinato",
        r.is_in_guest_list ? "Sì" : "No",
        new Date(r.submitted_at).toLocaleDateString("it-IT"),
      ]);
    });
    const csv  = rows.map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "survey_risposte.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const cntYes  = responses.filter(r => r.confirmation === "yes").length;
  const cntNo   = responses.filter(r => r.confirmation === "no").length;
  const cntNew  = responses.filter(r => !r.is_in_guest_list).length;

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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "var(--brand-light)" }}>
          <ClipboardList size={20} style={{ color: "var(--brand)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("survey")}</h1>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{toastMsg}</span>
        )}
      </div>

      {/* Toggle vista */}
      <div className="flex border rounded-xl overflow-hidden mb-5"
        style={{ border: "1px solid var(--border)" }}>
        <button onClick={() => setView("dashboard")}
          className="flex-1 py-2 text-sm flex items-center justify-center gap-1"
          style={{
            background: view === "dashboard" ? "var(--brand-light)" : "var(--bg-primary)",
            color: view === "dashboard" ? "var(--brand-text)" : "var(--text-secondary)",
            border: "none", cursor: "pointer",
          }}>
          <ClipboardList size={14} /> {t("dashboard_resp")}
        </button>
        <button onClick={() => setView("form")}
          className="flex-1 py-2 text-sm flex items-center justify-center gap-1"
          style={{
            background: view === "form" ? "var(--brand-light)" : "var(--bg-primary)",
            color: view === "form" ? "var(--brand-text)" : "var(--text-secondary)",
            border: "none", cursor: "pointer",
          }}>
          <Eye size={14} /> {t("form_preview")}
        </button>
      </div>

      {view === "dashboard" && (
        <>
          {/* Contatori */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="card text-center py-3">
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{responses.length}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Risposte</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-bold" style={{ color: "var(--success)" }}>{cntYes}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{t("confirmed")}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xl font-bold" style={{ color: "var(--warning)" }}>{cntNew}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Non in lista</p>
            </div>
          </div>

          {/* Link survey */}
          <div className="card mb-4" style={{ background: "var(--bg-secondary)" }}>
            <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
              {t("survey_link")}
            </p>
            <div className="flex gap-2 items-center">
              <p className="text-xs flex-1 truncate font-mono"
                style={{ color: "var(--text-tertiary)" }}>
                {surveyUrl}
              </p>
              <button onClick={copyLink}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 flex-shrink-0">
                <Copy size={13} /> {t("copy_link")}
              </button>
            </div>
          </div>

          {/* Lista risposte */}
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">{t("responses")}</p>
            {responses.length > 0 && (
              <button onClick={downloadCSV}
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}>
                <Download size={13} /> {t("download")}
              </button>
            )}
          </div>

          {responses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><span style={{ fontSize: "24px" }}>📋</span></div>
              <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Nessuna risposta ancora
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Condividi il link per raccogliere le conferme
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {responses.map((r, i) => {
                const name  = r.respondent_name || "Anonimo";
                const col   = avatarColor(name);
                const isYes = r.confirmation === "yes";
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < responses.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
                      style={{ background: col.bg, color: col.fg }}>
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                        {r.respondent_email || "—"} · {r.gender || "—"} · {new Date(r.submitted_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: isYes ? "var(--success-light)" : "var(--danger-light)",
                          color: isYes ? "var(--success-text)" : "var(--danger-text)",
                        }}>
                        {isYes ? t("confirmed") : t("declined")}
                      </span>
                      {!r.is_in_guest_list && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--warning-light)", color: "var(--warning-text)" }}>
                          Non in lista
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === "form" && (
        <SurveyFormPreview eventId={eventId} t={t} />
      )}
    </div>
  );
}

// ── Anteprima form pubblico ──────────────────────────────────
function SurveyFormPreview({ eventId, t }) {
  const [form, setForm]       = useState({ nome: "", email: "", conferma: null, genere: null });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function handleSubmit() {
    if (!form.nome || !form.email || !form.conferma) return;
    setSaving(true);
    await supabase.from("survey_responses").insert({
      event_id: eventId,
      respondent_name: form.nome,
      respondent_email: form.email,
      gender: form.genere,
      confirmation: form.conferma,
      is_in_guest_list: false,
    });
    setSaving(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card text-center py-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--success-light)" }}>
          <span style={{ fontSize: 28 }}>✓</span>
        </div>
        <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {t("response_sent")}
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          {t("response_thanks")}
        </p>
        <button className="btn-secondary text-sm px-4 py-2"
          onClick={() => { setSubmitted(false); setForm({ nome: "", email: "", conferma: null, genere: null }); }}>
          {t("send_another")}
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Hero form */}
      <div className="px-5 py-4" style={{ background: "var(--brand-light)" }}>
        <p className="text-base font-bold" style={{ color: "var(--brand-text)" }}>
          Conferma la tua partecipazione
        </p>
        <p className="text-sm" style={{ color: "var(--brand-text)", opacity: 0.8 }}>
          Compila il form per far sapere se ci sarai
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {t("full_name")}
          </label>
          <input type="text" className="input-base" placeholder="Mario Rossi"
            value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {t("email")}
          </label>
          <input type="email" className="input-base" placeholder="mario@email.com"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>

        {/* Conferma */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            {t("participate")}
          </label>
          <div className="space-y-2">
            {[
              { val: "yes", label: t("yes_coming"), color: "var(--success)" },
              { val: "no",  label: t("no_coming"),  color: "var(--danger)"  },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setForm(p => ({ ...p, conferma: opt.val }))}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left"
                style={{
                  background: form.conferma === opt.val ? "var(--bg-secondary)" : "var(--bg-primary)",
                  border: form.conferma === opt.val
                    ? `2px solid ${opt.color}`
                    : "1px solid var(--border)",
                  color: "var(--text-primary)", cursor: "pointer",
                }}>
                <span style={{ color: opt.color, fontSize: 18 }}>
                  {opt.val === "yes" ? "✓" : "✗"}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Genere */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            {t("gender")} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
              ({t("gender_optional")})
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: "M",    label: t("gender_m")    },
              { val: "F",    label: t("gender_f")    },
              { val: "altro",label: t("gender_other") },
              { val: null,   label: t("gender_skip") },
            ].map(opt => (
              <button key={String(opt.val)}
                onClick={() => setForm(p => ({ ...p, genere: opt.val }))}
                className="py-2 rounded-xl text-xs text-center"
                style={{
                  background: form.genere === opt.val ? "var(--brand-light)" : "var(--bg-secondary)",
                  color: form.genere === opt.val ? "var(--brand-text)" : "var(--text-secondary)",
                  border: form.genere === opt.val ? "2px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary w-full py-3"
          disabled={!form.nome || !form.email || !form.conferma || saving}
          onClick={handleSubmit}
        >
          {saving ? t("loading") : t("send_response")}
        </button>
      </div>
    </div>
  );
}
