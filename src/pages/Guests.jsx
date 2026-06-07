import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { Users, Plus, Trash2, Download, ChevronDown, ChevronUp, X, Search } from "lucide-react";

const STATUS_CYCLE  = { wait: "yes", yes: "no", no: "wait" };
const STATUS_LABELS = { yes: "Confermato", no: "Declinato", wait: "In attesa" };
const STATUS_COLORS = {
  yes:  { bg: "var(--success-light)", color: "var(--success)", border: "var(--success)" },
  no:   { bg: "var(--danger-light)",  color: "var(--danger)",  border: "var(--danger)"  },
  wait: { bg: "var(--bg-primary)",    color: "var(--text-secondary)", border: "var(--border)" },
};

const AVATAR_COLORS = [
  { bg: "var(--brand-light)",   fg: "var(--brand)"   },
  { bg: "var(--success-light)", fg: "var(--success)"  },
  { bg: "var(--warning-light)", fg: "var(--warning)"  },
  { bg: "var(--danger-light)",  fg: "var(--danger)"   },
];

function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Guests() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [guestGroups, setGuestGroups] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toastMsg,    setToastMsg]    = useState("");
  const [openGroups,  setOpenGroups]  = useState({});
  const [filter,      setFilter]      = useState("tutti");
  const [search,      setSearch]      = useState("");

  // Modal aggiungi invitato
  const [guestModal, setGuestModal] = useState(null); // { groupId }
  const [guestForm,  setGuestForm]  = useState({ first_name:"", last_name:"", confirmation:"wait", gender:"" });

  // Modal aggiungi gruppo
  const [groupModal, setGroupModal] = useState(false);
  const [groupName,  setGroupName]  = useState("");

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
    if (groups) {
      setGuestGroups(groups);
      const open = {};
      groups.forEach(g => { open[g.id] = true; });
      setOpenGroups(open);
    }
    setLoading(false);
  }

  const allGuests = guestGroups.flatMap(g => g.guests || []);
  const cntYes    = allGuests.filter(g => g.confirmation === "yes").length;
  const cntNo     = allGuests.filter(g => g.confirmation === "no").length;
  const cntWait   = allGuests.filter(g => g.confirmation === "wait").length;

  async function cycleConfirmation(guestId, groupId, current) {
    const next = STATUS_CYCLE[current] || "wait";
    setGuestGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, guests: g.guests.map(gu => gu.id === guestId ? { ...gu, confirmation: next } : gu) };
    }));
    await supabase.from("guests").update({ confirmation: next }).eq("id", guestId);
    showToast();
  }

  async function deleteGuest(guestId, groupId) {
    setGuestGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, guests: g.guests.filter(gu => gu.id !== guestId) };
    }));
    await supabase.from("guests").delete().eq("id", guestId);
    showToast("Eliminato");
  }

  async function addGuest() {
    if (!guestModal) return;
    const { groupId } = guestModal;
    const firstName = guestForm.first_name?.trim();
    if (!firstName) return;
    const { data } = await supabase
      .from("guests")
      .insert({
        event_id: eventId, group_id: groupId,
        first_name: firstName,
        last_name: guestForm.last_name?.trim() || "",
        gender: guestForm.gender || null,
        confirmation: guestForm.confirmation || "wait",
      })
      .select().single();
    if (data) {
      setGuestGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, guests: [...g.guests, data] };
      }));
    }
    setGuestModal(null);
    setGuestForm({ first_name:"", last_name:"", confirmation:"wait", gender:"" });
    showToast();
  }

  async function addGroup() {
    const name = groupName.trim();
    if (!name) return;
    const { data } = await supabase
      .from("guest_groups")
      .insert({ event_id: eventId, name, sort_order: guestGroups.length })
      .select().single();
    if (data) {
      setGuestGroups(prev => [...prev, { ...data, guests: [] }]);
      setOpenGroups(prev => ({ ...prev, [data.id]: true }));
    }
    setGroupModal(false);
    setGroupName("");
    showToast("Gruppo aggiunto");
  }

  function downloadCSV() {
    const rows = [["Nome", "Cognome", "Gruppo", "Conferma", "Genere"]];
    guestGroups.forEach(g => {
      (g.guests || []).forEach(gu => {
        rows.push([gu.first_name, gu.last_name, g.name,
          STATUS_LABELS[gu.confirmation] || "In attesa", gu.gender || ""]);
      });
    });
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "invitati.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Scaricato!");
  }

  function filteredGuests(guests) {
    return (guests || []).filter(gu => {
      const matchFilter = filter === "tutti" || gu.confirmation === filter;
      const fullName    = `${gu.first_name} ${gu.last_name}`.toLowerCase();
      const matchSearch = !search || fullName.includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
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

  const isEmpty = allGuests.length === 0;

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
          background:"var(--brand-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Users size={20} style={{ color:"var(--brand)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Invitati</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {allGuests.length} totali
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={isEmpty}
          style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
            borderRadius:10, background:"var(--bg-secondary)",
            border:"1px solid var(--border)", cursor: isEmpty ? "not-allowed" : "pointer",
            color: isEmpty ? "var(--text-tertiary)" : "var(--text-primary)",
            fontSize:13, opacity: isEmpty ? 0.5 : 1,
          }}
        >
          <Download size={15}/> CSV
        </button>
      </div>

      {/* Contatori */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"Confermati", count:cntYes,  color:"var(--success)" },
          { label:"In attesa",  count:cntWait, color:"var(--text-secondary)" },
          { label:"Declinati",  count:cntNo,   color:"var(--danger)" },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, marginBottom:0, padding:"12px", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:s.color }}>{s.count}</p>
            <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--text-tertiary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      {!isEmpty && (
        <div style={{ position:"relative", marginBottom:10 }}>
          <Search size={16} style={{
            position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            color:"var(--text-tertiary)", pointerEvents:"none",
          }}/>
          <input
            type="search" placeholder="Cerca per nome..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft:36 }}
          />
        </div>
      )}

      {/* Filtri */}
      {!isEmpty && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none", marginBottom:16, paddingBottom:2 }}>
          {["tutti", "yes", "wait", "no"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flexShrink:0, padding:"6px 14px", borderRadius:20,
                fontSize:12, fontWeight:500, cursor:"pointer",
                background: filter === f ? "var(--brand-light)" : "var(--bg-secondary)",
                color:      filter === f ? "var(--brand)"       : "var(--text-secondary)",
                border:     filter === f ? "1px solid var(--brand)" : "1px solid var(--border)",
                WebkitTapHighlightColor:"transparent",
              }}
            >
              {f === "tutti" ? "Tutti" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          <p style={{ margin:"0 0 6px", fontSize:16, fontWeight:600, color:"var(--text-primary)" }}>
            Nessun invitato
          </p>
          <p style={{ margin:"0 0 20px", fontSize:14, color:"var(--text-secondary)" }}>
            Crea un gruppo per iniziare ad aggiungere invitati
          </p>
          <button
            onClick={() => { setGroupModal(true); setGroupName(""); }}
            style={{
              padding:"12px 24px", borderRadius:12,
              background:"var(--brand)", border:"none", cursor:"pointer",
              color:"#fff", fontSize:14, fontWeight:600,
            }}
          >
            + Crea gruppo
          </button>
        </div>
      )}

      {/* Gruppi */}
      {guestGroups.map(group => {
        const filtered = filteredGuests(group.guests);
        const isOpen   = openGroups[group.id] !== false;
        if (filter !== "tutti" && filtered.length === 0 && !search) return null;

        return (
          <div key={group.id} style={cardStyle}>
            {/* Header gruppo */}
            <button
              onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !isOpen }))}
              style={{
                width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"13px 16px", background:"none", border:"none", cursor:"pointer",
                borderBottom: isOpen ? "1px solid var(--border)" : "none",
                WebkitTapHighlightColor:"transparent",
              }}
            >
              <span style={{ fontSize:15, fontWeight:600, color:"var(--text-primary)" }}>{group.name}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--text-tertiary)" }}>
                  {(group.guests || []).length} invitati
                </span>
                {isOpen
                  ? <ChevronUp size={16} style={{ color:"var(--text-tertiary)" }}/>
                  : <ChevronDown size={16} style={{ color:"var(--text-tertiary)" }}/>}
              </div>
            </button>

            {isOpen && (
              <div>
                {filtered.length === 0 && search && (
                  <p style={{ padding:"12px 16px", fontSize:13, color:"var(--text-tertiary)" }}>
                    Nessun risultato
                  </p>
                )}

                {filtered.map(guest => {
                  const col  = avatarColor(guest.first_name);
                  const sc   = STATUS_COLORS[guest.confirmation] || STATUS_COLORS.wait;
                  const name = `${guest.first_name} ${guest.last_name}`.trim();
                  return (
                    <div key={guest.id} style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"10px 16px", borderBottom:"1px solid var(--border)",
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
                        <p style={{ margin:0, fontSize:14, fontWeight:500, color:"var(--text-primary)",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {name}
                        </p>
                        {guest.gender && (
                          <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>{guest.gender}</p>
                        )}
                      </div>

                      {/* Badge status */}
                      <button
                        onClick={() => cycleConfirmation(guest.id, group.id, guest.confirmation)}
                        style={{
                          flexShrink:0, padding:"5px 10px", borderRadius:20,
                          background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`,
                          fontSize:11, fontWeight:600, cursor:"pointer",
                          WebkitTapHighlightColor:"transparent",
                        }}
                      >
                        {STATUS_LABELS[guest.confirmation] || "In attesa"}
                      </button>

                      {/* Elimina */}
                      <button
                        onClick={() => deleteGuest(guest.id, group.id)}
                        style={{ background:"none", border:"none", cursor:"pointer",
                          color:"var(--text-tertiary)", display:"flex", padding:4, flexShrink:0 }}
                      >
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  );
                })}

                {/* Aggiungi invitato */}
                <button
                  onClick={() => { setGuestModal({ groupId: group.id }); setGuestForm({ first_name:"", last_name:"", confirmation:"wait", gender:"" }); }}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:8,
                    padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
                    color:"var(--brand)", fontSize:14, fontWeight:500,
                    WebkitTapHighlightColor:"transparent",
                  }}
                >
                  <Plus size={16}/> Aggiungi invitato
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottone nuovo gruppo */}
      {!isEmpty && (
        <button
          onClick={() => { setGroupModal(true); setGroupName(""); }}
          style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            padding:"13px 16px", background:"none",
            border:"1px dashed var(--border)", borderRadius:16, cursor:"pointer",
            color:"var(--brand)", fontSize:14, fontWeight:500,
            WebkitTapHighlightColor:"transparent",
          }}
        >
          <Plus size={16}/> Nuovo gruppo
        </button>
      )}

      {/* ── Modal aggiungi invitato ── */}
      {guestModal && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setGuestModal(null); }}>
          <div style={sheetStyle}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Aggiungi invitato</h2>
              <button onClick={() => setGuestModal(null)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22}/>
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Nome *</p>
                <input type="text" style={inputStyle} placeholder="Mario"
                  value={guestForm.first_name} autoFocus
                  onChange={e => setGuestForm(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Cognome</p>
                <input type="text" style={inputStyle} placeholder="Rossi"
                  value={guestForm.last_name}
                  onChange={e => setGuestForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              <div>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Conferma</p>
                <select style={{ ...inputStyle, appearance:"none" }}
                  value={guestForm.confirmation}
                  onChange={e => setGuestForm(p => ({ ...p, confirmation: e.target.value }))}>
                  <option value="wait">In attesa</option>
                  <option value="yes">Confermato</option>
                  <option value="no">Declinato</option>
                </select>
              </div>
              <div>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Genere</p>
                <select style={{ ...inputStyle, appearance:"none" }}
                  value={guestForm.gender}
                  onChange={e => setGuestForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Non specificato</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="altro">Altro</option>
                </select>
              </div>
            </div>

            <button onClick={addGuest} style={{
              width:"100%", padding:"14px", borderRadius:14,
              background:"var(--brand)", border:"none", cursor:"pointer",
              color:"#fff", fontSize:15, fontWeight:700,
            }}>
              Aggiungi
            </button>
          </div>
        </div>
      )}

      {/* ── Modal nuovo gruppo ── */}
      {groupModal && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setGroupModal(false); }}>
          <div style={sheetStyle}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Nuovo gruppo</h2>
              <button onClick={() => setGroupModal(false)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22}/>
              </button>
            </div>
            <div style={{ marginBottom:20 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Nome gruppo</p>
              <input type="text" style={{ ...inputStyle, fontSize:15 }}
                placeholder="es. Famiglia, Amici, Colleghi..."
                value={groupName} autoFocus
                onChange={e => setGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addGroup(); }} />
            </div>
            <button onClick={addGroup} style={{
              width:"100%", padding:"14px", borderRadius:14,
              background:"var(--brand)", border:"none", cursor:"pointer",
              color:"#fff", fontSize:15, fontWeight:700,
            }}>
              Crea gruppo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
