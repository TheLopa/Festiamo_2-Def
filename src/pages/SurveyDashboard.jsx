import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { ClipboardList, Copy, Download, Eye } from "lucide-react";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "var(--brand-light)",   fg: "var(--brand)"   },
  { bg: "var(--success-light)", fg: "var(--success)"  },
  { bg: "var(--warning-light)", fg: "var(--warning)"  },
  { bg: "var(--danger-light)",  fg: "var(--danger)"   },
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function SurveyDashboard() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [responses, setResponses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState("dashboard");
  const [toastMsg,  setToastMsg]  = useState("");

  const surveyUrl = `${window.location.origin}/survey/${eventId}`;

  useEffect(() => { fetchResponses(); }, [eventId]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function fetchResponses() {
    const { data } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false });
    setResponses(data || []);
    setLoading(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      showToast("Link copiato ✓");
    } catch {
      showToast(surveyUrl);
    }
  }

  function downloadCSV() {
    const rows = [["Nome", "Email", "Genere", "Conferma", "In lista", "Data"]];
    responses.forEach(r => {
      rows.push([
        r.respondent_name  || "",
        r.respondent_email || "",
        r.gender           || "",
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
    showToast("Scaricato!");
  }

  const cntYes = responses.filter(r => r.confirmation === "yes").length;
  const cntNo  = responses.filter(r => r.confirmation === "no").length;
  const cntNew = responses.filter(r => !r.is_in_guest_list).length;

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

  const cardStyle = {
    background:"var(--bg-secondary)", border:"1px solid var(--border)",
    borderRadius:16, overflow:"hidden", marginBottom:12,
  };

  const segActive = (active) => ({
    flex:1, padding:"9px", fontSize:13, fontWeight: active ? 600 : 400,
    background: active ? "var(--brand-light)" : "transparent",
    color: active ? "var(--brand)" : "var(--text-secondary)",
    border:"none", cursor:"pointer", borderRadius:8,
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    WebkitTapHighlightColor:"transparent",
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
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background:"var(--brand-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <ClipboardList size={20} style={{ color:"var(--brand)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Survey</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {responses.length} {responses.length === 1 ? "risposta" : "risposte"}
          </p>
        </div>
        {responses.length > 0 && (
          <button
            onClick={downloadCSV}
            style={{
              display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
              borderRadius:10, background:"var(--bg-secondary)",
              border:"1px solid var(--border)", cursor:"pointer",
              color:"var(--text-primary)", fontSize:13,
            }}
          >
            <Download size={15}/> CSV
          </button>
        )}
      </div>

      {/* Segment control */}
      <div style={{
        display:"flex", background:"var(--bg-secondary)",
        border:"1px solid var(--border)", borderRadius:12, padding:3, gap:3, marginBottom:20,
      }}>
        <button onClick={() => setView("dashboard")} style={segActive(view === "dashboard")}>
          <ClipboardList size={14}/> Risposte
        </button>
        <button onClick={() => setView("form")} style={segActive(view === "form")}>
          <Eye size={14}/> Anteprima form
        </button>
      </div>

      {view === "dashboard" && (
        <>
          {/* Contatori */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label:"Risposte",   count:responses.length, color:"var(--text-primary)" },
              { label:"Confermati", count:cntYes,           color:"var(--success)"      },
              { label:"Non in lista", count:cntNew,         color:"var(--warning)"      },
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle, marginBottom:0, padding:"12px", textAlign:"center" }}>
                <p style={{ margin:0, fontSize:22, fontWeight:800, color:s.color }}>{s.count}</p>
                <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--text-tertiary)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Link survey */}
          <div style={{ ...cardStyle, padding:"14px 16px" }}>
            <p style={{ margin:"0 0 8px", fontSize:12, color:"var(--text-tertiary)" }}>
              Link pubblico del survey
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <p style={{
                flex:1, margin:0, fontSize:12, fontFamily:"monospace",
                color:"var(--text-tertiary)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {surveyUrl}
              </p>
              <button
                onClick={copyLink}
                style={{
                  flexShrink:0, display:"flex", alignItems:"center", gap:6,
                  padding:"8px 14px", borderRadius:10,
                  background:"var(--brand-light)", border:"1px solid var(--brand)",
                  color:"var(--brand)", fontSize:13, fontWeight:600, cursor:"pointer",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <Copy size={14}/> Copia
              </button>
            </div>
          </div>

          {/* Lista risposte */}
          {responses.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <p style={{ margin:"0 0 6px", fontSize:16, fontWeight:600, color:"var(--text-primary)" }}>
                Nessuna risposta ancora
              </p>
              <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)" }}>
                Condividi il link per raccogliere le conferme
              </p>
            </div>
          ) : (
            <div style={cardStyle}>
              {responses.map((r, i) => {
                const name  = r.respondent_name || "Anonimo";
                const col   = avatarColor(name);
                const isYes = r.confirmation === "yes";
                return (
                  <div key={r.id} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"12px 16px",
                    borderBottom: i < responses.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width:38, height:38, borderRadius:"50%", flexShrink:0,
                      background:col.bg, color:col.fg,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:13, fontWeight:700,
                    }}>
                      {initials(name)}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{
                        margin:0, fontSize:14, fontWeight:600, color:"var(--text-primary)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      }}>
                        {name}
                      </p>
                      <p style={{
                        margin:"2px 0 0", fontSize:11, color:"var(--text-tertiary)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      }}>
                        {r.respondent_email || "—"} · {r.gender || "—"} · {new Date(r.submitted_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>

                    {/* Badges */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                      <span style={{
                        fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:20,
                        background: isYes ? "var(--success-light)" : "var(--danger-light)",
                        color:      isYes ? "var(--success)"       : "var(--danger)",
                      }}>
                        {isYes ? "Confermato" : "Declinato"}
                      </span>
                      {!r.is_in_guest_list && (
                        <span style={{
                          fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:20,
                          background:"var(--warning-light)", color:"var(--warning)",
                        }}>
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
        <SurveyFormPreview eventId={eventId} />
      )}
    </div>
  );
}

// ── Anteprima form pubblico ──────────────────────────────────
function SurveyFormPreview({ eventId }) {
  const [form,      setForm]      = useState({ nome:"", email:"", conferma:null, genere:null });
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const inputStyle = {
    background:"var(--bg-primary)", border:"1px solid var(--border)",
    borderRadius:8, padding:"11px 12px", color:"var(--text-primary)",
    fontSize:15, width:"100%", boxSizing:"border-box",
  };

  async function handleSubmit() {
    if (!form.nome || !form.email || !form.conferma) return;
    setSaving(true);
    await supabase.from("survey_responses").insert({
      event_id: eventId,
      respondent_name:  form.nome,
      respondent_email: form.email,
      gender:           form.genere,
      confirmation:     form.conferma,
      is_in_guest_list: false,
    });
    setSaving(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{
        background:"var(--bg-secondary)", border:"1px solid var(--border)",
        borderRadius:16, padding:"40px 20px", textAlign:"center",
      }}>
        <div style={{
          width:60, height:60, borderRadius:"50%", margin:"0 auto 16px",
          background:"var(--success-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:28,
        }}>✓</div>
        <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>
          Risposta inviata!
        </p>
        <p style={{ margin:"0 0 20px", fontSize:14, color:"var(--text-secondary)" }}>
          Grazie per aver risposto
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ nome:"", email:"", conferma:null, genere:null }); }}
          style={{
            padding:"10px 24px", borderRadius:10,
            background:"var(--bg-primary)", border:"1px solid var(--border)",
            color:"var(--text-secondary)", fontSize:14, cursor:"pointer",
          }}
        >
          Invia un'altra risposta
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background:"var(--bg-secondary)", border:"1px solid var(--border)",
      borderRadius:16, overflow:"hidden",
    }}>
      {/* Hero */}
      <div style={{ padding:"18px 20px", background:"var(--brand-light)" }}>
        <p style={{ margin:0, fontSize:16, fontWeight:700, color:"var(--brand)" }}>
          Conferma la tua partecipazione
        </p>
        <p style={{ margin:"4px 0 0", fontSize:13, color:"var(--brand)", opacity:0.75 }}>
          Compila il form per far sapere se ci sarai
        </p>
      </div>

      <div style={{ padding:"20px 16px 24px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Nome */}
        <div>
          <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>
            Nome e cognome
          </p>
          <input type="text" style={inputStyle} placeholder="Mario Rossi"
            value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
        </div>

        {/* Email */}
        <div>
          <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>
            Email
          </p>
          <input type="email" style={inputStyle} placeholder="mario@email.com"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>

        {/* Conferma */}
        <div>
          <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>
            Partecipi?
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { val:"yes", label:"Sì, ci sarò",    icon:"✓", color:"var(--success)" },
              { val:"no",  label:"No, non posso",  icon:"✗", color:"var(--danger)"  },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setForm(p => ({ ...p, conferma: opt.val }))}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"13px 16px", borderRadius:12, textAlign:"left", cursor:"pointer",
                  background: form.conferma === opt.val ? "var(--bg-primary)" : "transparent",
                  border: form.conferma === opt.val
                    ? `2px solid ${opt.color}`
                    : "1px solid var(--border)",
                  color:"var(--text-primary)",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <span style={{ fontSize:20, color:opt.color, flexShrink:0 }}>{opt.icon}</span>
                <span style={{ fontSize:15, fontWeight: form.conferma === opt.val ? 600 : 400 }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Genere */}
        <div>
          <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>
            Genere <span style={{ fontSize:12, color:"var(--text-tertiary)", fontWeight:400 }}>(opzionale)</span>
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
            {[
              { val:"M",    label:"M"      },
              { val:"F",    label:"F"      },
              { val:"altro",label:"Altro"  },
              { val:null,   label:"Salta"  },
            ].map(opt => (
              <button
                key={String(opt.val)}
                onClick={() => setForm(p => ({ ...p, genere: opt.val }))}
                style={{
                  padding:"10px 4px", borderRadius:10, fontSize:13, fontWeight:500,
                  textAlign:"center", cursor:"pointer",
                  background: form.genere === opt.val ? "var(--brand-light)" : "var(--bg-primary)",
                  color:      form.genere === opt.val ? "var(--brand)"       : "var(--text-secondary)",
                  border:     form.genere === opt.val ? "2px solid var(--brand)" : "1px solid var(--border)",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!form.nome || !form.email || !form.conferma || saving}
          style={{
            width:"100%", padding:"14px", borderRadius:14,
            background: (!form.nome || !form.email || !form.conferma)
              ? "var(--bg-secondary)" : "var(--brand)",
            border:"none", cursor: (!form.nome || !form.email || !form.conferma) ? "not-allowed" : "pointer",
            color: (!form.nome || !form.email || !form.conferma) ? "var(--text-tertiary)" : "#fff",
            fontSize:15, fontWeight:700,
            transition:"background 0.2s, color 0.2s",
          }}
        >
          {saving ? "Invio in corso..." : "Invia risposta"}
        </button>
      </div>
    </div>
  );
}
