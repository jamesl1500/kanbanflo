'use client';

import { useState, useRef, useEffect } from 'react';
import { useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus,
    DotsSixVertical,
    X,
    CalendarBlank,
    Trash,
    PencilSimple,
} from '@phosphor-icons/react';
import styles from '@/styles/pages/companies/workspace-kanban.module.scss';
import { createClient } from '@/utils/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'high' | 'medium' | 'low';

interface KanbanList {
    id: string;
    name: string;
    position: number;
    color: string | null;
}

interface KanbanCard {
    id: string;
    list_id: string;
    title: string;
    description: string | null;
    position: number;
    priority: Priority;
    due_date: string | null;
}

interface Subtask {
    id: string;
    title: string;
    is_completed: boolean;
    position: number;
    due_date: string | null;
}

interface Props {
    workspaceId: string;
    companySlug: string;
    initialLists: KanbanList[];
    initialCards: KanbanCard[];
    canEditCards: boolean;
    canManageLists: boolean;
}

function sortListsByPosition(items: KanbanList[]) {
    return [...items].sort((left, right) => left.position - right.position);
}

function upsertList(items: KanbanList[], nextItem: KanbanList) {
    const existingIndex = items.findIndex((item) => item.id === nextItem.id);

    if (existingIndex === -1) {
        return sortListsByPosition([...items, nextItem]);
    }

    const nextItems = [...items];
    nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        ...nextItem,
    };

    return sortListsByPosition(nextItems);
}

function removeListById(items: KanbanList[], id: string) {
    return items.filter((item) => item.id !== id);
}

function upsertCard(items: KanbanCard[], nextItem: KanbanCard) {
    const existingIndex = items.findIndex((item) => item.id === nextItem.id);

    if (existingIndex === -1) {
        return [...items, nextItem];
    }

    const nextItems = [...items];
    nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        ...nextItem,
    };

    return nextItems;
}

function removeCardById(items: KanbanCard[], id: string) {
    return items.filter((item) => item.id !== id);
}

function upsertSubtask(items: Subtask[], nextItem: Subtask) {
    const existingIndex = items.findIndex((item) => item.id === nextItem.id);

    if (existingIndex === -1) {
        return [...items, nextItem].sort((left, right) => left.position - right.position);
    }

    const nextItems = [...items];
    nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        ...nextItem,
    };

    return nextItems.sort((left, right) => left.position - right.position);
}

function removeSubtaskById(items: Subtask[], id: string) {
    return items.filter((item) => item.id !== id);
}

// ─── Card Component ───────────────────────────────────────────────────────────

function SortableCard({
    card,
    canEdit,
    onDelete,
    onOpen,
    isDragOverlay,
}: {
    card: KanbanCard;
    canEdit: boolean;
    onDelete: (id: string) => void;
    onOpen: (card: KanbanCard) => void;
    isDragOverlay?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
        data: { type: 'card', card },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const priorityClass = {
        high: styles.priorityHigh,
        medium: styles.priorityMedium,
        low: styles.priorityLow,
    }[card.priority];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.card}${isDragOverlay ? ' ' + styles.cardOverlay : ''}`}
        >
            <div className={styles.cardDragHandle} {...attributes} {...listeners}>
                <DotsSixVertical size={14} />
            </div>
            <div
                className={styles.cardContent}
                onClick={() => !isDragOverlay && onOpen(card)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !isDragOverlay && onOpen(card)}
            >
                <p className={styles.cardTitle}>{card.title}</p>
                {card.description && <p className={styles.cardDesc}>{card.description}</p>}
                <div className={styles.cardMeta}>
                    <span className={`${styles.priorityBadge} ${priorityClass}`}>{card.priority}</span>
                    {card.due_date && (
                        <span className={styles.dueDate}>
                            <CalendarBlank size={11} />
                            {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>
            {canEdit && (
                <div className={styles.cardActions}>
                    <button
                        className={styles.cardActionBtn}
                        onClick={(e) => { e.stopPropagation(); onOpen(card); }}
                        title="View details"
                    >
                        <PencilSimple size={13} />
                    </button>
                    <button
                        className={`${styles.cardActionBtn} ${styles.cardActionBtnDelete}`}
                        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                        title="Delete card"
                    >
                        <Trash size={13} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── List Column Component ────────────────────────────────────────────────────

function SortableList({
    list,
    cards,
    canEditCards,
    canManageLists,
    onAddCard,
    onDeleteCard,
    onOpenCard,
    onDeleteList,
    onRenameList,
    isDragOverlay,
}: {
    list: KanbanList;
    cards: KanbanCard[];
    canEditCards: boolean;
    canManageLists: boolean;
    onAddCard: (listId: string, title: string) => Promise<void>;
    onDeleteCard: (id: string) => void;
    onOpenCard: (card: KanbanCard) => void;
    onDeleteList: (id: string) => void;
    onRenameList: (id: string, name: string) => void;
    isDragOverlay?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: list.id,
        data: { type: 'list', list },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [addingCard, setAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [addingLoading, setAddingLoading] = useState(false);
    const [renamingList, setRenamingList] = useState(false);
    const [renameValue, setRenameValue] = useState(list.name);
    const addInputRef = useRef<HTMLTextAreaElement>(null);

    const cardIds = cards.map((c) => c.id);

    async function handleAddCard() {
        const title = newCardTitle.trim();
        if (!title) return;
        setAddingLoading(true);
        await onAddCard(list.id, title);
        setNewCardTitle('');
        setAddingCard(false);
        setAddingLoading(false);
    }

    function handleRenameSubmit() {
        const name = renameValue.trim();
        if (name && name !== list.name) {
            onRenameList(list.id, name);
        }
        setRenamingList(false);
    }

    const dotColor = list.color ?? '#6366f1';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.list}${isDragOverlay ? ' ' + styles.listOverlay : ''}`}
        >
            {/* List Header */}
            <div className={styles.listHeader}>
                <div className={styles.listHeaderLeft} {...(canManageLists ? { ...attributes, ...listeners } : {})}>
                    <span className={styles.listDot} style={{ background: dotColor }} />
                    {renamingList ? (
                        <input
                            className={styles.renameInput}
                            value={renameValue}
                            autoFocus
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') setRenamingList(false);
                            }}
                        />
                    ) : (
                        <span className={styles.listName}>{list.name}</span>
                    )}
                    <span className={styles.listCount}>{cards.length}</span>
                </div>
                {canManageLists && (
                    <div className={styles.listActions}>
                        <button
                            className={styles.listActionBtn}
                            onClick={() => { setRenamingList(true); setRenameValue(list.name); }}
                            title="Rename list"
                        >
                            <PencilSimple size={13} />
                        </button>
                        <button
                            className={`${styles.listActionBtn} ${styles.listActionBtnDelete}`}
                            onClick={() => onDeleteList(list.id)}
                            title="Delete list"
                        >
                            <Trash size={13} />
                        </button>
                    </div>
                )}
            </div>

            {/* Cards */}
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                <div className={styles.cardList}>
                    {cards.length === 0 && (<div className={styles.emptyCardList}>No cards</div>)}
                    {cards.map((card) => (
                        <SortableCard
                            key={card.id}
                            card={card}
                            canEdit={canEditCards}
                            onDelete={onDeleteCard}
                            onOpen={onOpenCard}
                        />
                    ))}
                </div>
            </SortableContext>

            {/* Add Card */}
            {canEditCards && (
                <div className={styles.addCardSection}>
                    {addingCard ? (
                        <div className={styles.addCardForm}>
                            <textarea
                                ref={addInputRef}
                                autoFocus
                                rows={2}
                                placeholder="Card title…"
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                className={styles.addCardInput}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddCard();
                                    }
                                    if (e.key === 'Escape') {
                                        setAddingCard(false);
                                        setNewCardTitle('');
                                    }
                                }}
                            />
                            <div className={styles.addCardFormActions}>
                                <button
                                    className={styles.addCardConfirm}
                                    onClick={handleAddCard}
                                    disabled={addingLoading || !newCardTitle.trim()}
                                >
                                    {addingLoading ? '…' : 'Add card'}
                                </button>
                                <button
                                    className={styles.addCardCancel}
                                    onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className={styles.addCardBtn} onClick={() => setAddingCard(true)}>
                            <Plus size={13} weight="bold" />
                            Add card
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Card Detail Sidebar ──────────────────────────────────────────────────────

function CardDetailSidebar({
    card,
    lists,
    companySlug,
    canEdit,
    onClose,
    onSave,
    onDelete,
}: {
    card: KanbanCard | null;
    lists: KanbanList[];
    companySlug: string;
    canEdit: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<KanbanCard>) => Promise<void>;
    onDelete: (id: string) => void;
}) {
    const isOpen = card !== null;
    const supabase = useMemo(() => createClient(), []);

    const [title, setTitle] = useState(card?.title ?? '');
    const [description, setDescription] = useState(card?.description ?? '');
    const [priority, setPriority] = useState<Priority>(card?.priority ?? 'medium');
    const [dueDate, setDueDate] = useState(card?.due_date?.slice(0, 10) ?? '');
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [subtasksLoading, setSubtasksLoading] = useState(card !== null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [addingSubtask, setAddingSubtask] = useState(false);

    const cardId = card?.id;

    useEffect(() => {
        if (!cardId) return;

        fetch('/api/workspaces/cards/subtasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ card_id: cardId }),
        })
            .then((res) => (res.ok ? res.json() : { subtasks: [] }))
            .then(({ subtasks: data }) => setSubtasks(data ?? []))
            .finally(() => setSubtasksLoading(false));
    }, [cardId]);

    useEffect(() => {
        if (!cardId) return;

        const subtasksChannel = supabase
            .channel(`card-subtasks:${cardId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'kanban_subtasks',
                    filter: `card_id=eq.${cardId}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        const previousSubtask = payload.old as Pick<Subtask, 'id'>;
                        setSubtasks((prev) => removeSubtaskById(prev, previousSubtask.id));
                        return;
                    }

                    const nextSubtask = payload.new as Subtask;
                    setSubtasks((prev) => upsertSubtask(prev, nextSubtask));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subtasksChannel);
        };
    }, [cardId, supabase]);

    async function handleSave() {
        if (!card || !dirty) return;
        setSaving(true);
        await onSave(card.id, {
            title,
            description: description || null,
            priority,
            due_date: dueDate || null,
        });
        setSaving(false);
        setDirty(false);
    }

    async function handleAddSubtask(e: React.FormEvent) {
        e.preventDefault();
        if (!card || !newSubtaskTitle.trim()) return;
        setAddingSubtask(true);
        const res = await fetch('/api/companies/tasks/subtasks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_slug: companySlug,
                card_id: card.id,
                title: newSubtaskTitle.trim(),
            }),
        });
        if (res.ok) {
            const { subtask } = await res.json();
            setSubtasks((prev) => upsertSubtask(prev, subtask));
            setNewSubtaskTitle('');
        }
        setAddingSubtask(false);
    }

    async function handleToggleSubtask(id: string, isCompleted: boolean) {
        const previous = subtasks;
        setSubtasks((prev) =>
            prev.map((s) => (s.id === id ? { ...s, is_completed: isCompleted } : s))
        );
        const res = await fetch('/api/companies/tasks/subtasks/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, company_slug: companySlug, is_completed: isCompleted }),
        });
        if (!res.ok) setSubtasks(previous);
    }

    async function handleRemoveSubtask(id: string) {
        const previous = subtasks;
        setSubtasks((prev) => prev.filter((s) => s.id !== id));
        const res = await fetch('/api/companies/tasks/subtasks/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, company_slug: companySlug }),
        });
        if (!res.ok) setSubtasks(previous);
    }

    const listName = card ? (lists.find((l) => l.id === card.list_id)?.name ?? '—') : '—';
    const completedCount = subtasks.filter((s) => s.is_completed).length;
    const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

    return (
        <div className={`${styles.sidebar}${isOpen ? ' ' + styles.sidebarOpen : ''}`}>
            {/* Header */}
            <div className={styles.sidebarHeader}>
                {canEdit ? (
                    <input
                        className={styles.sidebarTitleInput}
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                        placeholder="Card title"
                    />
                ) : (
                    <h2 className={styles.sidebarTitle}>{card?.title}</h2>
                )}
                <button className={styles.sidebarClose} onClick={onClose} title="Close (Esc)">
                    <X size={16} />
                </button>
            </div>

            {/* Body */}
            <div className={styles.sidebarBody}>
                {/* Meta row */}
                <div className={styles.sidebarSection}>
                    <div className={styles.sidebarMeta}>
                        <div className={styles.sidebarMetaItem}>
                            <span className={styles.sidebarMetaLabel}>List</span>
                            <span className={styles.sidebarMetaValue}>{listName}</span>
                        </div>
                        <div className={styles.sidebarMetaItem}>
                            <span className={styles.sidebarMetaLabel}>Priority</span>
                            {canEdit ? (
                                <select
                                    className={styles.sidebarMetaSelect}
                                    value={priority}
                                    onChange={(e) => { setPriority(e.target.value as Priority); setDirty(true); }}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            ) : (
                                <span className={styles.sidebarMetaValue}>{card?.priority}</span>
                            )}
                        </div>
                        <div className={styles.sidebarMetaItem}>
                            <span className={styles.sidebarMetaLabel}>Due date</span>
                            {canEdit ? (
                                <input
                                    type="date"
                                    className={styles.sidebarMetaInput}
                                    value={dueDate}
                                    onChange={(e) => { setDueDate(e.target.value); setDirty(true); }}
                                />
                            ) : (
                                <span className={styles.sidebarMetaValue}>
                                    {card?.due_date
                                        ? new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'No due date'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className={styles.sidebarSection}>
                    <p className={styles.sidebarSectionTitle}>Description</p>
                    {canEdit ? (
                        <textarea
                            className={styles.sidebarDescTextarea}
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
                            placeholder="Add a description…"
                            rows={4}
                        />
                    ) : description ? (
                        <p className={styles.sidebarDesc}>{description}</p>
                    ) : (
                        <p className={styles.sidebarDescEmpty}>No description.</p>
                    )}
                </div>

                {/* Subtasks */}
                <div className={styles.sidebarSection}>
                    <div className={styles.sidebarSubtaskHeader}>
                        <p className={styles.sidebarSectionTitle}>Subtasks</p>
                        {subtasks.length > 0 && (
                            <span className={styles.sidebarSubtaskProgress}>
                                {completedCount}/{subtasks.length}
                            </span>
                        )}
                    </div>

                    {subtasks.length > 0 && (
                        <div className={styles.sidebarProgressBar}>
                            <div style={{ width: `${progress}%` }} />
                        </div>
                    )}

                    {subtasksLoading ? (
                        <p className={styles.sidebarEmpty}>Loading…</p>
                    ) : (
                        <>
                            {subtasks.length > 0 && (
                                <ul className={styles.sidebarSubtaskList}>
                                    {[...subtasks]
                                        .sort((a, b) => a.position - b.position)
                                        .map((subtask) => (
                                            <li key={subtask.id} className={styles.sidebarSubtaskItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={subtask.is_completed}
                                                    onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
                                                    disabled={!canEdit}
                                                />
                                                <p className={`${styles.sidebarSubtaskTitle}${subtask.is_completed ? ' ' + styles.sidebarSubtaskDone : ''}`}>
                                                    {subtask.title}
                                                </p>
                                                {canEdit && (
                                                    <button
                                                        className={styles.sidebarSubtaskRemove}
                                                        onClick={() => handleRemoveSubtask(subtask.id)}
                                                        title="Remove"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                </ul>
                            )}

                            {subtasks.length === 0 && (
                                <p className={styles.sidebarEmpty}>No subtasks yet.</p>
                            )}

                            {canEdit && (
                                <form className={styles.sidebarAddSubtask} onSubmit={handleAddSubtask}>
                                    <input
                                        className={styles.sidebarAddSubtaskInput}
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        placeholder="New subtask…"
                                        maxLength={200}
                                    />
                                    <button
                                        className={styles.sidebarAddSubtaskBtn}
                                        type="submit"
                                        disabled={addingSubtask || !newSubtaskTitle.trim()}
                                    >
                                        {addingSubtask ? '…' : 'Add'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            {canEdit && (
                <div className={styles.sidebarFooter}>
                    <button
                        className={styles.sidebarDeleteBtn}
                        onClick={() => card && onDelete(card.id)}
                    >
                        Delete card
                    </button>
                    <button
                        className={styles.sidebarSaveBtn}
                        onClick={handleSave}
                        disabled={saving || !dirty || !title.trim()}
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export default function WorkspaceKanban({ workspaceId, companySlug, initialLists, initialCards, canEditCards, canManageLists }: Props) {
    const supabase = useMemo(() => createClient(), []);
    const [lists, setLists] = useState<KanbanList[]>(initialLists);
    const [cards, setCards] = useState<KanbanCard[]>(initialCards);
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
    const [activeList, setActiveList] = useState<KanbanList | null>(null);
    const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
    const dragSourceListIdRef = useRef<string | null>(null);

    // Add list input
    const [addingList, setAddingList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [addingListLoading, setAddingListLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Close sidebar on Escape
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setSelectedCard(null);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const workspaceChannel = supabase
            .channel(`workspace-kanban:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'kanban_lists',
                    filter: `workspace_id=eq.${workspaceId}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        const previousList = payload.old as Pick<KanbanList, 'id'>;
                        setLists((prev) => removeListById(prev, previousList.id));
                        setCards((prev) => prev.filter((card) => card.list_id !== previousList.id));
                        return;
                    }

                    const nextList = payload.new as KanbanList;
                    setLists((prev) => upsertList(prev, nextList));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'kanban_cards',
                    filter: `workspace_id=eq.${workspaceId}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        const previousCard = payload.old as Pick<KanbanCard, 'id'>;
                        setCards((prev) => removeCardById(prev, previousCard.id));
                        setSelectedCard((prev) => (prev?.id === previousCard.id ? null : prev));
                        return;
                    }

                    const nextCard = payload.new as KanbanCard;
                    setCards((prev) => upsertCard(prev, nextCard));
                    setSelectedCard((prev) => (prev?.id === nextCard.id ? { ...prev, ...nextCard } : prev));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(workspaceChannel);
        };
    }, [supabase, workspaceId]);

    // ── Helpers ──

    function cardsForList(listId: string) {
        return cards
            .filter((c) => c.list_id === listId)
            .sort((a, b) => a.position - b.position);
    }

    // ── List CRUD ──

    async function handleAddList() {
        const name = newListName.trim();
        if (!name) return;
        setAddingListLoading(true);

        const res = await fetch('/api/workspaces/lists/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: workspaceId, name }),
        });

        if (res.ok) {
            const { list } = await res.json();
            setLists((prev) => upsertList(prev, list));
        }

        setNewListName('');
        setAddingList(false);
        setAddingListLoading(false);
    }

    function handleRenameList(id: string, name: string) {
        setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
        fetch('/api/workspaces/lists/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name }),
        });
    }

    function handleDeleteList(id: string) {
        if (!confirm('Delete this list and all its cards?')) return;
        setLists((prev) => prev.filter((l) => l.id !== id));
        setCards((prev) => prev.filter((c) => c.list_id !== id));
        fetch('/api/workspaces/lists/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
    }

    // ── Card CRUD ──

    async function handleAddCard(listId: string, title: string) {
        const res = await fetch('/api/workspaces/cards/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: listId, workspace_id: workspaceId, title }),
        });
        if (res.ok) {
            const { card } = await res.json();
            setCards((prev) => [...prev, card]);
        }
    }

    function handleDeleteCard(id: string) {
        if (selectedCard?.id === id) setSelectedCard(null);
        setCards((prev) => prev.filter((c) => c.id !== id));
        fetch('/api/workspaces/cards/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
    }

    async function handleSaveCard(id: string, updates: Partial<KanbanCard>) {
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        setSelectedCard((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
        await fetch('/api/workspaces/cards/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
    }

    // ── Drag & Drop ──

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        if (active.data.current?.type === 'card') {
            setActiveCard(active.data.current.card);
            dragSourceListIdRef.current = (active.data.current.card as KanbanCard).list_id;
        } else if (active.data.current?.type === 'list') {
            setActiveList(active.data.current.list);
            dragSourceListIdRef.current = null;
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveCard = active.data.current?.type === 'card';
        const isOverCard = over.data.current?.type === 'card';
        const isOverList = over.data.current?.type === 'list';

        if (!isActiveCard) return;

        if (isActiveCard && isOverCard) {
            const activeCardObj = cards.find((c) => c.id === activeId)!;
            const overCard = cards.find((c) => c.id === overId)!;
            if (activeCardObj.list_id !== overCard.list_id) {
                setCards((prev) =>
                    prev.map((c) => (c.id === activeId ? { ...c, list_id: overCard.list_id } : c))
                );
            }
        }

        if (isActiveCard && isOverList) {
            setCards((prev) =>
                prev.map((c) => (c.id === activeId ? { ...c, list_id: overId } : c))
            );
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveCard(null);
        setActiveList(null);

        if (!over) {
            dragSourceListIdRef.current = null;
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // For list reordering, dropping over the same item is a no-op.
        if (active.data.current?.type === 'list' && activeId === overId) {
            dragSourceListIdRef.current = null;
            return;
        }

        if (active.data.current?.type === 'list') {
            const oldIdx = lists.findIndex((l) => l.id === activeId);
            const newIdx = lists.findIndex((l) => l.id === overId);
            if (oldIdx === newIdx) return;

            const reordered = arrayMove(lists, oldIdx, newIdx).map((l, i) => ({ ...l, position: i }));
            setLists(reordered);

            fetch('/api/workspaces/lists/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace_id: workspaceId,
                    ordered_ids: reordered.map((l) => l.id),
                }),
            });
            return;
        }

        if (active.data.current?.type === 'card') {
            const activeCardObj = cards.find((c) => c.id === activeId);
            if (!activeCardObj) {
                dragSourceListIdRef.current = null;
                return;
            }

            const sourceListId = dragSourceListIdRef.current ?? (active.data.current?.card as KanbanCard).list_id;
            const overType = over.data.current?.type;
            const overCardObj = overType === 'card' ? cards.find((c) => c.id === overId) : undefined;

            let destinationListId = activeCardObj.list_id;
            if (overType === 'card' && overCardObj) {
                destinationListId = overCardObj.list_id;
            } else if (overType === 'list') {
                destinationListId = overId;
            }

            // Build destination order from cards excluding the moved card, then insert at the drop index.
            const destinationBefore = cards
                .filter((c) => c.list_id === destinationListId && c.id !== activeId)
                .sort((a, b) => a.position - b.position);

            const insertIndex = overType === 'card' && overId !== activeId
                ? destinationBefore.findIndex((c) => c.id === overId)
                : destinationBefore.length;

            const safeInsertIndex = insertIndex < 0 ? destinationBefore.length : insertIndex;

            const destinationAfter = [
                ...destinationBefore.slice(0, safeInsertIndex),
                { ...activeCardObj, list_id: destinationListId },
                ...destinationBefore.slice(safeInsertIndex),
            ].map((card, index) => ({
                ...card,
                list_id: destinationListId,
                position: index,
            }));

            const sourceAfter = cards
                .filter((c) => c.list_id === sourceListId && c.id !== activeId)
                .sort((a, b) => a.position - b.position)
                .map((card, index) => ({
                    ...card,
                    position: index,
                }));

            setCards((prev) => {
                const untouched = prev.filter(
                    (c) => c.list_id !== sourceListId && c.list_id !== destinationListId
                );

                if (sourceListId === destinationListId) {
                    return [...untouched, ...destinationAfter];
                }

                return [...untouched, ...sourceAfter, ...destinationAfter];
            });

            fetch('/api/workspaces/cards/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    list_id: destinationListId,
                    ordered_ids: destinationAfter.map((c) => c.id),
                }),
            });

            if (sourceListId !== destinationListId) {
                fetch('/api/workspaces/cards/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        list_id: sourceListId,
                        ordered_ids: sourceAfter.map((c) => c.id),
                    }),
                });
            }

            dragSourceListIdRef.current = null;
        }
    }

    const listIds = lists.map((l) => l.id);

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.board}>
                    <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
                        {lists.map((list) => (
                            <SortableList
                                key={list.id}
                                list={list}
                                cards={cardsForList(list.id)}
                                canEditCards={canEditCards}
                                canManageLists={canManageLists}
                                onAddCard={handleAddCard}
                                onDeleteCard={handleDeleteCard}
                                onOpenCard={setSelectedCard}
                                onDeleteList={handleDeleteList}
                                onRenameList={handleRenameList}
                            />
                        ))}
                    </SortableContext>

                    {/* Add List */}
                    {canManageLists && (
                        <div className={styles.addListColumn}>
                            {addingList ? (
                                <div className={styles.addListForm}>
                                    <input
                                        autoFocus
                                        placeholder="List name…"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        className={styles.addListInput}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddList();
                                            if (e.key === 'Escape') {
                                                setAddingList(false);
                                                setNewListName('');
                                            }
                                        }}
                                    />
                                    <div className={styles.addListFormActions}>
                                        <button
                                            className={styles.addListConfirm}
                                            onClick={handleAddList}
                                            disabled={addingListLoading || !newListName.trim()}
                                        >
                                            {addingListLoading ? '…' : 'Add list'}
                                        </button>
                                        <button
                                            className={styles.addListCancel}
                                            onClick={() => { setAddingList(false); setNewListName(''); }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button className={styles.addListBtn} onClick={() => setAddingList(true)}>
                                    <Plus size={14} weight="bold" />
                                    Add list
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeCard && (
                        <SortableCard
                            card={activeCard}
                            canEdit={false}
                            onDelete={() => {}}
                            onOpen={() => {}}
                            isDragOverlay
                        />
                    )}
                    {activeList && (
                        <SortableList
                            list={activeList}
                            cards={cardsForList(activeList.id)}
                            canEditCards={false}
                            canManageLists={false}
                            onAddCard={async () => {}}
                            onDeleteCard={() => {}}
                            onOpenCard={() => {}}
                            onDeleteList={() => {}}
                            onRenameList={() => {}}
                            isDragOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>

            <CardDetailSidebar
                key={selectedCard?.id ?? 'closed'}
                card={selectedCard}
                lists={lists}
                companySlug={companySlug}
                canEdit={canEditCards}
                onClose={() => setSelectedCard(null)}
                onSave={handleSaveCard}
                onDelete={handleDeleteCard}
            />
        </>
    );
}

