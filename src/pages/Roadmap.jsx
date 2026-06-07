import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { CheckSquare, Plus, Trash2, ChevronDown, ChevronUp, Calendar, X } from "lucide-react";

const STATUS_CYCLE  = { todo: "doing", doing: "done", done: "todo" };
const STATUS_LABELS = { todo: "Da fare", doing: "In corso", done: "Fatto" };
const STATUS_COLORS = {
  todo:  { bg: "var(--bg-primary)",    color: "var(--text-secondary)", border: "var(--border)"  },
  doing: { bg: "var(--warning-light)", color: "var(--warning)",        border: "var(--warning)" },
  done:  { bg: "var(--success-light)", color: "var(--success)",        border: "var(--success)" },
};

const DEFAULT_GROUPS = [
  "Venue e logistica",
  "Catering",
  "Musica e intrattenimento",
  "Invitati e comunicazioni",
];

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}
function isOverdue(d, status) {
  if (!d || status === "done") return false;
  return new Date(d) < new Date();
}

export default function Roadmap() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toastMsg,    setToastMsg]    = useState("");
  const [openGroups,  setOpenGroups]  = useState({});
  const [openTasks,   setOpenTasks]   = useState({});

  // Modal aggiungi task
  const [taskModal, setTaskModal] = useState(null); // { groupId }
  const [taskForm,  setTaskForm]  = useState({ title: "", due_date: "", notes: "" });

  // Modal aggiungi gruppo
  const [groupModal, setGroupModal] = useState(false);
  const [groupName,  setGroupName]  = useState("");

  // Modal dettaglio task (edit)
  const [editModal, setEditModal] = useState(null); // { task, groupId }
  const [editForm,  setEditForm]  = useState({ due_date: "", notes: "" });

  useEffect(() => { fetchData(); }, [eventId]);

  function showToast(msg = "Salvato") {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  async function fetchData() {
    const { data } = await supabase
      .from("roadmap_groups")
      .select("*, roadmap_tasks(*)")
      .eq("event_id", eventId)
      .order("sort_order");

    if (data && data.length > 0) {
      setGroups(data);
      const open = {};
      data.forEach(g => { open[g.id] = true; });
      setOpenGroups(open);
    } else {
      await createDefaultGroups();
    }
    setLoading(false);
  }

  async function createDefaultGroups() {
    const { data } = await supabase
      .from("roadmap_groups")
      .insert(DEFAULT_GROUPS.map((name, i) => ({ event_id: eventId, name, sort_order: i })))
      .select();
    if (data) {
      setGroups(data.map(g => ({ ...g, roadmap_tasks: [] })));
      const open = {};
      data.forEach(g => { open[g.id] = true; });
      setOpenGroups(open);
    }
  }

  async function addGroup() {
    const name = groupName.trim();
    if (!name) return;
    const { data } = await supabase
      .from("roadmap_groups")
      .insert({ event_id: eventId, name, sort_order: groups.length })
      .select().single();
    if (data) {
      setGroups(prev => [...prev, { ...data, roadmap_tasks: [] }]);
      setOpenGroups(prev => ({ ...prev, [data.id]: true }));
    }
    setGroupModal(false);
    setGroupName("");
    showToast("Gruppo aggiunto");
  }

  async function cycleStatus(taskId, groupId, currentStatus) {
    const newStatus = STATUS_CYCLE[currentStatus] || "todo";
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, roadmap_tasks: g.roadmap_tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )};
    }));
    // Aggiorna anche editModal se aperto
    if (editModal?.task?.id === taskId) {
      setEditModal(prev => ({ ...prev, task: { ...prev.task, status: newStatus } }));
    }
    setSaving(true);
    await supabase.from("roadmap_tasks").update({ status: newStatus }).eq("id", taskId);
    setSaving(false);
    showToast();
  }

  async function addTask() {
    if (!taskModal) return;
    const { groupId } = taskModal;
    const title = taskForm.title?.trim();
    if (!title) return;
    const { data } = await supabase
      .from("roadmap_tasks")
      .insert({
        group_id: groupId, event_id: eventId,
        title, status: "todo",
        due_date: taskForm.due_date || null,
        notes: taskForm.notes || null,
      })
      .select().single();
    if (data) {
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, roadmap_tasks: [...g.roadmap_tasks, data] };
      }));
    }
    setTaskModal(null);
    setTaskForm({ title: "", due_date: "", notes: "" });
    showToast("Task aggiunto");
  }

  async function saveEdit() {
    if (!editModal) return;
    const { task, groupId } = editModal;
    setSaving(true);
    await supabase.from("roadmap_tasks")
      .update({ due_date: editForm.due_date || null, notes: editForm.notes || null })
      .eq("id", task.id);
    setSaving(false);
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, roadmap_tasks: g.roadmap_tasks.map(t =>
        t.id === task.id ? { ...t, due_date: editForm.due_date || null, notes: editForm.notes || null } : t
      )};
    }));
    setEditModal(null);
    showToast();
  }

  async function deleteTask(taskId, groupId) {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, roadmap_tasks: g.roadmap_tasks.filter(t => t.id !== taskId) };
    }));
    await supabase.from("roadmap_tasks").delete().eq("id", taskId);
    setEditModal(null);
    showToast("Task eliminato");
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

  const allTasks  = groups.flatMap(g => g.roadmap_tasks || []);
  const doneTasks = allTasks.filter(t => t.status === "done").length;
  const total     = allTasks.length;
  const pct       = total ? Math.round((doneTasks / total) * 100) : 0;

  const cardStyle = {
    background:"var(--bg-secondary)",
    border:"1px solid var(--border)",
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
          background:"var(--warning-light)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <CheckSquare size={20} style={{ color:"var(--warning)" }} />
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Roadmap</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : "Salvataggio automatico"}
          </p>
        </div>
      </div>

      {/* Progress card */}
      <div style={{ ...cardStyle, padding:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)" }}>Completamento</p>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{pct}%</p>
        </div>
        {/* Barra progresso */}
        <div style={{
          height:6, borderRadius:3, background:"var(--bg-primary)",
          marginBottom:14, overflow:"hidden",
        }}>
          <div style={{
            height:"100%", width:`${pct}%`,
            background:"var(--success)", borderRadius:3,
            transition:"width 0.3s ease",
          }}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
          {[
            { label:"Da fare",  count: allTasks.filter(t => t.status === "todo").length,  color:"var(--text-secondary)" },
            { label:"In corso", count: allTasks.filter(t => t.status === "doing").length, color:"var(--warning)"        },
            { label:"Fatto",    count: doneTasks,                                          color:"var(--success)"        },
          ].map(s => (
            <div key={s.label}>
              <p style={{ margin:0, fontSize:20, fontWeight:800, color:s.color }}>{s.count}</p>
              <p style={{ margin:0, fontSize:11, color:"var(--text-tertiary)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gruppi */}
      {groups.map(group => {
        const tasks  = group.roadmap_tasks || [];
        const done   = tasks.filter(t => t.status === "done").length;
        const isOpen = openGroups[group.id] !== false;

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
                <span style={{ fontSize:12, color:"var(--text-tertiary)" }}>{done}/{tasks.length}</span>
                {isOpen
                  ? <ChevronUp size={16} style={{ color:"var(--text-tertiary)" }}/>
                  : <ChevronDown size={16} style={{ color:"var(--text-tertiary)" }}/>}
              </div>
            </button>

            {isOpen && (
              <div>
                {tasks.map(task => {
                  const sc      = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
                  const overdue = isOverdue(task.due_date, task.status);

                  return (
                    <div key={task.id} style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"12px 16px", borderBottom:"1px solid var(--border)",
                    }}>
                      {/* Titolo + data — tappa per aprire edit */}
                      <button
                        onClick={() => {
                          setEditModal({ task, groupId: group.id });
                          setEditForm({ due_date: task.due_date || "", notes: task.notes || "" });
                        }}
                        style={{
                          flex:1, textAlign:"left", background:"none", border:"none",
                          cursor:"pointer", padding:0, minWidth:0,
                          WebkitTapHighlightColor:"transparent",
                        }}
                      >
                        <p style={{
                          margin:0, fontSize:14,
                          color: task.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)",
                          textDecoration: task.status === "done" ? "line-through" : "none",
                          lineHeight:1.3,
                        }}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p style={{ margin:"3px 0 0", fontSize:11,
                            color: overdue ? "var(--danger)" : "var(--text-tertiary)",
                            display:"flex", alignItems:"center", gap:3 }}>
                            <Calendar size={11}/> {fmtDate(task.due_date)}{overdue ? " · scaduto" : ""}
                          </p>
                        )}
                      </button>

                      {/* Badge status — tappa per ciclare */}
                      <button
                        onClick={() => cycleStatus(task.id, group.id, task.status)}
                        style={{
                          flexShrink:0, padding:"5px 10px", borderRadius:20,
                          background:sc.bg, color:sc.color,
                          border:`1px solid ${sc.border}`,
                          fontSize:11, fontWeight:600, cursor:"pointer",
                          WebkitTapHighlightColor:"transparent",
                        }}
                      >
                        {STATUS_LABELS[task.status]}
                      </button>
                    </div>
                  );
                })}

                {/* Aggiungi task */}
                <button
                  onClick={() => { setTaskModal({ groupId: group.id }); setTaskForm({ title:"", due_date:"", notes:"" }); }}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:8,
                    padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
                    color:"var(--brand)", fontSize:14, fontWeight:500,
                    WebkitTapHighlightColor:"transparent",
                  }}
                >
                  <Plus size={16} /> Aggiungi task
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottone nuovo gruppo */}
      <button
        onClick={() => { setGroupModal(true); setGroupName(""); }}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          padding:"13px 16px",
          background:"none", border:"1px dashed var(--border)",
          borderRadius:16, cursor:"pointer",
          color:"var(--brand)", fontSize:14, fontWeight:500,
          WebkitTapHighlightColor:"transparent",
        }}
      >
        <Plus size={16} /> Nuovo gruppo
      </button>

      {/* ── Modal aggiungi task ── */}
      {taskModal && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setTaskModal(null); }}>
          <div style={sheetStyle}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)" }}>Aggiungi task</h2>
              <button onClick={() => setTaskModal(null)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22}/>
              </button>
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Titolo</p>
              <input type="text" style={{ ...inputStyle, fontSize:15 }} placeholder="es. Confermare il catering..."
                value={taskForm.title} autoFocus
                onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") addTask(); }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Scadenza (opzionale)</p>
              <input type="date" style={inputStyle}
                value={taskForm.due_date}
                onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div style={{ marginBottom:20 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Note (opzionale)</p>
              <textarea style={{ ...inputStyle, resize:"none" }} rows={2} placeholder="Dettagli..."
                value={taskForm.notes}
                onChange={e => setTaskForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <button onClick={addTask} style={{
              width:"100%", padding:"14px", borderRadius:14,
              background:"var(--brand)", border:"none", cursor:"pointer",
              color:"#fff", fontSize:15, fontWeight:700,
            }}>
              Aggiungi
            </button>
          </div>
        </div>
      )}

      {/* ── Modal dettaglio/edit task ── */}
      {editModal && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div style={sheetStyle}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"var(--text-primary)", flex:1, marginRight:8 }}>
                {editModal.task.title}
              </h2>
              <button onClick={() => setEditModal(null)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-tertiary)", display:"flex" }}>
                <X size={22}/>
              </button>
            </div>

            {/* Badge status ciclabile */}
            <div style={{ marginBottom:20 }}>
              <button
                onClick={() => cycleStatus(editModal.task.id, editModal.groupId, editModal.task.status)}
                style={{
                  padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                  background: STATUS_COLORS[editModal.task.status]?.bg,
                  color:      STATUS_COLORS[editModal.task.status]?.color,
                  border:     `1px solid ${STATUS_COLORS[editModal.task.status]?.border}`,
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                {STATUS_LABELS[editModal.task.status]} — tocca per cambiare
              </button>
            </div>

            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Scadenza</p>
              <input type="date" style={inputStyle}
                value={editForm.due_date}
                onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div style={{ marginBottom:20 }}>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-tertiary)" }}>Note</p>
              <textarea style={{ ...inputStyle, resize:"none" }} rows={3} placeholder="Dettagli..."
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <button onClick={saveEdit} style={{
              width:"100%", padding:"14px", borderRadius:14,
              background:"var(--brand)", border:"none", cursor:"pointer",
              color:"#fff", fontSize:15, fontWeight:700, marginBottom:12,
            }}>
              Salva modifiche
            </button>
            <button
              onClick={() => deleteTask(editModal.task.id, editModal.groupId)}
              style={{
                width:"100%", padding:"12px", borderRadius:14,
                background:"none", border:"1px solid var(--danger)", cursor:"pointer",
                color:"var(--danger)", fontSize:14, fontWeight:600,
              }}
            >
              Elimina task
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
              <input type="text" style={{ ...inputStyle, fontSize:15 }} placeholder="es. Fotografia, Decorazioni..."
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
