import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sparkles } from "lucide-react";

export default function SurveyForm() {
  const { eventId } = useParams();

  const [form, setForm]         = useState({ nome: "", email: "", conferma: null, genere: null });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  async function handleSubmit() {
    if (!form.nome.trim() || !form.email.trim() || !form.conferma) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("survey_responses").insert({
      event_id: eventId,
      respondent_name: form.nome.trim(),
      respondent_email: form.email.trim(),
      gender: form.genere,
      confirmation: form.conferma,
      is_in_guest_list: false,
    });
    if (err) {
      setError("Si è verificato un errore. Riprova.");
      setSaving(false);
    } else {
      setSubmitted(true);
    }
  }

  const canSubmit = form.nome.trim() && form.email.trim() && form.conferma && !saving;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "var(--bg-primary)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--success-light)" }}>
            <span style={{ fontSize: 32 }}>✓</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Risposta inviata!
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Grazie per aver risposto. L'organizzatore è stato notificato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-sm mx-auto">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--brand)" }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Festiamo</span>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Hero */}
          <div className="px-5 py-5" style={{ background: "var(--brand-light)" }}>
            <h1 className="text-lg font-bold mb-1" style={{ color: "var(--brand-text)" }}>
              Conferma la tua partecipazione
            </h1>
            <p className="text-sm" style={{ color: "var(--brand-text)", opacity: 0.8 }}>
              Compila il form per far sapere se ci sarai
            </p>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Nome e cognome
              </label>
              <input type="text" className="input-base" placeholder="Mario Rossi"
                value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                autoComplete="name" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input type="email" className="input-base" placeholder="mario@email.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email" />
            </div>

            {/* Conferma */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Partecipi?
              </label>
              <div className="space-y-2">
                {[
                  { val: "yes", label: "✓  Sì, ci sarò",        color: "var(--success)" },
                  { val: "no",  label: "✗  No, non posso venire", color: "var(--danger)"  },
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => setForm(p => ({ ...p, conferma: opt.val }))}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left"
                    style={{
                      background: form.conferma === opt.val ? "var(--bg-secondary)" : "var(--bg-primary)",
                      border: form.conferma === opt.val ? `2px solid ${opt.color}` : "1px solid var(--border)",
                      color: "var(--text-primary)", cursor: "pointer",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genere */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Genere <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(facoltativo)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "M",    label: "M" },
                  { val: "F",    label: "F" },
                  { val: "altro",label: "Altro" },
                  { val: null,   label: "Preferisco non dirlo" },
                ].map(opt => (
                  <button key={String(opt.val)}
                    onClick={() => setForm(p => ({ ...p, genere: opt.val }))}
                    className="py-2.5 rounded-xl text-sm text-center"
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

            {error && (
              <p className="text-sm text-center" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <button
              className="btn-primary w-full py-3 text-base"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {saving ? "Invio in corso..." : "Invia risposta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
