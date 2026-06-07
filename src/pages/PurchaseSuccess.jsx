import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("events")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setEventId(data.id);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleContinue() {
    if (eventId) {
      navigate(`/eventi/${eventId}/impostazioni`);
    } else {
      navigate("/eventi");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-secondary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "Inter,system-ui,sans-serif",
    }}>
      {/* Brand */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:32 }}>
        <div style={{
          width:40, height:40, borderRadius:12,
          background:"var(--brand)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <span style={{ fontSize:18 }}>✨</span>
        </div>
        <span style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>Festiamo</span>
      </div>

      {/* Card */}
      <div style={{
        width:"100%", maxWidth:380,
        background:"var(--bg-primary)",
        border:"1px solid var(--border)",
        borderRadius:20,
        padding:32,
        textAlign:"center",
      }}>
        {loading ? (
          <>
            <div style={{
              width:56, height:56, borderRadius:"50%",
              background:"var(--brand-light)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px",
              fontSize:28,
            }}>
              ⏳
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px", color:"var(--text-primary)" }}>
              Conferma in corso...
            </h1>
            <p style={{ fontSize:14, color:"var(--text-secondary)", margin:0, lineHeight:1.6 }}>
              Stiamo verificando il pagamento. Un momento.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width:56, height:56, borderRadius:"50%",
              background:"var(--success-light)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px",
              fontSize:28,
            }}>
              ✅
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px", color:"var(--text-primary)" }}>
              Pagamento completato!
            </h1>
            <p style={{ fontSize:14, color:"var(--text-secondary)", margin:"0 0 24px", lineHeight:1.6 }}>
              Il tuo evento è stato creato. Ora scegli il tipo di evento e inizia a organizzare.
            </p>
            <button
              onClick={handleContinue}
              style={{
                width:"100%",
                background:"var(--brand)",
                color:"#fff",
                border:"none",
                borderRadius:12,
                padding:"13px",
                fontSize:15,
                fontWeight:600,
                cursor:"pointer",
              }}
            >
              Configura il tuo evento →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
