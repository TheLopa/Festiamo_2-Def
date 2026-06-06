import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";

export default function Register() {
  const { t }    = useLang();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/eventi");
    }
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"var(--bg-secondary)",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      padding:"24px 16px",
      fontFamily:"Inter,system-ui,sans-serif",
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
        padding:28,
      }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:"0 0 4px", color:"var(--text-primary)", letterSpacing:"-0.02em" }}>
          {t("register")}
        </h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)", margin:"0 0 24px" }}>
          {t("already_account")}{" "}
          <Link to="/login" style={{ color:"var(--brand)", textDecoration:"none", fontWeight:600 }}>
            {t("login")}
          </Link>
        </p>

        {error && (
          <div style={{
            background:"var(--danger-light)",
            border:"1px solid var(--danger)",
            borderRadius:10,
            padding:"10px 14px",
            fontSize:13,
            color:"var(--danger-text)",
            marginBottom:16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:6 }}>
              {t("full_name_label")}
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="Mario Rossi"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:6 }}>
              {t("email")}
            </label>
            <input
              type="email"
              className="input-base"
              placeholder="mario@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-secondary)", marginBottom:6 }}>
              {t("password")}
            </label>
            <input
              type="password"
              className="input-base"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:4 }}>Minimo 6 caratteri</p>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:15, borderRadius:10, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? t("loading") : t("register")}
          </button>
        </form>
      </div>
    </div>
  );
}
