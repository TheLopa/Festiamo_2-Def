import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { Users, Plus, Trash2, Upload, Download, ChevronDown, ChevronUp, Info } from "lucide-react";

const STATUS_CYCLE  = { wait: "yes", yes: "no", no: "wait" };
const STATUS_LABELS = { yes: "Confermato", no: "Declinato", wait: "In attesa" };
const STATUS_COLORS = {
  yes:  { bg: "var(--success-light)", color: "var(--success-text)" },
  no:   { bg: "var(--danger-light)",  color: "var(--danger-text)"  },
  wait: { bg: "var(--bg-secondary)",  color: "var(--text-secondary)" },
};

function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "var(--brand-light)",   fg: "var(--brand-text)"   },
  { bg: "var(--success-light)", fg: "var(--success-text)"  },
  { bg: "var(--warning-light)", fg: "var(--warning-text)"  },
  { bg: "var(--danger-light)",  fg: "var(--danger-text)"   },
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Guests() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [guestGroups, setGuestGroups]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg]         = useState("");
  const [openGroups, setOpenGroups]     = useState({});
  const [addForms, setAddForms]         = useState({});
  const [newGuests, setNewGuests]       = useState({});
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showInfo, setShowInfo]         = useState(false);
  const [filter, setFilter]             = useState("tutti");
  const [search, setSearch]             = useState("");

  useEffect(() => { fetchData(); }, [eventId]);

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

  function showToast(msg = t("saved")) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
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
    showToast(t("delete"));
  }

  async function addGuest(groupId) {
    const form = newGuests[groupId] || {};
    const firstName = form.first_name?.trim();
    const lastName  = form.last_name?.trim();
    if (!firstName) return;
    const { data } = await supabase
      .from("guests")
      .insert({
        event_id: eventId,
        group_id: groupId,
        first_name: firstName,
        last_name: lastName || "",
        gender: form.gender || null,
        confirmation: form.confirmation || "wait",
      })
      .select()
      .single();
    if (data) {
      setGuestGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, guests: [...g.guests, data] };
      }));
    }
    setNewGuests(prev => ({ ...prev, [groupId]: {} }));
    setAddForms(prev => ({ ...prev, [groupId]: false }));
    showToast();
  }

  async function addGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    const { data } = await supabase
      .from("guest_groups")
      .insert({ event_id: eventId, name, sort_order: guestGroups.length })
      .select()
      .single();
    if (data) {
      setGuestGroups(prev => [...prev, { ...data, guests: [] }]);
      setOpenGroups(prev => ({ ...prev, [data.id]: true }));
    }
    setNewGroupName("");
    setShowAddGroup(false);
    showToast();
  }

  function downloadExcel() {
    const rows = [["Nome", "Cognome", "Gruppo", "Conferma", "Genere"]];
    guestGroups.forEach(g => {
      (g.guests || []).forEach(gu => {
        rows.push([
          gu.first_name, gu.last_name, g.name,
          STATUS_LABELS[gu.confirmation] || "In attesa",
          gu.gender || "",
        ]);
      });
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
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
      const fullName = `${gu.first_name} ${gu.last_name}`.toLowerCase();
      const matchSearch = !search || fullName.includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }

  const isEmpty = allGuests.length === 0;

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
          style={{ background: "var(--brand-light)" }}>
          <Users size={20} style={{ color: "var(--brand)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("guests")}</h1>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{toastMsg} ✓</span>
        )}
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: t("confirmed"), count: cntYes,  color: "var(--success)" },
          { label: t("waiting"),   count: cntWait, color: "var(--text-secondary)" },
          { label: t("declined"),  count: cntNo,   color: "var(--danger)" },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Excel buttons */}
      <div className="flex gap-2 mb-1">
        <button className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1"
          onClick={downloadExcel} disabled={isEmpty}>
          <Download size={14} /> {t("download_excel")}
        </button>
        <button className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1">
          <Upload size={14} /> {t("upload_excel")}
        </button>
      </div>

      {/* Info formato Excel */}
      <div className="flex items-center gap-1 mb-4">
        <p className="text-xs flex-1" style={{ color: "var(--text-tertiary)" }}>
          {t("upload_warning")}
        </p>
        <button onClick={() => setShowInfo(p => !p)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
          <Info size={14} />
        </button>
      </div>

      {showInfo && (
        <div className="card mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
          <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Formato Excel</p>
          <p>Colonne: <strong>Nome · Cognome · Gruppo · Conferma · Genere</strong></p>
          <p className="mt-1">Conferma: <code>Confermato</code>, <code>Declinato</code>, <code>In attesa</code></p>
          <p className="mt-1">Genere: <code>M</code>, <code>F</code>, <code>Altro</code> (facoltativo)</p>
          <p className="mt-1" style={{ color: "var(--warning-text)" }}>⚠ L'upload sovrascrive tutti i dati esistenti</p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="empty-state mb-4">
          <div className="empty-icon"><span style={{ fontSize: "24px" }}>👥</span></div>
          <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>{t("no_guests")}</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{t("no_guests_sub")}</p>
          <button className="btn-primary"
            onClick={() => { setShowAddGroup(true); }}>
            <Plus size={16} /> {t("add_group")}
          </button>
        </div>
      )}

      {/* Search + filtri */}
      {!isEmpty && (
        <>
          <input type="search" className="input-base mb-3"
            placeholder={t("search_name")} value={search}
            onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {["tutti", "yes", "wait", "no"].map(f => (
              <button key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1.5 rounded-full flex-shrink-0"
                style={{
                  background: filter === f ? "var(--brand-light)" : "var(--bg-secondary)",
                  color: filter === f ? "var(--brand-text)" : "var(--text-secondary)",
                  border: filter === f ? "1px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}>
                {f === "tutti" ? t("filter_all") : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Gruppi */}
      {guestGroups.map(group => {
        const filtered = filteredGuests(group.guests);
        const isOpen   = openGroups[group.id] !== false;
        if (filter !== "tutti" && filtered.length === 0 && !search) return null;

        return (
          <div key={group.id} className="card mb-3" style={{ padding: 0, overflow: "hidden" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: "var(--bg-secondary)", border: "none", cursor: "pointer" }}
              onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !isOpen }))}
            >
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{group.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {(group.guests || []).length} invitati
                </span>
                {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-tertiary)" }} />
                        : <ChevronDown size={16} style={{ color: "var(--text-tertiary)" }} />}
              </div>
            </button>

            {isOpen && (
              <div>
                {filtered.length === 0 && search && (
                  <p className="px-4 py-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Nessun risultato
                  </p>
                )}

                {filtered.map(guest => {
                  const col  = avatarColor(guest.first_name);
                  const sc   = STATUS_COLORS[guest.confirmation] || STATUS_COLORS.wait;
                  const name = `${guest.first_name} ${guest.last_name}`.trim();
                  return (
                    <div key={guest.id} className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
                        style={{ background: col.bg, color: col.fg }}>
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                        {guest.gender && (
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{guest.gender}</p>
                        )}
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: sc.bg, color: sc.color, border: "none", cursor: "pointer" }}
                        onClick={() => cycleConfirmation(guest.id, group.id, guest.confirmation)}
                      >
                        {STATUS_LABELS[guest.confirmation] || "In attesa"}
                      </button>
                      <button onClick={() => deleteGuest(guest.id, group.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* Form aggiungi invitato */}
                {addForms[group.id] ? (
                  <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex gap-2 mb-2">
                      <input type="text" className="input-base flex-1" placeholder="Nome"
                        value={newGuests[group.id]?.first_name || ""}
                        onChange={e => setNewGuests(p => ({ ...p, [group.id]: { ...p[group.id], first_name: e.target.value } }))} />
                      <input type="text" className="input-base flex-1" placeholder="Cognome"
                        value={newGuests[group.id]?.last_name || ""}
                        onChange={e => setNewGuests(p => ({ ...p, [group.id]: { ...p[group.id], last_name: e.target.value } }))} />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <select className="input-base flex-1"
                        value={newGuests[group.id]?.confirmation || "wait"}
                        onChange={e => setNewGuests(p => ({ ...p, [group.id]: { ...p[group.id], confirmation: e.target.value } }))}>
                        <option value="wait">In attesa</option>
                        <option value="yes">Confermato</option>
                        <option value="no">Declinato</option>
                      </select>
                      <select className="input-base flex-1"
                        value={newGuests[group.id]?.gender || ""}
                        onChange={e => setNewGuests(p => ({ ...p, [group.id]: { ...p[group.id], gender: e.target.value } }))}>
                        <option value="">Genere (opz.)</option>
                        <option value="M">M</option>
                        <option value="F">F</option>
                        <option value="altro">Altro</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary flex-1 py-2 text-sm"
                        onClick={() => setAddForms(p => ({ ...p, [group.id]: false }))}>{t("cancel")}</button>
                      <button className="btn-primary flex-1 py-2 text-sm"
                        onClick={() => addGuest(group.id)}>{t("add")}</button>
                    </div>
                  </div>
                ) : (
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{ color: "var(--brand)", background: "none", border: "none",
                      borderTop: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => setAddForms(p => ({ ...p, [group.id]: true }))}>
                    <Plus size={15} /> {t("add_guest")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Aggiungi gruppo */}
      {showAddGroup ? (
        <div className="card">
          <input type="text" className="input-base mb-2" placeholder={t("group_name")}
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 py-2 text-sm"
              onClick={() => { setShowAddGroup(false); setNewGroupName(""); }}>{t("cancel")}</button>
            <button className="btn-primary flex-1 py-2 text-sm" onClick={addGroup}>{t("add")}</button>
          </div>
        </div>
      ) : (
        <button className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm mt-1"
          style={{ border: "1.5px dashed var(--border-strong)", color: "var(--text-secondary)",
            background: "none", cursor: "pointer" }}
          onClick={() => setShowAddGroup(true)}>
          <Plus size={16} /> {t("add_group")}
        </button>
      )}
    </div>
  );
}
