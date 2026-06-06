import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const APP_NAME  = "Festiamo";
const APP_PRICE = "€2,99";
const DEMO_URL  = "https://www.youtube.com/watch?v=INSERISCI_ID_QUI";

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const features = [
    { emoji:"📊", title:"Budget trasparente",        text:"Voci di spesa fisse e formule dinamiche. Preventivo vs reale con differenza in tempo reale." },
    { emoji:"✅", title:"Roadmap operativa",         text:"Task organizzati per categoria con scadenze e stati. Tutto tracciato, niente dimenticato." },
    { emoji:"👥", title:"Invitati sotto controllo",  text:"Lista gruppata con conferme, upload e download Excel. Ogni modifica si riflette automaticamente." },
    { emoji:"🎟️", title:"Presenze il giorno evento", text:"Check-in rapido con ricerca per nome. Gestisci anche i walk-in." },
    { emoji:"📋", title:"Survey con link",           text:"Un link, e i tuoi ospiti confermano. Le risposte aggiornano la lista automaticamente." },
    { emoji:"📈", title:"Simulatore scenari",        text:"Cosa succede se vengono 80 invece di 120? Simula costi e guadagni per ogni ipotesi." },
  ];

  const steps = [
    { title:"Acquista l'evento",            desc:`Un pagamento unico di ${APP_PRICE}. Nessun abbonamento.` },
    { title:"Scegli il preset",             desc:"Compleanno, laurea, festa aziendale e altri. Il preset precompila budget e roadmap." },
    { title:"Gestisci tutto da dashboard",  desc:"Budget, task, invitati, presenze e scenari — tutto in un posto, anche dal telefono." },
    { title:"Arriva al giorno organizzato", desc:"Check-in in tempo reale, nessuna chat dispersa, zero fogli Excel." },
  ];

  const presets = ["🎂 Compleanno","🎓 Laurea","💍 Addio al nubilato","🏢 Festa aziendale","🍽️ Cena privata","✝️ Battesimo / Comunione","🎉 Altro"];

  const pricingItems = [
    "Budget con voci fisse e formule dinamiche",
    "Roadmap con task, scadenze e stati",
    "Lista invitati + upload/download Excel",
    "Check-in presenze il giorno dell'evento",
    "Survey con link condivisibile",
    "Simulatore scenari costo/guadagno",
    "Dashboard con sintesi e avvisi",
    "Accesso da desktop e smartphone",
  ];

  const faqs = [
    { q:"Cosa include il pagamento?",       a:`Con ${APP_PRICE} una tantum ottieni accesso completo a tutte le funzionalità per quell'evento. Nessun abbonamento.` },
    { q:"Posso gestire più eventi?",         a:`Sì — ogni evento è un acquisto separato a ${APP_PRICE}. Puoi avere quanti eventi vuoi.` },
    { q:"Gli invitati devono registrarsi?",  a:"No. Ricevono un link alla survey e la compilano senza account." },
    { q:"Funziona da smartphone?",           a:"Sì, è progettato mobile-first. Il check-in presenze è pensato per l'uso da telefono." },
    { q:"Posso cambiare il preset dopo?",    a:"Sì dalle impostazioni, ma ti verrà chiesta conferma perché l'operazione azzera budget e roadmap." },
  ];

  const base = {
    page:      { minHeight:"100vh", background:"#0f172a", color:"#f8fafc", fontFamily:"Inter,system-ui,sans-serif", WebkitFontSmoothing:"antialiased" },
    container: { maxWidth:1100, margin:"0 auto", padding: isMobile ? "0 16px" : "0 24px" },

    // Header
    header:      { position:"sticky", top:0, zIndex:50, background:"rgba(15,23,42,0.9)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.08)" },
    headerInner: { maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, padding: isMobile ? "0 16px" : "0 24px" },
    logoIcon:    { width:34, height:34, borderRadius:10, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
    logoText:    { fontSize:17, fontWeight:700 },

    // Buttons
    btnPrimary:   { background:"#3b82f6", color:"#fff", border:"none", borderRadius:9999, padding: isMobile ? "11px 20px" : "12px 28px", fontSize: isMobile ? 14 : 15, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 },
    btnSecondary: { background:"#fff", color:"#0f172a", border:"none", borderRadius:9999, padding: isMobile ? "10px 18px" : "12px 24px", fontSize: isMobile ? 13 : 15, fontWeight:600, cursor:"pointer" },
    btnOutline:   { background:"rgba(255,255,255,0.05)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)", borderRadius:9999, padding: isMobile ? "11px 20px" : "12px 28px", fontSize: isMobile ? 14 : 15, fontWeight:600, cursor:"pointer" },
    btnGhost:     { background:"none", border:"none", color:"#94a3b8", fontSize:14, fontWeight:600, cursor:"pointer", padding:0 },

    // Section
    sectionLabel: { fontSize:13, fontWeight:600, color:"#60a5fa", marginBottom:10 },
    sectionTitle: { fontSize: isMobile ? 28 : 40, fontWeight:800, letterSpacing:"-0.03em", margin:"0 0 14px", lineHeight:1.15 },
    sectionSub:   { fontSize: isMobile ? 15 : 17, color:"#94a3b8", lineHeight:1.7, margin:0 },

    // Cards
    card: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding: isMobile ? 20 : 28 },
  };

  return (
    <div style={base.page}>

      {/* Header */}
      <header style={base.header}>
        <div style={base.headerInner}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={base.logoIcon}><span style={{ fontSize:15 }}>✨</span></div>
            <span style={base.logoText}>{APP_NAME}</span>
          </div>
          {!isMobile && (
            <nav style={{ display:"flex", gap:28, fontSize:14, color:"#94a3b8" }}>
              <a href="#features" style={{ color:"#94a3b8", textDecoration:"none" }}>Funzionalità</a>
              <a href="#how"      style={{ color:"#94a3b8", textDecoration:"none" }}>Come funziona</a>
              <a href="#pricing"  style={{ color:"#94a3b8", textDecoration:"none" }}>Prezzo</a>
              <a href="#faq"      style={{ color:"#94a3b8", textDecoration:"none" }}>FAQ</a>
            </nav>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {!isMobile && (
              <button style={base.btnGhost} onClick={() => navigate("/login")}>Accedi</button>
            )}
            <button style={base.btnSecondary} onClick={() => navigate("/register")}>
              {isMobile ? "Inizia" : "Inizia ora"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: isMobile ? "56px 16px 48px" : "100px 24px 80px", position:"relative", overflow:"hidden" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          {/* Testo */}
          <div style={{ maxWidth: isMobile ? "100%" : 600, marginBottom: isMobile ? 36 : 0 }}>
            <h1 style={{ fontSize: isMobile ? 34 : 58, fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, margin:"0 0 18px" }}>
              Niente più chat infinite per organizzare una festa.
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 18, color:"#94a3b8", lineHeight:1.7, margin:"0 0 28px" }}>
              {APP_NAME} centralizza budget, invitati, roadmap, presenze e survey in un'unica dashboard.
              Un pagamento di {APP_PRICE} per evento, nessun abbonamento.
            </p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
              <button style={base.btnPrimary} onClick={() => navigate("/register")}>
                Crea il tuo primo evento →
              </button>
              <button style={base.btnOutline} onClick={() => window.open(DEMO_URL,"_blank")}>
                Guarda la demo
              </button>
            </div>
            <p style={{ fontSize:12, color:"#64748b", margin:"0 0 8px" }}>{APP_PRICE} · Nessun abbonamento · Setup in 2 minuti</p>
            <p style={{ fontSize:13, color:"#cbd5e1", margin:0 }}>
              Hai già un account?{" "}
              <button style={{ background:"none", border:"none", color:"#93c5fd", fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"underline", padding:0 }}
                onClick={() => navigate("/login")}>
                Accedi
              </button>
            </p>
          </div>

          {/* Mock dashboard — nascosto su mobile piccolo */}
          {!isMobile && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center", marginTop:-200 }}>
              <div />
              <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:24 }}>
                <div style={{ background:"#1e293b", borderRadius:18, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                    <div>
                      <p style={{ fontSize:13, color:"#94a3b8", margin:"0 0 4px" }}>Compleanno Sofia</p>
                      <h3 style={{ fontSize:22, fontWeight:700, margin:0 }}>20 set 2025</h3>
                    </div>
                    <span style={{ background:"rgba(56,189,248,0.1)", color:"#38bdf8", borderRadius:20, padding:"4px 12px", fontSize:12 }}>78% pronto</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                    {[["Budget speso","€3.240","su €7.970 prev."],["Confermati","84/120","18 in attesa"]].map(([l,v,s]) => (
                      <div key={l} style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:14 }}>
                        <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 4px" }}>{l}</p>
                        <p style={{ fontSize:22, fontWeight:700, margin:"0 0 2px" }}>{v}</p>
                        <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                  {[["Confermare catering",true],["Inviare inviti",true],["Finalizzare playlist DJ",false],["Reminder finale ospiti",false]].map(([l,done]) => (
                    <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"9px 12px", display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#e2e8f0" }}>
                        <span style={{ color: done ? "#38bdf8" : "#475569" }}>{done ? "✓" : "○"}</span> {l}
                      </div>
                      <span style={{ fontSize:11, color:"#64748b" }}>{done ? "Fatto" : "Da fare"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding: isMobile ? "28px 16px" : "40px 24px" }}>
        <div style={{ ...base.container, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: isMobile ? 12 : 24, textAlign:"center" }}>
          {[[APP_PRICE,"per evento, una tantum"],["7 sezioni","tutto in una dashboard"],["0 abbonamenti","paghi solo quello che usi"]].map(([v,s]) => (
            <div key={v}>
              <p style={{ fontSize: isMobile ? 20 : 30, fontWeight:700, margin:"0 0 4px" }}>{v}</p>
              <p style={{ fontSize: isMobile ? 11 : 13, color:"#64748b", margin:0 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ padding: isMobile ? "48px 16px" : "80px 24px" }}>
        <div style={base.container}>
          <p style={base.sectionLabel}>Funzionalità</p>
          <h2 style={base.sectionTitle}>Tutto quello che serve per organizzare bene.</h2>
          <p style={base.sectionSub}>Dalla prima idea al brindisi finale, ogni dettaglio è visibile e tracciabile.</p>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:14, marginTop:36 }}>
            {features.map(f => (
              <div key={f.title} style={base.card}>
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(59,130,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:20 }}>{f.emoji}</div>
                <h3 style={{ fontSize:17, fontWeight:700, margin:"0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preset */}
      <div style={{ background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding: isMobile ? "36px 16px" : "48px 24px" }}>
        <div style={base.container}>
          <p style={base.sectionLabel}>Preset evento</p>
          <h2 style={{ ...base.sectionTitle, fontSize: isMobile ? 22 : 30 }}>Scegli il tipo — il resto si precompila.</h2>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:20 }}>
            {presets.map(p => (
              <span key={p} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9999, padding: isMobile ? "6px 14px" : "8px 18px", fontSize: isMobile ? 12 : 13, color:"#cbd5e1" }}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how" style={{ padding: isMobile ? "48px 16px" : "80px 24px" }}>
        <div style={base.container}>
          <p style={base.sectionLabel}>Come funziona</p>
          <h2 style={base.sectionTitle}>Da idea a festa in quattro passi.</h2>
          <div style={{ marginTop:28 }}>
            {steps.map((s, i) => (
              <div key={s.title} style={{ display:"flex", gap:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding: isMobile ? 18 : 24, marginBottom:10 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:"rgba(56,189,248,0.1)", color:"#7dd3fc", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0 }}>{i+1}</div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight:700, margin:"0 0 4px" }}>{s.title}</h3>
                  <p style={{ fontSize:14, color:"#94a3b8", margin:0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: isMobile ? "48px 16px" : "80px 24px", background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ ...base.container, textAlign:"center" }}>
          <p style={base.sectionLabel}>Prezzo</p>
          <h2 style={base.sectionTitle}>Semplice come deve essere.</h2>
          <div style={{ maxWidth:440, margin:"0 auto" }}>
            <div style={{ background:"rgba(59,130,246,0.08)", border:"1.5px solid #3b82f6", borderRadius:24, padding: isMobile ? 24 : 36 }}>
              <span style={{ background:"#3b82f6", color:"#fff", borderRadius:9999, padding:"4px 14px", fontSize:13, fontWeight:600 }}>Un solo piano</span>
              <h3 style={{ fontSize:20, fontWeight:700, margin:"14px 0 4px" }}>Per evento</h3>
              <p style={{ fontSize: isMobile ? 52 : 64, fontWeight:800, margin:"6px 0 4px" }}>{APP_PRICE}</p>
              <p style={{ fontSize:14, color:"#94a3b8", margin:"0 0 6px" }}>Pagamento unico, accesso illimitato nel tempo.</p>
              <button style={{ ...base.btnPrimary, width:"100%", justifyContent:"center", marginTop:10 }} onClick={() => navigate("/register")}>
                Crea il tuo primo evento
              </button>
              <ul style={{ textAlign:"left", margin:"24px 0 0", padding:0, listStyle:"none" }}>
                {pricingItems.map(item => (
                  <li key={item} style={{ display:"flex", gap:8, fontSize:13, color:"#94a3b8", marginBottom:8 }}>
                    <span style={{ color:"#38bdf8", flexShrink:0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <p style={{ fontSize:12, color:"#64748b", marginTop:14 }}>Hai più eventi? Ogni evento è un acquisto separato. Nessun abbonamento.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isMobile ? "48px 16px" : "80px 24px" }}>
        <div style={base.container}>
          <div style={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, padding: isMobile ? "40px 24px" : "64px 48px", textAlign:"center" }}>
            <h2 style={{ fontSize: isMobile ? 28 : 46, fontWeight:800, letterSpacing:"-0.03em", margin:"0 0 14px", lineHeight:1.15 }}>
              La prossima festa può essere organizzata meglio.
            </h2>
            <p style={{ fontSize: isMobile ? 15 : 17, color:"#94a3b8", margin:"0 0 28px", lineHeight:1.7 }}>
              Centralizza ogni decisione ed elimina i messaggi dispersi.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
              <button style={base.btnPrimary} onClick={() => navigate("/register")}>Crea il tuo primo evento</button>
              <button style={base.btnOutline} onClick={() => window.open(DEMO_URL,"_blank")}>Guarda la demo</button>
            </div>
            <p style={{ fontSize:12, color:"#64748b", margin:0 }}>{APP_PRICE} per evento · Nessun abbonamento</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: isMobile ? "48px 16px" : "80px 24px", background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={base.container}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <p style={base.sectionLabel}>FAQ</p>
            <h2 style={base.sectionTitle}>Domande frequenti</h2>
          </div>
          {faqs.map(f => (
            <div key={f.q} style={{ ...base.card, marginBottom:10 }}>
              <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight:700, margin:"0 0 8px" }}>{f.q}</h3>
              <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.08)", padding: isMobile ? "24px 16px" : "28px 24px" }}>
        <div style={{ ...base.container, display:"flex", flexDirection: isMobile ? "column" : "row", justifyContent:"space-between", alignItems: isMobile ? "flex-start" : "center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#64748b" }}>
            <div style={{ ...base.logoIcon, width:26, height:26, borderRadius:8 }}><span style={{ fontSize:11 }}>✨</span></div>
            © 2025 TheLopa. Tutti i diritti riservati.
          </div>
          <div style={{ display:"flex", gap:20, fontSize:13, color:"#64748b" }}>
            <a href="#" style={{ color:"#64748b", textDecoration:"none" }}>Privacy</a>
            <a href="#" style={{ color:"#64748b", textDecoration:"none" }}>Termini</a>
            <a href="#" style={{ color:"#64748b", textDecoration:"none" }}>Contatti</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
