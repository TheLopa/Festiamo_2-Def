import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { CheckCircle, Loader } from "lucide-react";

export default function PurchaseSuccess() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aspetta un secondo che il webhook Stripe crei l'evento
    const timer = setTimeout(async () => {
      await findNewEvent();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  async function findNewEvent() {
    // Trova l'evento appena creato (il più recente)
    const { data } = await supabase
      .from("events")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setEventId(data.id);
    }
    setLoading(false);
  }

  function handleContinue() {
    if (eventId) {
      navigate(`/eventi/${eventId}/impostazioni`);
    } else {
      navigate("/eventi");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-sm text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader
              size={40}
              className="animate-spin"
              style={{ color: "var(--brand)" }}
            />
            <p style={{ color: "var(--text-secondary)" }}>
              Conferma pagamento in corso...
            </p>
          </div>
        ) : (
          <div className="card">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--success-light)" }}
            >
              <CheckCircle size={32} style={{ color: "var(--success)" }} />
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Pagamento completato!
            </h1>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Il tuo evento è stato creato. Ora scegli il tipo di evento e inizia a organizzare.
            </p>
            <button
              className="btn-primary w-full py-3 text-base"
              onClick={handleContinue}
            >
              Configura il tuo evento →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
