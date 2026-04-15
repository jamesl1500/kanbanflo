'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database";
import styles from "@/styles/pages/companies/tasks.module.scss";

type Workspace = Tables<"workspaces">;
type KanbanList = Tables<"kanban_lists">;
type KanbanCard = Tables<"kanban_cards">;
type KanbanSubtask = Tables<"kanban_subtasks">;

interface TaskDetailsClientProps {
    companySlug: string;
    workspaces: Pick<Workspace, "id" | "name">[];
    lists: Pick<KanbanList, "id" | "workspace_id" | "name">[];
    task: Pick<KanbanCard, "id" | "title" | "description" | "priority" | "status" | "due_date" | "estimate_points" | "workspace_id" | "list_id" | "tags" | "assignee_id">;
    subtasks: Pick<KanbanSubtask, "id" | "title" | "description" | "is_completed" | "due_date" | "position">[];
    assigneeOptions: { id: string; label: string }[];
}

export default function TaskDetailsClient({ companySlug, workspaces, lists, task, subtasks: initialSubtasks, assigneeOptions }: TaskDetailsClientProps) {
    const router = useRouter();

    const [editing, setEditing] = useState(false);
    const [workspaceId, setWorkspaceId] = useState(task.workspace_id);
    const [listId, setListId] = useState(task.list_id);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? "");
    const [priority, setPriority] = useState(task.priority);
    const [status, setStatus] = useState(task.status);
    const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
    const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : "");
    const [estimatePoints, setEstimatePoints] = useState(task.estimate_points?.toString() ?? "");
    const [tags, setTags] = useState((task.tags ?? []).join(", "));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [subtasks, setSubtasks] = useState(initialSubtasks);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSubtask, setNewSubtask] = useState("");
    const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
    const [newSubtaskDueDate, setNewSubtaskDueDate] = useState("");
    const [subtaskError, setSubtaskError] = useState<string | null>(null);
    const [subtaskLoading, setSubtaskLoading] = useState(false);

    const workspaceLists = useMemo(
        () => lists.filter((list) => list.workspace_id === workspaceId),
        [lists, workspaceId]
    );

    const displayWorkspaceName = workspaces.find((w) => w.id === task.workspace_id)?.name ?? "—";
    const displayListName = lists.find((l) => l.id === task.list_id)?.name ?? "—";
    const displayAssigneeName = task.assignee_id
        ? assigneeOptions.find((option) => option.id === task.assignee_id)?.label ?? "Unknown member"
        : "Unassigned";

    function getStatusClass(value: string) {
        if (value === "blocked") return styles.statusBlocked;
        if (value === "review") return styles.statusReview;
        if (value === "done") return styles.statusDone;
        if (value === "in_progress") return styles.statusInProgress;
        return styles.statusTodo;
    }

    function getPriorityClass(value: string) {
        if (value === "high") return styles.priorityHigh;
        if (value === "medium") return styles.priorityMedium;
        return styles.priorityLow;
    }

    function formatStatus(value: string) {
        if (value === "in_progress") return "In progress";
        if (value === "blocked") return "Blocked";
        if (value === "review") return "In review";
        if (value === "done") return "Done";
        return "Todo";
    }

    function cancelEdit() {
        setWorkspaceId(task.workspace_id);
        setListId(task.list_id);
        setTitle(task.title);
        setDescription(task.description ?? "");
        setPriority(task.priority);
        setStatus(task.status);
        setAssigneeId(task.assignee_id ?? "");
        setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
        setEstimatePoints(task.estimate_points?.toString() ?? "");
        setTags((task.tags ?? []).join(", "));
        setError(null);
        setEditing(false);
    }

    async function saveTask(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);

        const response = await fetch("/api/companies/tasks/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: task.id,
                company_slug: companySlug,
                workspace_id: workspaceId,
                list_id: listId,
                title,
                description,
                priority,
                status,
                assignee_id: assigneeId || null,
                due_date: dueDate || null,
                estimate_points: estimatePoints ? Number(estimatePoints) : null,
                tags: tags.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).slice(0, 12),
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.error ?? "Failed to update task");
            setSaving(false);
            return;
        }

        setSaving(false);
        setEditing(false);
        router.refresh();
    }

    async function deleteTask() {
        if (!confirm("Delete this task and all subtasks? This cannot be undone.")) return;

        setDeleting(true);

        const response = await fetch("/api/companies/tasks/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: task.id, company_slug: companySlug }),
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.error ?? "Failed to delete task");
            setDeleting(false);
            return;
        }

        router.push(`/companies/s/${companySlug}/tasks`);
        router.refresh();
    }

    async function addSubtask(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!newSubtask.trim()) return;

        setSubtaskLoading(true);
        setSubtaskError(null);

        const response = await fetch("/api/companies/tasks/subtasks/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                company_slug: companySlug,
                card_id: task.id,
                title: newSubtask,
                description: newSubtaskDescription || null,
                due_date: newSubtaskDueDate || null,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            setSubtaskError(result.error ?? "Failed to add subtask");
            setSubtaskLoading(false);
            return;
        }

        setSubtasks((prev) => [...prev, result.subtask]);
        setNewSubtask("");
        setNewSubtaskDescription("");
        setNewSubtaskDueDate("");
        setShowAddForm(false);
        setSubtaskLoading(false);
    }

    async function toggleSubtask(id: string, nextValue: boolean) {
        const previous = subtasks;
        setSubtasks((prev) => prev.map((subtask) => subtask.id === id ? { ...subtask, is_completed: nextValue } : subtask));

        const response = await fetch("/api/companies/tasks/subtasks/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, company_slug: companySlug, is_completed: nextValue }),
        });

        if (!response.ok) {
            setSubtasks(previous);
            const result = await response.json();
            setSubtaskError(result.error ?? "Failed to update subtask");
        }
    }

    async function removeSubtask(id: string) {
        const previous = subtasks;
        setSubtasks((prev) => prev.filter((subtask) => subtask.id !== id));

        const response = await fetch("/api/companies/tasks/subtasks/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, company_slug: companySlug }),
        });

        if (!response.ok) {
            setSubtasks(previous);
            const result = await response.json();
            setSubtaskError(result.error ?? "Failed to delete subtask");
        }
    }

    const completedCount = subtasks.filter((subtask) => subtask.is_completed).length;

    return (
        <div className={styles.split}>
            {/* LEFT: static detail view or edit form */}
            {editing ? (
                <form className={styles.form} onSubmit={saveTask}>
                    <div className={styles.panelHeader}>
                        <h2>Edit task</h2>
                        <span className={`${styles.badge} ${getStatusClass(status)}`}>{formatStatus(status)}</span>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="title">Title</label>
                        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="description">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label htmlFor="workspace">Workspace</label>
                            <select
                                id="workspace"
                                value={workspaceId}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setWorkspaceId(next);
                                    const nextLists = lists.filter((l) => l.workspace_id === next);
                                    if (!nextLists.find((l) => l.id === listId)) {
                                        setListId(nextLists[0]?.id ?? "");
                                    }
                                }}
                            >
                                {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="list">List</label>
                            <select id="list" value={listId} onChange={(e) => setListId(e.target.value)}>
                                {workspaceLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRowThirds}>
                        <div className={styles.field}>
                            <label htmlFor="priority">Priority</label>
                            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="status">Status</label>
                            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                                <option value="todo">Todo</option>
                                <option value="in_progress">In progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="review">In review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="due_date">Due date</label>
                            <input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="assignee">Assignee</label>
                        <select id="assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                            <option value="">Unassigned</option>
                            {assigneeOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label htmlFor="estimate_points">Estimate points</label>
                            <input id="estimate_points" type="number" min={0} max={500} value={estimatePoints} onChange={(e) => setEstimatePoints(e.target.value)} />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="tags">Tags</label>
                            <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="design, sprint-3" />
                        </div>
                    </div>

                    {error && <p className={styles.errorText}>{error}</p>}

                    <div className={styles.actionsRow}>
                        <button className={styles.primaryBtn} type="submit" disabled={saving || !title.trim()}>
                            {saving ? "Saving..." : "Save task"}
                        </button>
                        <button className={styles.secondaryBtn} type="button" onClick={cancelEdit} disabled={saving}>
                            Cancel
                        </button>
                        <button className={styles.dangerBtn} type="button" onClick={deleteTask} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className={styles.detailView}>
                    <div className={styles.detailViewHeader}>
                        <div className={styles.detailBadges}>
                            <span className={`${styles.badge} ${getStatusClass(task.status)}`}>{formatStatus(task.status)}</span>
                            <span className={`${styles.badge} ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                        </div>
                        <div className={styles.actionsRow}>
                            <button className={styles.secondaryBtn} type="button" onClick={() => setEditing(true)}>
                                Edit task
                            </button>
                            <button className={styles.dangerBtn} type="button" onClick={deleteTask} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>

                    <h2 className={styles.detailTitle}>{task.title}</h2>

                    {task.description ? (
                        <p className={styles.detailDescription}>{task.description}</p>
                    ) : (
                        <p className={styles.detailDescriptionEmpty}>No description.</p>
                    )}

                    <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Workspace</span>
                            <span className={styles.detailValue}>{displayWorkspaceName}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>List</span>
                            <span className={styles.detailValue}>{displayListName}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Due date</span>
                            <span className={styles.detailValue}>
                                {task.due_date
                                    ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                    : "No due date"}
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Assignee</span>
                            <span className={styles.detailValue}>{displayAssigneeName}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Estimate</span>
                            <span className={styles.detailValue}>
                                {typeof task.estimate_points === "number" ? `${task.estimate_points} pts` : "—"}
                            </span>
                        </div>
                    </div>

                    {(task.tags ?? []).length > 0 && (
                        <div className={styles.detailTagsRow}>
                            <span className={styles.detailLabel}>Tags</span>
                            <div className={styles.tagsList}>
                                {(task.tags ?? []).map((tag) => (
                                    <span key={tag} className={styles.tagChip}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <p className={styles.errorText}>{error}</p>}
                </div>
            )}

            {/* RIGHT: subtasks */}
            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h2>Subtasks</h2>
                    <span>{completedCount}/{subtasks.length} completed</span>
                </div>

                {subtasks.length === 0 && !showAddForm ? (
                    <p className={styles.empty}>No subtasks yet.</p>
                ) : (
                    <ul className={styles.subtaskList}>
                        {[...subtasks]
                            .sort((a, b) => a.position - b.position)
                            .map((subtask) => (
                                <li key={subtask.id} className={styles.subtaskItem}>
                                    <label className={styles.subtaskLeft}>
                                        <input
                                            type="checkbox"
                                            checked={subtask.is_completed}
                                            onChange={(e) => toggleSubtask(subtask.id, e.target.checked)}
                                        />
                                        <div>
                                            <p className={`${styles.subtaskTitle}${subtask.is_completed ? ` ${styles.subtaskDone}` : ""}`}>
                                                {subtask.title}
                                            </p>
                                            {subtask.description && (
                                                <p className={styles.subtaskDescription}>{subtask.description}</p>
                                            )}
                                            {subtask.due_date && (
                                                <span className={styles.subtaskMeta}>
                                                    Due {new Date(subtask.due_date).toLocaleDateString("en-US")}
                                                </span>
                                            )}
                                        </div>
                                    </label>

                                    <button className={styles.inlineBtn} type="button" onClick={() => removeSubtask(subtask.id)}>
                                        Remove
                                    </button>
                                </li>
                            ))}
                    </ul>
                )}

                {subtaskError && <p className={styles.errorText}>{subtaskError}</p>}

                <div className={styles.subtaskFormArea}>
                    {!showAddForm ? (
                        <button className={styles.secondaryBtn} type="button" onClick={() => setShowAddForm(true)}>
                            + Add subtask
                        </button>
                    ) : (
                        <form className={styles.subtaskForm} onSubmit={addSubtask}>
                            <div className={styles.field}>
                                <label htmlFor="new_subtask">Title</label>
                                <input
                                    id="new_subtask"
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    placeholder="Write migration test case"
                                    maxLength={200}
                                    autoFocus
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="new_subtask_desc">Description (optional)</label>
                                <textarea
                                    id="new_subtask_desc"
                                    value={newSubtaskDescription}
                                    onChange={(e) => setNewSubtaskDescription(e.target.value)}
                                    placeholder="Additional details..."
                                    maxLength={2000}
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="new_subtask_due">Due date (optional)</label>
                                <input
                                    id="new_subtask_due"
                                    type="date"
                                    value={newSubtaskDueDate}
                                    onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                                />
                            </div>

                            <div className={styles.actionsRow}>
                                <button className={styles.primaryBtn} type="submit" disabled={subtaskLoading || !newSubtask.trim()}>
                                    {subtaskLoading ? "Adding..." : "Add subtask"}
                                </button>
                                <button
                                    className={styles.secondaryBtn}
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewSubtask("");
                                        setNewSubtaskDescription("");
                                        setNewSubtaskDueDate("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
}
