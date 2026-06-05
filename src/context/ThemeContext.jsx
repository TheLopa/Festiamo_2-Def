import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { profile, updateProfile } = useAuth();
  const [theme, setThemeState] = useState("dark");

  // Sincronizza tema dal profilo utente
  useEffect(() => {
    if (profile?.theme) {
      applyTheme(profile.theme);
      setThemeState(profile.theme);
    } else {
      // Fallback: preferenza di sistema
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const t = prefersDark ? "dark" : "light";
      applyTheme(t);
      setThemeState(t);
    }
  }, [profile?.theme]);

  function applyTheme(t) {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  async function setTheme(t) {
    applyTheme(t);
    setThemeState(t);
    // Salva su Supabase se l'utente è loggato
    if (profile) {
      await updateProfile({ theme: t });
    } else {
      localStorage.setItem("festiamo_theme", t);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve essere dentro ThemeProvider");
  return ctx;
}
