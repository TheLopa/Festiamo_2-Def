import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useLang } from "./context/LangContext";

// Pagine pubbliche
import Landing         from "./pages/Landing";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import SurveyForm      from "./pages/SurveyForm";
import PurchaseSuccess from "./pages/PurchaseSuccess";

// Pagine protette
import EventsList      from "./pages/EventsList";
import EventDashboard  from "./pages/EventDashboard";
import Budget          from "./pages/Budget";
import Roadmap         from "./pages/Roadmap";
import Guests          from "./pages/Guests";
import Attendance      from "./pages/Attendance";
import Scenarios       from "./pages/Scenarios";
import SurveyDashboard from "./pages/SurveyDashboard";
import Settings        from "./pages/Settings";

// Layout
import AppLayout from "./layouts/AppLayout";

// ── Route privata: se non loggato → /login ───────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLang();
  if (loading) return (
    <div style={{ padding: "2rem", color: "var(--text-primary)" }}>
      {t("loading")}
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

// ── Route pubblica: se già loggato → /eventi ─────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/eventi" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Landing (sempre visibile) ─────────────────────── */}
      <Route path="/" element={<Landing />} />

      {/* ── Auth (solo se non loggati) ────────────────────── */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* ── Survey pubblica (senza login) ─────────────────── */}
      <Route path="/survey/:eventId" element={<SurveyForm />} />

      {/* ── Post-pagamento ────────────────────────────────── */}
      <Route path="/acquisto/successo" element={<PrivateRoute><PurchaseSuccess /></PrivateRoute>} />

      {/* ── App protetta con AppLayout ────────────────────── */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/eventi"                           element={<EventsList />} />
        <Route path="/eventi/:eventId"                  element={<EventDashboard />} />
        <Route path="/eventi/:eventId/budget"           element={<Budget />} />
        <Route path="/eventi/:eventId/roadmap"          element={<Roadmap />} />
        <Route path="/eventi/:eventId/invitati"         element={<Guests />} />
        <Route path="/eventi/:eventId/presenze"         element={<Attendance />} />
        <Route path="/eventi/:eventId/scenari"          element={<Scenarios />} />
        <Route path="/eventi/:eventId/survey"           element={<SurveyDashboard />} />
        <Route path="/eventi/:eventId/impostazioni"     element={<Settings />} />
      </Route>

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
