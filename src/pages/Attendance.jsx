import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { UserCheck, Plus, Trash2, Download, Search, X } from "lucide-react";

function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "var(--brand-light)",   fg: "var(--brand)"   },
  { bg: "var(--success-light)", fg: "var(--success)"  },
  { bg: "var(--warning-light)", fg: "var(--warning)"  },
  { bg: "var(--danger-light)",  fg: "var(--danger)"   },
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Attendance() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [guestGroups,    setGuestGroups]    = useState([]);
  const [walkins,        setWalkins]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toastMsg,       setToastMsg]       = useState("");
  const [filter,         setFilter]         = useState("tutti");
  const [search,         setSearch]         = useState("");

  // Modal walk-in
  const [walkinModal, setWalkinModal] = useState(false);
  const [walkinName,  setWalkinName]  = useState("");

  useEffect(() => { fetchData(); }, [eventId]);

  function showToast(msg = "Salvato") {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function fetchData() {
    const { data: groups } = await supabase
      .from("guest_groups")
      .select("*, guests(*)")
      .eq("event_id", eventId)
      .order("sort_order");

    const { data: wk } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_walkin", true);

    if (groups) setGuestGroups(groups);
    if (wk)     setWalkins(wk);
    setLoading(false);
  }

  const allGuests  = guestGroups.flatMap(g => g.guests || []);
  const cntPresent = allGuests.filter(g => g.presence === "present").length;
  const cntAbsent  = allGuests.filter(g => g.presence === "absent").length;
  const cntWalkin  = walkins.length;
  const total      = cntPresent + cntWalkin;
  const pct        = allGuests.length ? Math.round((cntPresent / allGuests.length) * 100) : 0;

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
    const name = walkinName.trim() || "Sconosciuto";
    const [first, ...rest] = name.split(" ");
    const { data } = await supabase
      .from("guests")
      .insert({
        event_id: eventId,
        first_name: first,
        last_name: rest.join(" ") || "",
        is_walkin: true,
        presence: "present",
        confirmation: "yes",
      })
      .select().single();
    if (data) setWalkins(prev => [...prev, data]);
    setWalkinModal(false);
    setWalkinName("");
    showToast("Walk-in registrato");
  }

  async function deleteWalkin(id) {
    setWalkins(prev => prev.filter(w => w.id !== id));
    await supabase.from("guests").delete().eq("id", id);
    showToast("Eliminato");
  }

  function filteredGuests(guests) {
    return (guests || []).filter(gu => {
      const mf = filter === "tutti"
        || (filter === "present" && gu.presence === "present")
        || (filter === "absent"  && gu.presence !== "present");
      const name = `${gu.first_name} ${gu.last_name}`.toLowerCase();
      return mf && (!search || name.includes(search.toLowerCase()));
    });
  }

  function downloadCSV() {
    const rows = [["Nome", "Cognome", "Gruppo", "Presenza"]];
    guestGroups.forEach(g => {
      (g.guests || []).forEach(gu => {
        rows.push([gu.first_name, gu.last_name, g.name,
          gu.presence === "present" ? "Presente" : "Assente"]);
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
    showToast("Scaricato!");
  }

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"40vh" }}>
        <div style={{
          width:28, height:28, borderRadius:"50%",
          border:"3px solid var(--brand)", borderTopColor:"transparent",
          animation:"spin 0.7s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const cardStyle = {
    background:"var(--bg-secondary)", border:"1px solid var(--border)",
    borderRadius:16, overflow:"hidden", marginBottom:12,
  };

  const inputStyle = {
    background:"var(--bg-primary)", border:"1px solid var(--border)",
    borderRadius:8, padding:"10px 12px", color:"var(--text-primary)",
    fontSize:14, width:"100%", boxSizing:"border-box",
  };

  const overlayStyle = {
    position:"fixed", inset:0, zIndex:200,
    background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)",
    display:"flex", alignItems:"flex-end",
  };

  const sheetStyle = {
    width:"100%", background:"var(--bg-secondary)",
    borderRadius:"20px 20px 0 0", padding:"24px 20px 40px",
    maxHeight:"85vh", overflowY:"auto", boxSizing:"border-box",
  };

  return (
    <div style={{ paddingBottom:32 }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"var(--success)", color:"#fff",
          padding:"8px 20px", borderRadius:20, fontSize:13, fontWeight:600,
          zIndex:300, pointerEvents:"none", whiteSpace:"nowrap",
        }}>
          {toastMsg} ✓
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background:"var(--success-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <UserCheck size={20} style={{ color:"var(--success)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Presenze</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>Giorno dell'evento</p>
        </div>
        <button
          onClick={downloadCSV}
          style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
            borderRadius:10, background:"var(--bg-secondary)",
            border:"1px solid var(--border)", cursor:"pointer",
            color:"var(--text-primary)", fontSize:13,
          }}
        >
          <Download size={15}/> CSV
        </button>
      </div>

      {/* Contatori */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[
          { label:"Presenti",  count:cntPresent, color:"var(--success)"        },
          { label:"Assenti",   count:cntAbsent,  color:"var(--text-secondary)" },
          { label:"Walk-in",   count:cntWalkin,  color:"var(--warning)"        },
          { label:"Totale",    count:total,       color:"var(--text-primary)"   },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, marginBottom:0, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:18, fontWeight:800, color:s.color }}>{s.count}</p>
            <p style={{ margin:"2px 0 0", fontSize:10, color:"var(--text-tertiary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ ...cardStyle, padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)" }}>Check-in completato</p>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{pct}%</p>
        </div>
        <div style={{ height:6, borderRadius:3, background:"var(--bg-primary)", overflow:"hidden" }}>
          <div style={{
            height:"100%", width:`${pct}%`,
            background:"var(--success)", borderRadius:3,
            transition:"width 0.3s ease",
          }}/>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:"relative", margin:"16px 0 10px" }}>
        <Search size={16} style={{
          position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
          color:"var(--text-tertiary)", pointerEvents:"none",
        }}/>
        <input type="search" placeholder="Cerca per nome..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft:36 }} />
      </div>

      {/* Filtri */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none", marginBottom:16, paddingBottom:2 }}>
        {[
          { key:"tutti",   label:"Tutti"    },
          { key:"present", label:"Presenti" },
          { key:"absent",  label:"Assenti"  },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              flexShrink:0, padding:"6px 14px", borderRadius:20,
              fontSize:12, fontWeight:500, cursor:"pointer",
              background: filter === f.key ? "var(--brand-light)" : "var(--bg-secondary)",
              color:      filter === f.key ? "var(--brand)"       : "var(--text-secondary)",
              border:     filter === f.key ? "1px solid var(--brand)" : "1px solid var(--border)",
              WebkitTapHighlightColor:"transparent",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Gruppi */}
      {guestGroups.map(group => {
        const filtered = filteredGuests(group.guests);
        const presenti = (group.guests || []).filter(g => g.presence === "present").length;
        if (filtered.length === 0 && search) return null;
        if (filtered.length === 0 && filter !== "tutti") return null;

        return (
          <div key={group.id} style={cardStyle}>
            {/* Header gruppo */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"11px 16px", borderBottom:"1px solid var(--border)",
              background:"var(--bg-secondary)",
            }}>
              <span style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{group.name}</span>
              <span style={{ fontSize:12, color:"var(--text-tertiary)" }}>
                {presenti}/{(group.guests || []).length} ✓
              </span>
            </div>

            {filtered.map(guest => {
              const isPresent = guest.presence === "present";
              const col  = avatarColor(guest.first_name);
              const name = `${guest.first_name} ${guest.last_name}`.trim();
              return (
                <div key={guest.id} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 16px", borderBottom:"1px solid var(--border)",
                  background: isPresent ? "color-mix(in srgb, var(--success-light) 40%, transparent)" : "transparent",
                  transition:"background 0.2s",
                }}>
                  {/* Avatar */}
                  <div style={{
                    width:36, height:36, borderRadius:"50%", flexShrink:0,
                    background:col.bg, color:col.fg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:700,
                  }}>
                    {initials(name)}
                  </div>

                  {/* Nome */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{
                      margin:0, fontSize:14, fontWeight:500,
                      color:"var(--text-primary)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>
                      {name}
                    </p>
                    <p style={{ margin:0, fontSize:11,
                      color: isPresent ? "var(--success)" : "var(--text-tertiary)" }}>
                      {isPresent ? "Presente" : "Assente"}
                    </p>
                  </div>

                  {/* Toggle presenza — grande e touch-friendly */}
                  <button
                    onClick={() => togglePresence(guest.id, group.id, guest.presence)}
                    style={{
                      width:44, height:44, borderRadius:"50%", flexShrink:0,
                      background: isPresent ? "var(--success)" : "var(--bg-primary)",
                      border: isPresent ? "none" : "2px solid var(--border)",
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"background 0.2s, border 0.2s",
                      WebkitTapHighlightColor:"transparent",
                    }}
                  >
                    {isPresent
                      ? <span style={{ color:"#fff", fontSize:20, lineHeight:1 }}>✓</span>
                      : <span style={{ color:"var(--text-tertiary)", fontSize:20, lineHeight:1 }}>○</span>}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Walk-in card */}
      <div style={{ ...cardStyle, border:"1px solid var(--warning)" }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"11px 16px", borderBottom:"1px solid var(--warning)",
          background:"var(--warning-light)",
        }}>
          <span style={{ fontSize:14, fontWeight:600, color:"var(--warning)" }}>
            🚶 Walk-in
          </span>
          <span style={{ fontSize:12, color:"var(--warning)" }}>
            {walkins.length} {walkins.length === 1 ? "persona" : "persone"}
          </span>
        </div>

        {walkins.map(w => {
          const name = `${w.first_name} ${w.last_name || ""}`.trim();
          const col  = avatarColor(w.first_name);
          return (
            <div key={w.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 16px", borderBottom:"1px solid var(--border)",
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%", flexShrink:0,
                background:col.bg, color:col.fg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:700,
              }}>
                {initials(name)}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:500, color:"var(--text-primary)" }}>
                  {name || "Sconosciuto"}
                </p>
                <p style={{ margin:0, fontSize:11, color:"var(--warning)" }}>Walk-in</p>
              </div>
              <button onClick={() => deleteWalkin(w.id)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"var(--text-tertiary)", display:"flex", padding:4 }}>
                <Trash2 size={15}/>
              </button>
            </div>
          );
        })}

        <button
          onClick={() => { setWalkinModal(true); setWalkinName(""); }}
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:8,
            padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
            color:"var(--warning)", fontSize:14, fontWeight:500,
            WebkitTapHighlightColor:"transparent",
          }}
        >
          <Plus size={16}/> Registra walk-in
        </button>
      </div>

      {/* ── Modal walk-in ── */}
      {walkinModal && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setWalkinModal(false); }}>
          <div style={sheetStyle}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>
                🚶 Registra walk-in
              </h2>
              <button onClick={() => setWalkinModal(false)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22}/>
              </button>
            </div>
            <div style={{ marginBottom:20 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>
                Nome (opzionale)
              </p>
              <input type="text" style={{ ...inputStyle, fontSize:15 }}
                placeholder="es. Mario Rossi"
                value={walkinName} autoFocus
                onChange={e => setWalkinName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addWalkin(); }} />
              <p style={{ margin:"8px 0 0", fontSize:12, color:"var(--text-tertiary)" }}>
                Se non inserisci il nome verrà registrato come "Sconosciuto"
              </p>
            </div>
            <button onClick={addWalkin} style={{
              width:"100%", padding:"14px", borderRadius:14,
              background:"var(--warning)", border:"none", cursor:"pointer",
              color:"#fff", fontSize:15, fontWeight:700,
            }}>
              Registra presenza
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
