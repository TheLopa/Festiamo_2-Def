import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LangContext";
import { CheckSquare, Plus, Trash2, ChevronDown, ChevronUp, Calendar } from "lucide-react";

const STATUS_CYCLE = { todo: "doing", doing: "done", done: "todo" };
const STATUS_LABELS = { todo: "Da fare", doing: "In corso", done: "Fatto" };
const STATUS_COLORS = {
  todo:  { bg: "var(--bg-secondary)",   color: "var(--text-secondary)",  border: "var(--border)"   },
  doing: { bg: "var(--warning-light)",  color: "var(--warning-text)",    border: "var(--warning)"  },
  done:  { bg: "var(--success-light)",  color: "var(--success-text)",    border: "var(--success)"  },
};

const DEFAULT_GROUPS = ["Venue e logistica", "Catering", "Musica e intrattenimento", "Invitati e comunicazioni"];

export default function Roadmap() {
  const { eventId } = useParams();
  const { t } = useLang();

  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [openTasks, setOpenTasks]   = useState({});
  const [addTaskForms, setAddTaskForms] = useState({});
  const [newTasks, setNewTasks]     = useState({});

  useEffect(() => { fetchData(); }, [eventId]);

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
      const withTasks = data.map(g => ({ ...g, roadmap_tasks: [] }));
      setGroups(withTasks);
      const open = {};
      data.forEach(g => { open[g.id] = true; });
      setOpenGroups(open);
    }
  }

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }

  // Statistiche globali
  const allTasks = groups.flatMap(g => g.roadmap_tasks || []);
  const doneTasks = allTasks.filter(t => t.status === "done").length;
  const total = allTasks.length;
  const pct = total ? Math.round((doneTasks / total) * 100) : 0;

  async function cycleStatus(taskId, groupId, currentStatus) {
    const newStatus = STATUS_CYCLE[currentStatus] || "todo";
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        roadmap_tasks: g.roadmap_tasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
      };
    }));
    setSaving(true);
    await supabase.from("roadmap_tasks").update({ status: newStatus }).eq("id", taskId);
    setSaving(false);
    showToast();
  }

  async function updateTask(taskId, groupId, field, value) {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        roadmap_tasks: g.roadmap_tasks.map(t =>
          t.id === taskId ? { ...t, [field]: value } : t
        ),
      };
    }));
    clearTimeout(window._roadmapTimer);
    window._roadmapTimer = setTimeout(async () => {
      setSaving(true);
      await supabase.from("roadmap_tasks").update({ [field]: value }).eq("id", taskId);
      setSaving(false);
      showToast();
    }, 800);
  }

  async function deleteTask(taskId, groupId) {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, roadmap_tasks: g.roadmap_tasks.filter(t => t.id !== taskId) };
    }));
    await supabase.from("roadmap_tasks").delete().eq("id", taskId);
    showToast();
  }

  async function addTask(groupId) {
    const form = newTasks[groupId] || {};
    const title = form.title?.trim();
    if (!title) return;
    const { data } = await supabase
      .from("roadmap_tasks")
      .insert({
        group_id: groupId,
        event_id: eventId,
        title,
        status: "todo",
        due_date: form.due_date || null,
        notes: form.notes || null,
      })
      .select()
      .single();
    if (data) {
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, roadmap_tasks: [...g.roadmap_tasks, data] };
      }));
    }
    setNewTasks(prev => ({ ...prev, [groupId]: {} }));
    setAddTaskForms(prev => ({ ...prev, [groupId]: false }));
    showToast();
  }

  function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  }

  function isOverdue(d, status) {
    if (!d || status === "done") return false;
    return new Date(d) < new Date();
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
          style={{ background: "var(--warning-light)" }}>
          <CheckSquare size={20} style={{ color: "var(--warning)" }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("roadmap")}</h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {saving ? "Salvataggio..." : t("autosave")}
          </p>
        </div>
        {toastVisible && (
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>{t("saved")} ✓</span>
        )}
      </div>

      {/* Progress */}
      <div className="card mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("completion")}</p>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{pct}%</p>
        </div>
        <div className="progress-track mb-3">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: t("todo"),  count: allTasks.filter(t => t.status === "todo").length,  color: "var(--text-secondary)" },
            { label: t("doing"), count: allTasks.filter(t => t.status === "doing").length, color: "var(--warning)"        },
            { label: t("done"),  count: doneTasks,                                          color: "var(--success)"        },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
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
          <div key={group.id} className="card mb-3" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header gruppo */}
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: "var(--bg-secondary)", border: "none", cursor: "pointer" }}
              onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !isOpen }))}
            >
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {group.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {done}/{tasks.length} completati
                </span>
                {isOpen
                  ? <ChevronUp size={16} style={{ color: "var(--text-tertiary)" }} />
                  : <ChevronDown size={16} style={{ color: "var(--text-tertiary)" }} />}
              </div>
            </button>

            {isOpen && (
              <div>
                {/* Task */}
                {tasks.map(task => {
                  const sc      = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
                  const overdue = isOverdue(task.due_date, task.status);
                  const isOpenTask = openTasks[task.id];

                  return (
                    <div key={task.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="px-4 py-3">
                        {/* Riga principale */}
                        <div className="flex items-start gap-2 mb-1">
                          <button
                            className="flex-1 text-left text-sm"
                            style={{
                              color: task.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)",
                              textDecoration: task.status === "done" ? "line-through" : "none",
                              background: "none", border: "none", cursor: "pointer", padding: 0,
                            }}
                            onClick={() => setOpenTasks(p => ({ ...p, [task.id]: !isOpenTask }))}
                          >
                            {task.title}
                          </button>
                          <button
                            className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                            style={{ background: sc.bg, color: sc.color,
                              border: `1px solid ${sc.border}`, cursor: "pointer" }}
                            onClick={() => cycleStatus(task.id, group.id, task.status)}
                          >
                            {STATUS_LABELS[task.status]}
                          </button>
                        </div>

                        {/* Data scadenza */}
                        {task.due_date && (
                          <p className="text-xs"
                            style={{ color: overdue ? "var(--danger)" : "var(--text-tertiary)" }}>
                            <Calendar size={11} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />
                            {fmtDate(task.due_date)}{overdue ? " · scaduto" : ""}
                          </p>
                        )}

                        {/* Dettaglio espandibile */}
                        {isOpenTask && (
                          <div className="mt-3 space-y-2">
                            {task.notes && (
                              <p className="text-xs p-2 rounded-lg"
                                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                                {task.notes}
                              </p>
                            )}
                            <input type="date" className="input-base text-sm"
                              value={task.due_date || ""}
                              onChange={e => updateTask(task.id, group.id, "due_date", e.target.value)} />
                            <textarea className="input-base text-sm" rows={2}
                              placeholder={t("notes")}
                              defaultValue={task.notes || ""}
                              onBlur={e => updateTask(task.id, group.id, "notes", e.target.value)} />
                            <button
                              className="flex items-center gap-1 text-xs"
                              style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                              onClick={() => deleteTask(task.id, group.id)}
                            >
                              <Trash2 size={13} /> {t("delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Form aggiungi task */}
                {addTaskForms[group.id] ? (
                  <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <input type="text" className="input-base mb-2" placeholder={t("task_title")}
                      value={newTasks[group.id]?.title || ""}
                      onChange={e => setNewTasks(p => ({ ...p, [group.id]: { ...p[group.id], title: e.target.value } }))} />
                    <input type="date" className="input-base mb-2"
                      value={newTasks[group.id]?.due_date || ""}
                      onChange={e => setNewTasks(p => ({ ...p, [group.id]: { ...p[group.id], due_date: e.target.value } }))} />
                    <textarea className="input-base mb-2 text-sm" rows={2} placeholder={t("notes")}
                      value={newTasks[group.id]?.notes || ""}
                      onChange={e => setNewTasks(p => ({ ...p, [group.id]: { ...p[group.id], notes: e.target.value } }))} />
                    <div className="flex gap-2">
                      <button className="btn-secondary flex-1 py-2 text-sm"
                        onClick={() => setAddTaskForms(p => ({ ...p, [group.id]: false }))}>{t("cancel")}</button>
                      <button className="btn-primary flex-1 py-2 text-sm"
                        onClick={() => addTask(group.id)}>{t("add")}</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm"
                    style={{ color: "var(--brand)", background: "none", border: "none",
                      borderTop: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => setAddTaskForms(p => ({ ...p, [group.id]: true }))}
                  >
                    <Plus size={15} /> {t("add_task")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
