import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const LangContext = createContext(null);

// ── Dizionari ────────────────────────────────────────────────
const translations = {
  it: {
    // Navigazione
    nav_events:      "Eventi",
    nav_settings:    "Impostazioni",
    nav_back:        "Indietro",

    // Dashboard lista eventi
    greeting:        "Ciao",
    events_active:   "eventi attivi",
    events_done:     "completati",
    section_ongoing: "In corso",
    section_past:    "Completati",
    new_event:       "Nuovo evento",
    no_events:       "Nessun evento ancora",
    no_events_sub:   "Crea il tuo primo evento per iniziare.",

    // Stato evento
    status_active:   "Attivo",
    status_draft:    "Bozza",
    status_past:     "Concluso",

    // KPI
    kpi_budget:      "Budget",
    kpi_roadmap:     "Roadmap",
    kpi_confirmed:   "Confermati",
    kpi_spent:       "Speso",
    kpi_present:     "Presenti",

    // Dashboard evento
    overview:        "Panoramica",
    days_left:       "giorni all'evento",
    today:           "Oggi!",
    concluded:       "Concluso",
    alerts:          "Avvisi",

    // Sezioni
    budget:          "Budget",
    roadmap:         "Roadmap",
    guests:          "Invitati",
    attendance:      "Presenze",
    scenarios:       "Scenari",
    survey:          "Survey",
    settings:        "Impostazioni",

    // Budget
    budgeted:        "Preventivato",
    spent:           "Speso",
    difference:      "Differenza",
    add_item:        "Aggiungi voce",
    item_name:       "Nome voce",
    cancel:          "Annulla",
    add:             "Aggiungi",
    saved:           "Salvato",

    // Roadmap
    todo:            "Da fare",
    doing:           "In corso",
    done:            "Fatto",
    add_task:        "Aggiungi task",
    task_title:      "Titolo task",
    due_date:        "Data scadenza",
    notes:           "Note",
    delete:          "Elimina",
    completion:      "Completamento",
    tasks_done:      "task completati",

    // Invitati
    confirmed:       "Confermati",
    waiting:         "In attesa",
    declined:        "Declinato",
    add_guest:       "Aggiungi invitato",
    full_name:       "Nome e cognome",
    upload_excel:    "Carica Excel",
    download_excel:  "Scarica Excel",
    upload_warning:  "L'upload sovrascrive tutti i dati esistenti",
    no_guests:       "Nessun invitato ancora",
    no_guests_sub:   "Aggiungi manualmente o carica un file Excel.",
    add_manually:    "Aggiungi manualmente",
    add_group:       "Aggiungi gruppo",
    group_name:      "Nome gruppo",

    // Presenze
    present:         "Presente",
    absent:          "Assente",
    walkin:          "Walk-in",
    total:           "Totale",
    checkin:         "Check-in completati",
    search_name:     "Cerca nome...",
    register_walkin: "Registra walk-in",
    name_optional:   "Nome (opzionale)",
    download_csv:    "Scarica presenze",

    // Scenari
    simulator:       "Simulatore collegato al budget",
    best:            "Migliore",
    guests_count:    "Numero ospiti ipotizzati",
    revenue:         "Guadagno",
    net:             "Netto",
    cost:            "Costo stimato",
    fixed_quota:     "Quota fissa",
    categories:      "Categorie",
    quota_per_person:"Quota per persona (€)",
    add_category:    "Aggiungi categoria",
    duplicate:       "Duplica",
    compact_view:    "Compatta",
    detail_view:     "Dettaglio",
    add_scenario:    "Aggiungi scenario",
    new_scenario:    "Nuovo scenario",
    scenario_name:   "Nome scenario",

    // Survey
    survey_link:     "Link survey da condividere",
    copy_link:       "Copia",
    copied:          "Copiato!",
    responses:       "Risposte ricevute",
    download:        "Scarica",
    form_preview:    "Anteprima form",
    dashboard_resp:  "Dashboard risposte",
    no_responses:    "Nessuna risposta ancora — condividi il link",
    not_in_list:     "Non in lista",
    participate:     "Partecipi?",
    yes_coming:      "Sì, ci sarò",
    no_coming:       "No, non posso venire",
    gender:          "Genere",
    gender_optional: "facoltativo",
    gender_m:        "M",
    gender_f:        "F",
    gender_other:    "Altro",
    gender_skip:     "Preferisco non dirlo",
    send_response:   "Invia risposta",
    response_sent:   "Risposta inviata!",
    response_thanks: "Grazie per aver risposto.",
    send_another:    "Invia un'altra risposta",

    // Impostazioni
    event_name:      "Nome evento",
    event_date:      "Data evento",
    planned_guests:  "Numero ospiti previsti",
    drinks_per_person:"Drinks per persona",
    preset:          "Preset evento",
    preset_warning:  "Cambiare preset resetterà le voci di budget e i task della roadmap. Questa azione non è reversibile.",
    change_preset:   "Sì, cambia preset",
    autosave:        "Salvataggio automatico",
    app_settings:    "Preferenze app",
    language:        "Lingua",
    theme:           "Tema",
    theme_dark:      "Scuro",
    theme_light:     "Chiaro",
    lang_it:         "Italiano",
    lang_en:         "English",

    // Preset nomi
    preset_compleanno: "Compleanno",
    preset_laurea:     "Laurea",
    preset_nubilato:   "Addio al nubilato",
    preset_aziendale:  "Festa aziendale",
    preset_cena:       "Cena privata",
    preset_battesimo:  "Battesimo / Comunione",
    preset_altro:      "Altro",

    // Auth
    login:           "Accedi",
    register:        "Registrati",
    email:           "Email",
    password:        "Password",
    full_name_label: "Nome e cognome",
    already_account: "Hai già un account?",
    no_account:      "Non hai un account?",
    logout:          "Esci",

    // Acquisto
    new_event_title: "Nuovo evento",
    new_event_sub:   "Accedi a tutte le funzionalità per organizzare il tuo evento.",
    access_event:    "Accesso evento",
    vat_included:    "IVA inclusa",
    total_label:     "Totale",
    proceed_payment: "Procedi al pagamento",
    secure_stripe:   "Pagamento sicuro con Stripe",

    // Generali
    confirm:         "Conferma",
    save:            "Salva",
    close:           "Chiudi",
    edit:            "Modifica",
    search:          "Cerca",
    filter_all:      "Tutti",
    loading:         "Caricamento...",
    error_generic:   "Si è verificato un errore. Riprova.",
  },

  en: {
    // Navigation
    nav_events:      "Events",
    nav_settings:    "Settings",
    nav_back:        "Back",

    // Events dashboard
    greeting:        "Hello",
    events_active:   "active events",
    events_done:     "completed",
    section_ongoing: "Ongoing",
    section_past:    "Completed",
    new_event:       "New event",
    no_events:       "No events yet",
    no_events_sub:   "Create your first event to get started.",

    // Event status
    status_active:   "Active",
    status_draft:    "Draft",
    status_past:     "Concluded",

    // KPIs
    kpi_budget:      "Budget",
    kpi_roadmap:     "Roadmap",
    kpi_confirmed:   "Confirmed",
    kpi_spent:       "Spent",
    kpi_present:     "Present",

    // Event dashboard
    overview:        "Overview",
    days_left:       "days to event",
    today:           "Today!",
    concluded:       "Concluded",
    alerts:          "Alerts",

    // Sections
    budget:          "Budget",
    roadmap:         "Roadmap",
    guests:          "Guests",
    attendance:      "Attendance",
    scenarios:       "Scenarios",
    survey:          "Survey",
    settings:        "Settings",

    // Budget
    budgeted:        "Budgeted",
    spent:           "Spent",
    difference:      "Difference",
    add_item:        "Add item",
    item_name:       "Item name",
    cancel:          "Cancel",
    add:             "Add",
    saved:           "Saved",

    // Roadmap
    todo:            "To do",
    doing:           "In progress",
    done:            "Done",
    add_task:        "Add task",
    task_title:      "Task title",
    due_date:        "Due date",
    notes:           "Notes",
    delete:          "Delete",
    completion:      "Completion",
    tasks_done:      "tasks completed",

    // Guests
    confirmed:       "Confirmed",
    waiting:         "Pending",
    declined:        "Declined",
    add_guest:       "Add guest",
    full_name:       "Full name",
    upload_excel:    "Upload Excel",
    download_excel:  "Download Excel",
    upload_warning:  "Upload overwrites all existing data",
    no_guests:       "No guests yet",
    no_guests_sub:   "Add manually or upload an Excel file.",
    add_manually:    "Add manually",
    add_group:       "Add group",
    group_name:      "Group name",

    // Attendance
    present:         "Present",
    absent:          "Absent",
    walkin:          "Walk-in",
    total:           "Total",
    checkin:         "Check-in completed",
    search_name:     "Search name...",
    register_walkin: "Register walk-in",
    name_optional:   "Name (optional)",
    download_csv:    "Download attendance",

    // Scenarios
    simulator:       "Simulator linked to budget",
    best:            "Best",
    guests_count:    "Estimated guests",
    revenue:         "Revenue",
    net:             "Net",
    cost:            "Estimated cost",
    fixed_quota:     "Fixed fee",
    categories:      "Categories",
    quota_per_person:"Fee per person (€)",
    add_category:    "Add category",
    duplicate:       "Duplicate",
    compact_view:    "Compact",
    detail_view:     "Detail",
    add_scenario:    "Add scenario",
    new_scenario:    "New scenario",
    scenario_name:   "Scenario name",

    // Survey
    survey_link:     "Shareable survey link",
    copy_link:       "Copy",
    copied:          "Copied!",
    responses:       "Received responses",
    download:        "Download",
    form_preview:    "Form preview",
    dashboard_resp:  "Responses dashboard",
    no_responses:    "No responses yet — share the link",
    not_in_list:     "Not in list",
    participate:     "Will you attend?",
    yes_coming:      "Yes, I'll be there",
    no_coming:       "No, I can't make it",
    gender:          "Gender",
    gender_optional: "optional",
    gender_m:        "M",
    gender_f:        "F",
    gender_other:    "Other",
    gender_skip:     "Prefer not to say",
    send_response:   "Send response",
    response_sent:   "Response sent!",
    response_thanks: "Thank you for responding.",
    send_another:    "Send another response",

    // Settings
    event_name:      "Event name",
    event_date:      "Event date",
    planned_guests:  "Planned guests",
    drinks_per_person:"Drinks per person",
    preset:          "Event preset",
    preset_warning:  "Changing preset will reset all budget items and roadmap tasks. This action cannot be undone.",
    change_preset:   "Yes, change preset",
    autosave:        "Autosave",
    app_settings:    "App preferences",
    language:        "Language",
    theme:           "Theme",
    theme_dark:      "Dark",
    theme_light:     "Light",
    lang_it:         "Italiano",
    lang_en:         "English",

    // Preset names
    preset_compleanno: "Birthday",
    preset_laurea:     "Graduation",
    preset_nubilato:   "Bachelorette",
    preset_aziendale:  "Corporate party",
    preset_cena:       "Private dinner",
    preset_battesimo:  "Baptism / Communion",
    preset_altro:      "Other",

    // Auth
    login:           "Log in",
    register:        "Sign up",
    email:           "Email",
    password:        "Password",
    full_name_label: "Full name",
    already_account: "Already have an account?",
    no_account:      "Don't have an account?",
    logout:          "Log out",

    // Purchase
    new_event_title: "New event",
    new_event_sub:   "Get full access to all features to organize your event.",
    access_event:    "Event access",
    vat_included:    "VAT included",
    total_label:     "Total",
    proceed_payment: "Proceed to payment",
    secure_stripe:   "Secure payment with Stripe",

    // General
    confirm:         "Confirm",
    save:            "Save",
    close:           "Close",
    edit:            "Edit",
    search:          "Search",
    filter_all:      "All",
    loading:         "Loading...",
    error_generic:   "An error occurred. Please try again.",
  }
};


export function LangProvider({ children }) {
  const { profile, updateProfile } = useAuth();
  const [lang, setLangState] = useState("it");

  useEffect(() => {
    if (profile?.language) {
      setLangState(profile.language);
    } else {
      const saved = localStorage.getItem("festiamo_lang");
      if (saved) setLangState(saved);
    }
  }, [profile?.language]);

  async function setLang(l) {
    setLangState(l);
    localStorage.setItem("festiamo_lang", l);
    if (profile) await updateProfile({ language: l });
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations["it"]?.[key] ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang deve essere dentro LangProvider");
  return ctx;
}
