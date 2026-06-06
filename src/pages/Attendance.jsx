import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { UserCheck, Plus, Trash2, Download, Search } from "lucide-react";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "var(--brand-light)",   fg: "var(--brand-text)"  },
  { bg: "var(--success-light)", fg: "var(--success-text)" },
  { bg: "var(--warning-light)", fg: "var(--warning-text)" },
  { bg: "var(--danger-light)",  fg: "var(--danger-text)"  },
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Attendance() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [guestGroups, setGuestGroups]   = useState([]);
  const [walkins, setWalkins]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg]         = useState("");
  const [filter, setFilter]             = useState("tutti");
  const [search, setSearch]             = useState("");
  const [showAddWalkin, setShowAddWalkin] = useState(false);
  const [walkinName, setWalkinName]     = useState("");

  useEffect(() => { fetchData(); }, [eventId]);

  async function fetchData() {
    const { data: groups } = await supabase
      .from("guest_groups")
      .select("*, guests(*)")
      .eq("event_id", eventId)
      .order("sort_order");

    // Walk-in: guests senza group_id e is_walkin = true
    const { data: wk } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_walkin", true);

    if (groups) setGuestGroups(groups);
    if (wk)     setWalkins(wk);
    setLoading(false);
  }

  function showToast(msg = t("saved")) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  const allGuests   = guestGroups.flatMap(g => g.guests || []);
  const cntPresent  = allGuests.filter(g => g.presence === "present").length;
  const cntAbsent   = allGuests.filter(g => g.presence === "absent").length;
  const cntWalkin   = walkins.length;
  const total       = cntPresent + cntWalkin;
  const pct         = allGuests.length ? Math.round((cntPresent / allGuests.length) * 100) : 0;

  async function togglePresence(guestId, groupId, current) {
    const next = current === "present" ? "absent" : "present";
    setGuestGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, guests: g.guests.map(gu => gu.id === guestId ? { ...gu, presence: next } : gu) };
    }));
    await supabase.from("guests").update({ presence: next }).eq("id", guestId);
    showToast();
  }

  async function addWalkin() {
    const name = walkinName.trim();
    const [first, ...rest] = name.split(" ");
    const { data } = await supabase
      .from("guests")
      .insert({
        event_id: eventId,
        first_name: first || "Sconosciuto",
        last_name: rest.join(" ") || "",
        is_walkin: true,
        presence: "present",
        confirmation: "yes",
      })
      .select()
      .single();
    if (data) setWalkins(prev => [...prev, data]);
    setWalkinName("");
    setShowAddWalkin(false);
    showToast("Walk-in registrato");
  }

  async function deleteWalkin(id) {
    setWalkins(prev => prev.filter(w => w.id !== id));
    await supabase.from("guests").delete().eq("id", id);
    showToast();
  }

  function filteredGuests(guests) {
    return (guests || []).filter(gu => {
      const mf = filter === "tutti"
        || (filter === "present" && gu.presence === "present")
        || (filter === "absent"  && gu.presence === "absent");
      const name = `${gu.first_name} ${gu.last_name}`.toLowerCase();
      const ms = !search || name.includes(search.toLowerCase());
      return mf && ms;
    });
  }

  function downloadCSV() {
    const rows = [["Nome", "Cognome", "Gruppo", "Presenza"]];
    guestGroups.forEach(g => {
      (g.guests || []).forEach(gu => {
        rows.push([gu.first_name, gu.last_name, g.name, gu.presence === "present" ? "Presente" : "Assente"]);
      });
    });
    walkins.forEach(w => {
      rows.push([w.first_name, w.last_name || "", "—", "Walk-in"]);
    });
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "presenze.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-tertiary)" }}>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "var(--success-light)" }}>
          <UserCheck size={20} style={{ color: "var(--success)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("attendance")}</h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Giorno dell'evento</p>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{toastMsg} ✓</span>
        )}
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: t("present"), count: cntPresent, color: "var(--success)"        },
          { label: t("absent"),  count: cntAbsent,  color: "var(--text-secondary)" },
          { label: t("walkin"),  count: cntWalkin,  color: "var(--warning)"        },
          { label: t("total"),   count: total,       color: "var(--text-primary)"   },
        ].map(s => (
          <div key={s.label} className="card text-center py-2 px-1">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress check-in */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("checkin")}</p>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{pct}%</p>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Search + download */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }} />
          <input type="search" className="input-base pl-8" placeholder={t("search_name")}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-secondary px-3 flex items-center gap-1 text-sm" onClick={downloadCSV}>
          <Download size={14} /> {t("download_csv")}
        </button>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "tutti",   label: t("filter_all") },
          { key: "present", label: t("present")    },
          { key: "absent",  label: t("absent")     },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-xs px-3 py-1.5 rounded-full flex-shrink-0"
            style={{
              background: filter === f.key ? "var(--brand-light)" : "var(--bg-secondary)",
              color: filter === f.key ? "var(--brand-text)" : "var(--text-secondary)",
              border: filter === f.key ? "1px solid var(--brand)" : "1px solid var(--border)",
              cursor: "pointer",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Gruppi invitati */}
      {filter !== "walkin" && guestGroups.map(group => {
        const filtered  = filteredGuests(group.guests);
        const presenti  = (group.guests || []).filter(g => g.presence === "present").length;
        if (filtered.length === 0 && search) return null;

        return (
          <div key={group.id} className="card mb-3" style={{ padding: 0, overflow: "hidden" }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: "var(--bg-secondary)" }}>
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{group.name}</span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {presenti}/{(group.guests || []).length} presenti
              </span>
            </div>

            {filtered.map(guest => {
              const isPresent = guest.presence === "present";
              const col = avatarColor(guest.first_name);
              const name = `${guest.first_name} ${guest.last_name}`.trim();
              return (
                <div key={guest.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: isPresent ? "var(--success-light)" : "var(--bg-primary)",
                  }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
                    style={{ background: col.bg, color: col.fg }}>
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                    <p className="text-xs" style={{ color: isPresent ? "var(--success-text)" : "var(--text-tertiary)" }}>
                      {isPresent ? t("present") : t("absent")}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePresence(guest.id, group.id, guest.presence)}
                    className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      background: isPresent ? "var(--success)" : "var(--bg-secondary)",
                      border: isPresent ? "none" : "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    {isPresent
                      ? <span style={{ color: "#fff", fontSize: 18 }}>✓</span>
                      : <span style={{ color: "var(--text-tertiary)", fontSize: 18 }}>○</span>}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Walk-in */}
      <div className="card mb-3" style={{ padding: 0, overflow: "hidden",
        border: "1px solid var(--warning)" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--warning-light)" }}>
          <span className="font-semibold text-sm" style={{ color: "var(--warning-text)" }}>
            Walk-in (non in lista)
          </span>
          <span className="text-xs" style={{ color: "var(--warning-text)" }}>
            {walkins.length} {walkins.length === 1 ? "persona" : "persone"}
          </span>
        </div>

        {walkins.map(w => {
          const name = `${w.first_name} ${w.last_name || ""}`.trim();
          const col  = avatarColor(w.first_name);
          return (
            <div key={w.id} className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
                style={{ background: col.bg, color: col.fg }}>
                {initials(name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{name || "Sconosciuto"}</p>
                <p className="text-xs" style={{ color: "var(--warning-text)" }}>Walk-in</p>
              </div>
              <button onClick={() => deleteWalkin(w.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {showAddWalkin ? (
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <input type="text" className="input-base mb-2" placeholder={t("name_optional")}
              value={walkinName} onChange={e => setWalkinName(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 py-2 text-sm"
                onClick={() => { setShowAddWalkin(false); setWalkinName(""); }}>{t("cancel")}</button>
              <button className="btn-primary flex-1 py-2 text-sm" onClick={addWalkin}>
                {t("register_walkin")}
              </button>
            </div>
          </div>
        ) : (
          <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
            style={{ color: "var(--warning-text)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setShowAddWalkin(true)}>
            <Plus size={15} /> {t("register_walkin")}
          </button>
        )}
      </div>
    </div>
  );
}
