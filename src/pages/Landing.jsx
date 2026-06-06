import { useNavigate } from "react-router-dom";

const APP_NAME  = "Festiamo";
const APP_PRICE = "€2,99";
const DEMO_URL  = "https://www.youtube.com/watch?v=INSERISCI_ID_QUI";

const S = {
  // Layout
  page:    { minHeight:"100vh", background:"#0f172a", color:"#f8fafc", fontFamily:"Inter,system-ui,sans-serif", WebkitFontSmoothing:"antialiased" },
  section: { padding:"80px 24px" },
  container: { maxWidth:1100, margin:"0 auto" },

  // Header
  header: { position:"sticky", top:0, zIndex:50, background:"rgba(15,23,42,0.85)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"0 24px" },
  headerInner: { maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 },
  logo: { display:"flex", alignItems:"center", gap:8 },
  logoIcon: { width:36, height:36, borderRadius:10, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center" },
  logoText: { fontSize:18, fontWeight:700, letterSpacing:"-0.02em" },
  nav: { display:"flex", gap:32, fontSize:14, color:"#94a3b8" },
  navLink: { color:"#94a3b8", textDecoration:"none", cursor:"pointer", background:"none", border:"none", fontSize:14 },
  headerRight: { display:"flex", alignItems:"center", gap:12 },

  // Buttons
  btnPrimary: { background:"#3b82f6", color:"#fff", border:"none", borderRadius:9999, padding:"12px 28px", fontSize:15, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 },
  btnSecondary: { background:"#fff", color:"#0f172a", border:"none", borderRadius:9999, padding:"12px 28px", fontSize:15, fontWeight:600, cursor:"pointer" },
  btnOutline: { background:"rgba(255,255,255,0.05)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)", borderRadius:9999, padding:"12px 28px", fontSize:15, fontWeight:600, cursor:"pointer" },
  btnSmall: { background:"none", border:"none", color:"#94a3b8", fontSize:14, fontWeight:600, cursor:"pointer", padding:0 },

  // Hero
  hero: { padding:"100px 24px 80px", position:"relative", overflow:"hidden" },
  heroGrid: { maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" },
  heroTitle: { fontSize:56, fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, margin:"0 0 20px" },
  heroSub: { fontSize:18, color:"#94a3b8", lineHeight:1.7, margin:"0 0 36px" },
  heroBtns: { display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 },
  heroMeta: { fontSize:13, color:"#64748b", margin:0 },
  heroLogin: { fontSize:13, color:"#cbd5e1", margin:"10px 0 0" },

  // Mock dashboard
  mockCard: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:28 },
  mockInner: { background:"#1e293b", borderRadius:18, padding:20 },
  mockHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  mockTitle: { fontSize:24, fontWeight:700, margin:0 },
  mockSub: { fontSize:13, color:"#94a3b8", marginBottom:4 },
  mockBadge: { background:"rgba(56,189,248,0.1)", color:"#38bdf8", borderRadius:20, padding:"4px 12px", fontSize:13 },
  mockGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 },
  mockMetric: { background:"rgba(255,255,255,0.05)", borderRadius:14, padding:16 },
  mockMetricLabel: { fontSize:13, color:"#94a3b8", margin:"0 0 6px" },
  mockMetricVal: { fontSize:26, fontWeight:700, margin:0 },
  mockMetricSub: { fontSize:11, color:"#64748b", margin:"4px 0 0" },
  mockTask: { background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 },
  mockTaskLeft: { display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#e2e8f0" },
  mockTaskStatus: { fontSize:11, color:"#64748b" },

  // Stats
  statsBar: { background:"rgba(255,255,255,0.03)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"40px 24px" },
  statsGrid: { maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24, textAlign:"center" },
  statsVal: { fontSize:32, fontWeight:700, margin:"0 0 4px" },
  statsSub: { fontSize:13, color:"#64748b", margin:0 },

  // Features
  featuresGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginTop:48 },
  featureCard: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:28 },
  featureIcon: { width:44, height:44, borderRadius:14, background:"rgba(59,130,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 },
  featureTitle: { fontSize:18, fontWeight:700, margin:"0 0 10px" },
  featureText: { fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 },

  // Preset tags
  presetWrap: { display:"flex", flexWrap:"wrap", gap:10, marginTop:24 },
  presetTag: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9999, padding:"8px 18px", fontSize:13, color:"#cbd5e1" },

  // How it works
  howGrid: { display:"grid", gridTemplateColumns:"0.8fr 1.2fr", gap:64, alignItems:"start" },
  howLeft: {},
  howStep: { display:"flex", gap:20, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:24, marginBottom:12 },
  howNum: { width:40, height:40, borderRadius:12, background:"rgba(56,189,248,0.1)", color:"#7dd3fc", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0 },
  howTitle: { fontSize:18, fontWeight:700, margin:"0 0 6px" },
  howText: { fontSize:14, color:"#94a3b8", margin:0 },

  // Pricing
  pricingWrap: { maxWidth:480, margin:"0 auto" },
  pricingCard: { background:"rgba(59,130,246,0.08)", border:"1.5px solid #3b82f6", borderRadius:28, padding:36, textAlign:"center" },
  pricingBadge: { background:"#3b82f6", color:"#fff", borderRadius:9999, padding:"4px 14px", fontSize:13, fontWeight:600, display:"inline-block", marginBottom:20 },
  pricingVal: { fontSize:64, fontWeight:800, margin:"8px 0" },
  pricingList: { textAlign:"left", margin:"28px 0", padding:0, listStyle:"none" },
  pricingItem: { display:"flex", gap:10, fontSize:14, color:"#94a3b8", marginBottom:10 },

  // CTA
  ctaBox: { background:"#0f172a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:28, padding:"64px 48px", textAlign:"center" },
  ctaTitle: { fontSize:48, fontWeight:800, margin:"0 0 16px", letterSpacing:"-0.03em" },
  ctaSub: { fontSize:17, color:"#94a3b8", margin:"0 0 36px", lineHeight:1.7 },
  ctaBtns: { display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:16 },

  // FAQ
  faqCard: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding:28, marginBottom:12 },
  faqQ: { fontSize:17, fontWeight:700, margin:"0 0 10px" },
  faqA: { fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 },

  // Footer
  footer: { borderTop:"1px solid rgba(255,255,255,0.08)", padding:"28px 24px" },
  footerInner: { maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 },
  footerLeft: { display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#64748b" },
  footerLinks: { display:"flex", gap:24, fontSize:13, color:"#64748b" },

  // Section labels
  sectionLabel: { fontSize:14, fontWeight:600, color:"#60a5fa", marginBottom:12 },
  sectionTitle: { fontSize:40, fontWeight:800, letterSpacing:"-0.03em", margin:"0 0 16px" },
  sectionSub: { fontSize:17, color:"#94a3b8", lineHeight:1.7, margin:"0 0 0 0" },
};

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { emoji:"📊", title:"Budget trasparente",        text:"Voci di spesa fisse e formule dinamiche. Preventivo vs reale con differenza in tempo reale." },
    { emoji:"✅", title:"Roadmap operativa",         text:"Task organizzati per categoria con scadenze e stati. Tutto tracciato, niente dimenticato." },
    { emoji:"👥", title:"Invitati sotto controllo",  text:"Lista gruppata con conferme, upload e download Excel. Ogni modifica si riflette automaticamente." },
    { emoji:"🎟️", title:"Presenze il giorno evento", text:"Check-in rapido con ricerca per nome. Gestisci anche i walk-in." },
    { emoji:"📋", title:"Survey con link",           text:"Un link, e i tuoi ospiti confermano la partecipazione. Le risposte aggiornano la lista." },
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

  return (
    <div style={S.page}>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <div style={S.logoIcon}>
              <span style={{ fontSize:16 }}>✨</span>
            </div>
            <span style={S.logoText}>{APP_NAME}</span>
          </div>
          <nav style={S.nav}>
            <a href="#features" style={S.navLink}>Funzionalità</a>
            <a href="#how"      style={S.navLink}>Come funziona</a>
            <a href="#pricing"  style={S.navLink}>Prezzo</a>
            <a href="#faq"      style={S.navLink}>FAQ</a>
          </nav>
          <div style={S.headerRight}>
            <button style={S.btnSmall} onClick={() => navigate("/login")}>Accedi</button>
            <button style={S.btnSecondary} onClick={() => navigate("/register")}>Inizia ora</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={S.hero}>
        <div style={{ ...S.container }}>
          <div style={S.heroGrid}>
            <div>
              <h1 style={S.heroTitle}>Niente più chat infinite per organizzare una festa.</h1>
              <p style={S.heroSub}>
                {APP_NAME} centralizza budget, invitati, roadmap, presenze e survey in un'unica dashboard.
                Un pagamento di {APP_PRICE} per evento, nessun abbonamento.
              </p>
              <div style={S.heroBtns}>
                <button style={S.btnPrimary} onClick={() => navigate("/register")}>
                  Crea il tuo primo evento →
                </button>
                <button style={S.btnOutline} onClick={() => window.open(DEMO_URL,"_blank")}>
                  Guarda la demo
                </button>
              </div>
              <p style={S.heroMeta}>{APP_PRICE} una tantum · Nessun abbonamento · Setup in 2 minuti</p>
              <p style={S.heroLogin}>
                Hai già un account?{" "}
                <button style={{ ...S.btnSmall, color:"#93c5fd", textDecoration:"underline" }} onClick={() => navigate("/login")}>
                  Accedi
                </button>
              </p>
            </div>

            {/* Mock */}
            <div style={S.mockCard}>
              <div style={S.mockInner}>
                <div style={S.mockHeader}>
                  <div>
                    <p style={S.mockSub}>Compleanno Sofia</p>
                    <h3 style={S.mockTitle}>20 set 2025</h3>
                  </div>
                  <span style={S.mockBadge}>78% pronto</span>
                </div>
                <div style={S.mockGrid}>
                  <div style={S.mockMetric}>
                    <p style={S.mockMetricLabel}>Budget speso</p>
                    <p style={S.mockMetricVal}>€3.240</p>
                    <p style={S.mockMetricSub}>su €7.970 prev.</p>
                  </div>
                  <div style={S.mockMetric}>
                    <p style={S.mockMetricLabel}>Confermati</p>
                    <p style={S.mockMetricVal}>84/120</p>
                    <p style={S.mockMetricSub}>18 in attesa</p>
                  </div>
                </div>
                {[
                  { label:"Confermare catering",    done:true  },
                  { label:"Inviare inviti",          done:true  },
                  { label:"Finalizzare playlist DJ", done:false },
                  { label:"Reminder finale ospiti",  done:false },
                ].map(t => (
                  <div key={t.label} style={S.mockTask}>
                    <div style={S.mockTaskLeft}>
                      <span style={{ color: t.done ? "#38bdf8" : "#475569", fontSize:16 }}>
                        {t.done ? "✓" : "○"}
                      </span>
                      {t.label}
                    </div>
                    <span style={S.mockTaskStatus}>{t.done ? "Fatto" : "Da fare"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={S.statsBar}>
        <div style={S.statsGrid}>
          <div><p style={S.statsVal}>{APP_PRICE}</p><p style={S.statsSub}>per evento, una tantum</p></div>
          <div><p style={S.statsVal}>7 sezioni</p><p style={S.statsSub}>tutto in una dashboard</p></div>
          <div><p style={S.statsVal}>0 abbonamenti</p><p style={S.statsSub}>paghi solo quello che usi</p></div>
        </div>
      </div>

      {/* Features */}
      <section id="features" style={S.section}>
        <div style={S.container}>
          <p style={S.sectionLabel}>Funzionalità</p>
          <h2 style={S.sectionTitle}>Tutto quello che serve per organizzare bene.</h2>
          <p style={S.sectionSub}>Dalla prima idea al brindisi finale, ogni dettaglio è visibile e tracciabile.</p>
          <div style={S.featuresGrid}>
            {features.map(f => (
              <div key={f.title} style={S.featureCard}>
                <div style={S.featureIcon}><span style={{ fontSize:22 }}>{f.emoji}</span></div>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureText}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preset */}
      <div style={{ background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"48px 24px" }}>
        <div style={S.container}>
          <p style={S.sectionLabel}>Preset evento</p>
          <h2 style={{ ...S.sectionTitle, fontSize:28 }}>Scegli il tipo di evento — il resto si precompila.</h2>
          <div style={S.presetWrap}>
            {presets.map(p => <span key={p} style={S.presetTag}>{p}</span>)}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how" style={S.section}>
        <div style={S.container}>
          <div style={S.howGrid}>
            <div>
              <p style={S.sectionLabel}>Come funziona</p>
              <h2 style={S.sectionTitle}>Da idea a festa organizzata in quattro passi.</h2>
            </div>
            <div>
              {steps.map((s, i) => (
                <div key={s.title} style={S.howStep}>
                  <div style={S.howNum}>{i + 1}</div>
                  <div>
                    <h3 style={S.howTitle}>{s.title}</h3>
                    <p style={S.howText}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ ...S.section, background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ ...S.container, textAlign:"center" }}>
          <p style={S.sectionLabel}>Prezzo</p>
          <h2 style={S.sectionTitle}>Semplice come deve essere.</h2>
          <div style={S.pricingWrap}>
            <div style={S.pricingCard}>
              <span style={S.pricingBadge}>Un solo piano</span>
              <h3 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>Per evento</h3>
              <p style={S.pricingVal}>{APP_PRICE}</p>
              <p style={{ fontSize:14, color:"#94a3b8", margin:"0 0 8px" }}>Pagamento unico, accesso illimitato nel tempo.</p>
              <button style={{ ...S.btnPrimary, width:"100%", justifyContent:"center", marginTop:8 }}
                onClick={() => navigate("/register")}>
                Crea il tuo primo evento
              </button>
              <ul style={S.pricingList}>
                {pricingItems.map(item => (
                  <li key={item} style={S.pricingItem}>
                    <span style={{ color:"#38bdf8", flexShrink:0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <p style={{ fontSize:13, color:"#64748b", marginTop:16 }}>
              Hai più eventi? Ogni evento è un acquisto separato. Nessun abbonamento.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={S.section}>
        <div style={S.container}>
          <div style={S.ctaBox}>
            <h2 style={S.ctaTitle}>La prossima festa può essere organizzata meglio.</h2>
            <p style={S.ctaSub}>Centralizza ogni decisione ed elimina i messaggi dispersi.</p>
            <div style={S.ctaBtns}>
              <button style={S.btnPrimary} onClick={() => navigate("/register")}>Crea il tuo primo evento</button>
              <button style={S.btnOutline} onClick={() => window.open(DEMO_URL,"_blank")}>Guarda la demo</button>
            </div>
            <p style={{ fontSize:13, color:"#64748b", margin:0 }}>{APP_PRICE} per evento · Nessun abbonamento</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ ...S.section, background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={S.container}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <p style={S.sectionLabel}>FAQ</p>
            <h2 style={S.sectionTitle}>Domande frequenti</h2>
          </div>
          {faqs.map(f => (
            <div key={f.q} style={S.faqCard}>
              <h3 style={S.faqQ}>{f.q}</h3>
              <p style={S.faqA}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerLeft}>
            <div style={{ ...S.logoIcon, width:28, height:28, borderRadius:8 }}>
              <span style={{ fontSize:12 }}>✨</span>
            </div>
            © 2025 TheLopa. Tutti i diritti riservati.
          </div>
          <div style={S.footerLinks}>
            <a href="#" style={{ color:"#64748b", textDecoration:"none" }}>Privacy</a>
            <a href="#" style={{ color:"#64748b", textDecoration:"none" }}>Termini</a>
            <a href="#" style={{ color:"#64748b", textDecoration:"none" }}>Contatti</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
