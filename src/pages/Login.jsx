import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/eventi");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: "var(--brand)" }}
        >
          <Sparkles size={20} color="#fff" />
        </div>
        <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Festiamo
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="card">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {t("login")}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {t("no_account")}{" "}
            <Link
              to="/register"
              className="font-semibold"
              style={{ color: "var(--brand)" }}
            >
              {t("register")}
            </Link>
          </p>

          {error && (
            <div
              className="flex items-start gap-2 rounded-lg p-3 mb-4 text-sm"
              style={{
                background: "var(--danger-light)",
                color: "var(--danger-text)",
              }}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("email")}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="email"
                  className="input-base pl-9"
                  placeholder="mario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("password")}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="password"
                  className="input-base pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? t("loading") : t("login")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
