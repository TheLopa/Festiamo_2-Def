import { useNavigate } from "react-router-dom";

// ── CONFIGURAZIONE ────────────────────────────────────────────
const APP_NAME = "Festiamo";
const APP_PRICE = "€2,99";
const DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=INSERISCI_ID_QUI";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const icons = {
    sparkles: <svg {...common}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M19 17v4" /><path d="M17 19h4" /></svg>,
    arrow:    <svg {...common}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>,
    check:    <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>,
    chart:    <svg {...common}><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
    list:     <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
    users:    <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    checkin:  <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></svg>,
    survey:   <svg {...common}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
    scenarios:<svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>,
    shield:   <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>,
  };
  return icons[name] || icons.sparkles;
}

function Button({ children, variant = "primary", size = "md", onClick, className = "" }) {
  const base = "inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none cursor-pointer";
  const sizes = { md: "px-5 py-2.5 text-sm", lg: "px-8 py-3.5 text-base" };
  const variants = {
    primary:  "bg-blue-500 text-white hover:bg-blue-600 border-none",
    secondary:"bg-white text-slate-950 hover:bg-slate-200 border-none",
    outline:  "border border-white/20 bg-white/5 text-white hover:bg-white/10",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: "chart",    title: "Budget trasparente",        text: "Voci di spesa fisse e formule dinamiche. Preventivo vs reale con differenza in tempo reale." },
    { icon: "list",     title: "Roadmap operativa",         text: "Task organizzati per categoria con scadenze e stati. Tutto tracciato, niente dimenticato." },
    { icon: "users",    title: "Invitati sotto controllo",  text: "Lista gruppata con conferme, upload e download Excel. Ogni modifica si riflette automaticamente." },
    { icon: "checkin",  title: "Presenze il giorno evento", text: "Check-in rapido con ricerca per nome. Gestisci anche i walk-in." },
    { icon: "survey",   title: "Survey con link",           text: "Un link, e i tuoi ospiti confermano la partecipazione. Le risposte aggiornano la lista." },
    { icon: "scenarios",title: "Simulatore scenari",        text: "Cosa succede se vengono 80 invece di 120? Simula costi e guadagni per ogni ipotesi." },
  ];

  const steps = [
    { title: "Acquista l'evento",           desc: `Un pagamento unico di ${APP_PRICE}. Nessun abbonamento.` },
    { title: "Scegli il preset",            desc: "Compleanno, laurea, festa aziendale e altri. Il preset precompila budget e roadmap." },
    { title: "Gestisci tutto da dashboard", desc: "Budget, task, invitati, presenze e scenari — tutto in un posto, anche dal telefono." },
    { title: "Arriva al giorno organizzato",desc: "Check-in in tempo reale, nessuna chat dispersa, zero fogli Excel." },
  ];

  const presets = ["Compleanno", "Laurea", "Addio al nubilato", "Festa aziendale", "Cena privata", "Battesimo / Comunione", "Altro"];

  const faqs = [
    { q: "Cosa include il pagamento?",        a: `Con ${APP_PRICE} una tantum ottieni accesso completo a tutte le funzionalità per quell'evento. Nessun abbonamento.` },
    { q: "Posso gestire più eventi?",          a: `Sì — ogni evento è un acquisto separato a ${APP_PRICE}. Puoi avere quanti eventi vuoi.` },
    { q: "Gli invitati devono registrarsi?",   a: "No. Ricevono un link alla survey e la compilano senza account." },
    { q: "Funziona da smartphone?",            a: "Sì, è progettato mobile-first. Il check-in presenze è pensato per l'uso da telefono." },
    { q: "Posso cambiare il preset dopo?",     a: "Sì dalle impostazioni, ma ti verrà chiesta conferma perché l'operazione azzera budget e roadmap." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500">
              <Icon name="sparkles" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Funzionalità</a>
            <a href="#how"      className="hover:text-white">Come funziona</a>
            <a href="#pricing"  className="hover:text-white">Prezzo</a>
            <a href="#faq"      className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden text-sm font-semibold text-slate-300 transition hover:text-white sm:inline bg-transparent border-none cursor-pointer"
            >
              Accedi
            </button>
            <Button variant="secondary" onClick={() => navigate("/register")}>
              Inizia ora
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-24 md:py-32">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl">
                Niente più chat infinite per organizzare una festa.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                {APP_NAME} centralizza budget, invitati, roadmap, presenze e survey in un'unica dashboard. Un pagamento di {APP_PRICE} per evento, nessun abbonamento.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" onClick={() => navigate("/register")}>
                  Crea il tuo primo evento <Icon name="arrow" className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.open(DEMO_VIDEO_URL, "_blank")}>
                  Guarda la demo
                </Button>
              </div>
              <p className="mt-4 text-sm text-slate-400">{APP_PRICE} una tantum · Nessun abbonamento · Setup in 2 minuti</p>
              <p className="mt-3 text-sm text-slate-300">
                Hai già un account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-semibold text-blue-300 hover:text-blue-200 hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
                >
                  Accedi
                </button>
              </p>
            </div>

            {/* Mock dashboard */}
            <div>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl">
                <div className="p-6 md:p-8">
                  <div className="rounded-[1.5rem] bg-slate-900 p-5">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Compleanno Sofia</p>
                        <h3 className="text-2xl font-bold text-white">20 set 2025</h3>
                      </div>
                      <span className="rounded-full bg-sky-400/10 px-3 py-1 text-sm text-sky-300">78% pronto</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Budget speso</p>
                        <p className="mt-2 text-3xl font-bold text-white">€3.240</p>
                        <p className="text-xs text-slate-500 mt-1">su €7.970 preventivati</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-sm text-slate-400">Confermati</p>
                        <p className="mt-2 text-3xl font-bold text-white">84 / 120</p>
                        <p className="text-xs text-slate-500 mt-1">18 in attesa</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: "Confermare catering",   done: true  },
                        { label: "Inviare inviti",         done: true  },
                        { label: "Finalizzare playlist DJ",done: false },
                        { label: "Reminder finale ospiti", done: false },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-3">
                          <div className="flex items-center gap-3">
                            <Icon name="check" className={item.done ? "h-4 w-4 text-sky-300" : "h-4 w-4 text-slate-500"} />
                            <span className="text-sm text-slate-200">{item.label}</span>
                          </div>
                          <span className="text-xs text-slate-500">{item.done ? "Fatto" : "Da fare"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/10 bg-white/[0.03] px-6 py-10">
          <div className="mx-auto grid max-w-7xl gap-6 text-center md:grid-cols-3">
            <div><p className="text-3xl font-bold">{APP_PRICE}</p><p className="mt-1 text-sm text-slate-400">per evento, una tantum</p></div>
            <div><p className="text-3xl font-bold">7 sezioni</p><p className="mt-1 text-sm text-slate-400">tutto in una dashboard</p></div>
            <div><p className="text-3xl font-bold">0 abbonamenti</p><p className="mt-1 text-sm text-slate-400">paghi solo quello che usi</p></div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="font-semibold text-blue-300">Funzionalità</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Tutto quello che serve per organizzare bene.</h2>
              <p className="mt-5 text-lg text-slate-300">Dalla prima idea al brindisi finale, ogni dettaglio è visibile e tracciabile.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map(f => (
                <div key={f.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 transition hover:bg-white/[0.09]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                    <Icon name={f.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{f.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preset */}
        <section className="border-y border-white/10 bg-white/[0.03] px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="font-semibold text-blue-300 mb-3">Preset evento</p>
            <h2 className="text-3xl font-bold tracking-tight mb-8">Scegli il tipo di evento — il resto si precompila.</h2>
            <div className="flex flex-wrap gap-3">
              {presets.map(p => (
                <span key={p} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-200">{p}</span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-semibold text-sky-300">Come funziona</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Da idea a festa organizzata in quattro passi.</h2>
            </div>
            <div className="grid gap-4">
              {steps.map((step, i) => (
                <div key={step.title} className="flex gap-5 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 font-bold text-sky-200">{i + 1}</div>
                  <div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-24 bg-white/[0.03] border-y border-white/10">
          <div className="mx-auto max-w-lg text-center">
            <p className="font-semibold text-blue-300">Prezzo</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Semplice come deve essere.</h2>
            <div className="mt-10 rounded-[2rem] border border-blue-400 bg-blue-500/10 p-8">
              <span className="mb-5 inline-flex rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white">Un solo piano</span>
              <h3 className="text-2xl font-bold text-white mt-4">Per evento</h3>
              <div className="mt-4 flex items-end justify-center gap-1">
                <span className="text-6xl font-extrabold text-white">{APP_PRICE}</span>
              </div>
              <p className="mt-4 text-slate-300">Pagamento unico, accesso illimitato nel tempo all'evento.</p>
              <Button className="mt-7 w-full" size="lg" onClick={() => navigate("/register")}>
                Crea il tuo primo evento
              </Button>
              <ul className="mt-7 space-y-3 text-left">
                {[
                  "Budget con voci fisse e formule dinamiche",
                  "Roadmap con task, scadenze e stati",
                  "Lista invitati + upload/download Excel",
                  "Check-in presenze il giorno dell'evento",
                  "Survey con link condivisibile",
                  "Simulatore scenari costo/guadagno",
                  "Dashboard con sintesi e avvisi",
                  "Accesso da desktop e smartphone",
                ].map(item => (
                  <li key={item} className="flex gap-3 text-sm text-slate-300">
                    <Icon name="check" className="h-5 w-5 shrink-0 text-sky-300" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 text-sm text-slate-400">Hai più eventi? Ogni evento è un acquisto separato. Nessun abbonamento.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950 p-8 text-center shadow-2xl md:p-14">
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">La prossima festa può essere organizzata meglio.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Centralizza ogni decisione ed elimina i messaggi dispersi.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" onClick={() => navigate("/register")}>Crea il tuo primo evento</Button>
              <Button size="lg" variant="outline" onClick={() => window.open(DEMO_VIDEO_URL, "_blank")}>Guarda la demo</Button>
            </div>
            <p className="mt-4 text-sm text-slate-400">{APP_PRICE} per evento · Nessun abbonamento</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-24 bg-white/[0.03] border-t border-white/10">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="font-semibold text-blue-300">FAQ</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Domande frequenti</h2>
            </div>
            <div className="mt-10 space-y-4">
              {faqs.map(item => (
                <div key={item.q} className="rounded-3xl border border-white/10 bg-white/[0.06] p-7">
                  <h3 className="text-lg font-bold text-white">{item.q}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white">
              <Icon name="sparkles" className="h-4 w-4" />
            </div>
            <span>© 2025 TheLopa. Tutti i diritti riservati.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Termini</a>
            <a href="#" className="hover:text-white">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
