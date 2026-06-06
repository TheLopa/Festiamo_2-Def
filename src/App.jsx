import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useLang } from "./context/LangContext";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import EventsList      from "./pages/EventsList";
import PurchaseSuccess from "./pages/PurchaseSuccess";

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
      <Route path="/login"             element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"          element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/eventi"            element={<PrivateRoute><EventsList /></PrivateRoute>} />
      <Route path="/acquisto/successo" element={<PrivateRoute><PurchaseSuccess /></PrivateRoute>} />
      <Route path="*"                  element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
