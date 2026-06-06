import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useLang } from "./context/LangContext";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import EventsList      from "./pages/EventsList";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import Settings        from "./pages/Settings";
import AppLayout       from "./layouts/AppLayout";

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

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/eventi" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Pubbliche */}
      <Route path="/login"             element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"          element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/acquisto/successo" element={<PrivateRoute><PurchaseSuccess /></PrivateRoute>} />

      {/* Protette con AppLayout */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/eventi"                               element={<EventsList />} />
        <Route path="/eventi/:eventId"                      element={<Navigate to="impostazioni" replace />} />
        <Route path="/eventi/:eventId/impostazioni"         element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
