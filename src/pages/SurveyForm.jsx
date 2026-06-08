import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sparkles } from "lucide-react";

export default function SurveyForm() {
  const { eventId } = useParams();

  const [form,      setForm]      = useState({ nome:"", email:"", conferma:null, genere:null });
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);

  const canSubmit = form.nome.trim() && form.email.trim() && form.conferma && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("survey_responses").insert({
      event_id:         eventId,
      respondent_name:  form.nome.trim(),
      respondent_email: form.email.trim(),
      gender:           form.genere,
      confirmation:     form.conferma,
      is_in_guest_list: false,
    });
    if (err) {
      setError("Si è verificato un errore. Riprova.");
      setSaving(false);
    } else {
      setSubmitted(true);
    }
  }

  const inputStyle = {
    background:"var(--bg-secondary)", border:"1px solid var(--border)",
    borderRadius:12, padding:"13px 14px", color:"var(--text-primary)",
    fontSize:16, width:"100%", boxSizing:"border-box", outline:"none",
  };

  /* ── Schermata di ringraziamento ── */
  if (submitted) {
    return (
      <div style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"32px 24px", background:"var(--bg-primary)",
      }}>
        <div style={{ width:"100%", maxWidth:400, textAlign:"center" }}>
          <div style={{
            width:72, height:72, borderRadius:"50%", margin:"0 auto 20px",
            background:"var(--success-light)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:36,
          }}>
            ✓
          </div>
          <h1 style={{ margin:"0 0 10px", fontSize:24, fontWeight:800, color:"var(--text-primary)" }}>
            Risposta inviata!
          </h1>
          <p style={{ margin:0, fontSize:15, color:"var(--text-secondary)", lineHeight:1.5 }}>
            Grazie per aver risposto. L'organizzatore è stato notificato.
          </p>
        </div>
      </div>
    );
  }

  /* ── Form principale ── */
  return (
    <div style={{
      minHeight:"100vh", background:"var(--bg-primary)",
      padding:"24px 16px 48px",
    }}>
      <div style={{ width:"100%", maxWidth:480, margin:"0 auto" }}>

        {/* Brand */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          gap:8, marginBottom:24,
        }}>
          <div style={{
            width:32, height:32, borderRadius:10,
            background:"var(--brand)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>Festiamo</span>
        </div>

        {/* Card form */}
        <div style={{
          background:"var(--bg-secondary)", border:"1px solid var(--border)",
          borderRadius:20, overflow:"hidden",
        }}>
          {/* Hero */}
          <div style={{ padding:"20px 20px 18px", background:"var(--brand-light)" }}>
            <h1 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800, color:"var(--brand)" }}>
              Conferma la tua partecipazione
            </h1>
            <p style={{ margin:0, fontSize:13, color:"var(--brand)", opacity:0.75 }}>
              Compila il form per far sapere se ci sarai
            </p>
          </div>

          <div style={{ padding:"20px 20px 28px", display:"flex", flexDirection:"column", gap:20 }}>

            {/* Nome */}
            <div>
              <p style={{ margin:"0 0 8px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>
                Nome e cognome
              </p>
              <input
                type="text" style={inputStyle} placeholder="Mario Rossi"
                value={form.nome} autoComplete="name"
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div>
              <p style={{ margin:"0 0 8px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>
                Email
              </p>
              <input
                type="email" style={inputStyle} placeholder="mario@email.com"
                value={form.email} autoComplete="email"
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            {/* Conferma */}
            <div>
              <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>
                Partecipi?
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { val:"yes", icon:"✓", label:"Sì, ci sarò",         color:"var(--success)" },
                  { val:"no",  icon:"✗", label:"No, non posso venire", color:"var(--danger)"  },
                ].map(opt => {
                  const active = form.conferma === opt.val;
                  return (
                    <button
                      key={opt.val}
                      onClick={() => setForm(p => ({ ...p, conferma: opt.val }))}
                      style={{
                        display:"flex", alignItems:"center", gap:14,
                        padding:"15px 16px", borderRadius:14, textAlign:"left", cursor:"pointer",
                        background: active ? "var(--bg-primary)" : "transparent",
                        border: active ? `2px solid ${opt.color}` : "1px solid var(--border)",
                        transition:"border 0.15s, background 0.15s",
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >
                      <span style={{
                        width:36, height:36, borderRadius:"50%", flexShrink:0,
                        background: active ? opt.color : "var(--bg-primary)",
                        border: active ? "none" : "1px solid var(--border)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, color: active ? "#fff" : "var(--text-tertiary)",
                        transition:"background 0.15s, color 0.15s",
                      }}>
                        {opt.icon}
                      </span>
                      <span style={{
                        fontSize:15, fontWeight: active ? 700 : 400,
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genere */}
            <div>
              <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>
                Genere{" "}
                <span style={{ fontSize:12, color:"var(--text-tertiary)", fontWeight:400 }}>
                  (facoltativo)
                </span>
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { val:"M",    label:"M 👨"              },
                  { val:"F",    label:"F 👩"              },
                  { val:"altro",label:"Altro"             },
                  { val:null,   label:"Preferisco non dirlo" },
                ].map(opt => {
                  const active = form.genere === opt.val;
                  return (
                    <button
                      key={String(opt.val)}
                      onClick={() => setForm(p => ({ ...p, genere: opt.val }))}
                      style={{
                        padding:"12px 8px", borderRadius:12, fontSize:14,
                        fontWeight: active ? 600 : 400, textAlign:"center", cursor:"pointer",
                        background: active ? "var(--brand-light)" : "var(--bg-primary)",
                        color:      active ? "var(--brand)"       : "var(--text-secondary)",
                        border:     active ? "2px solid var(--brand)" : "1px solid var(--border)",
                        transition:"border 0.15s, background 0.15s, color 0.15s",
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Errore */}
            {error && (
              <p style={{ margin:0, fontSize:13, color:"var(--danger)", textAlign:"center" }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width:"100%", padding:"16px", borderRadius:14,
                background: canSubmit ? "var(--brand)" : "var(--bg-primary)",
                border:"none", cursor: canSubmit ? "pointer" : "not-allowed",
                color: canSubmit ? "#fff" : "var(--text-tertiary)",
                fontSize:16, fontWeight:700,
                transition:"background 0.2s, color 0.2s",
                WebkitTapHighlightColor:"transparent",
              }}
            >
              {saving ? "Invio in corso..." : "Invia risposta"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
