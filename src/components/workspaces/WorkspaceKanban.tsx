'use client';

import { useState, useRef } from 'react';
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
    DotsThree,
    CalendarBlank,
    Trash,
    PencilSimple,
} from '@phosphor-icons/react';
import styles from '@/styles/pages/companies/workspace-kanban.module.scss';

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

interface Props {
    workspaceId: string;
    initialLists: KanbanList[];
    initialCards: KanbanCard[];
    canEdit: boolean;
}

// ─── Card Component ───────────────────────────────────────────────────────────

function SortableCard({
    card,
    canEdit,
    onDelete,
    onEdit,
    isDragOverlay,
}: {
    card: KanbanCard;
    canEdit: boolean;
    onDelete: (id: string) => void;
    onEdit: (card: KanbanCard) => void;
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
            <div className={styles.cardContent}>
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
                        onClick={() => onEdit(card)}
                        title="Edit card"
                    >
                        <PencilSimple size={13} />
                    </button>
                    <button
                        className={`${styles.cardActionBtn} ${styles.cardActionBtnDelete}`}
                        onClick={() => onDelete(card.id)}
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
    canEdit,
    onAddCard,
    onDeleteCard,
    onEditCard,
    onDeleteList,
    onRenameList,
    isDragOverlay,
}: {
    list: KanbanList;
    cards: KanbanCard[];
    canEdit: boolean;
    onAddCard: (listId: string, title: string) => Promise<void>;
    onDeleteCard: (id: string) => void;
    onEditCard: (card: KanbanCard) => void;
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
                <div className={styles.listHeaderLeft} {...(canEdit ? { ...attributes, ...listeners } : {})}>
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
                {canEdit && (
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
                    {cards.map((card) => (
                        <SortableCard
                            key={card.id}
                            card={card}
                            canEdit={canEdit}
                            onDelete={onDeleteCard}
                            onEdit={onEditCard}
                        />
                    ))}
                </div>
            </SortableContext>

            {/* Add Card */}
            {canEdit && (
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

// ─── Edit Card Modal ──────────────────────────────────────────────────────────

function EditCardModal({
    card,
    onClose,
    onSave,
}: {
    card: KanbanCard;
    onClose: () => void;
    onSave: (updates: Partial<KanbanCard>) => Promise<void>;
}) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description ?? '');
    const [priority, setPriority] = useState<Priority>(card.priority);
    const [dueDate, setDueDate] = useState(card.due_date ?? '');
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        await onSave({ title, description: description || null, priority, due_date: dueDate || null });
        setSaving(false);
        onClose();
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Edit card</h3>
                    <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Title</label>
                        <input
                            className={styles.modalInput}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Description</label>
                        <textarea
                            rows={3}
                            className={styles.modalTextarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className={styles.modalRow}>
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>Priority</label>
                            <select
                                className={styles.modalSelect}
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>Due date</label>
                            <input
                                type="date"
                                className={styles.modalInput}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
                    <button
                        className={styles.modalSaveBtn}
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export default function WorkspaceKanban({ workspaceId, initialLists, initialCards, canEdit }: Props) {
    const [lists, setLists] = useState<KanbanList[]>(initialLists);
    const [cards, setCards] = useState<KanbanCard[]>(initialCards);
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
    const [activeList, setActiveList] = useState<KanbanList | null>(null);
    const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);

    // Add list input
    const [addingList, setAddingList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [addingListLoading, setAddingListLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

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
            setLists((prev) => [...prev, list]);
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
        setCards((prev) => prev.filter((c) => c.id !== id));
        fetch('/api/workspaces/cards/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
    }

    async function handleSaveCard(updates: Partial<KanbanCard>) {
        if (!editingCard) return;
        setCards((prev) =>
            prev.map((c) => (c.id === editingCard.id ? { ...c, ...updates } : c))
        );
        await fetch('/api/workspaces/cards/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingCard.id, ...updates }),
        });
    }

    // ── Drag & Drop ──

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        if (active.data.current?.type === 'card') {
            setActiveCard(active.data.current.card);
        } else if (active.data.current?.type === 'list') {
            setActiveList(active.data.current.list);
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

        // Card dragged over another card
        if (isActiveCard && isOverCard) {
            const activeCard = cards.find((c) => c.id === activeId)!;
            const overCard = cards.find((c) => c.id === overId)!;

            if (activeCard.list_id !== overCard.list_id) {
                setCards((prev) =>
                    prev.map((c) => (c.id === activeId ? { ...c, list_id: overCard.list_id } : c))
                );
            }
        }

        // Card dragged over a list (empty list drop target)
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

        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // List reorder
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

        // Card reorder within same or different list
        if (active.data.current?.type === 'card') {
            const activeCardObj = cards.find((c) => c.id === activeId)!;
            const overCardObj = cards.find((c) => c.id === overId);
            const overListId = overCardObj ? overCardObj.list_id : overId;

            const listCards = cards
                .filter((c) => c.list_id === overListId)
                .sort((a, b) => a.position - b.position);

            const fromIdx = listCards.findIndex((c) => c.id === activeId);
            const toIdx = overCardObj
                ? listCards.findIndex((c) => c.id === overId)
                : listCards.length;

            let reorderedList = fromIdx >= 0
                ? arrayMove(listCards, fromIdx, toIdx)
                : [...listCards, { ...activeCardObj, list_id: overListId }];

            reorderedList = reorderedList.map((c, i) => ({
                ...c,
                list_id: overListId,
                position: i,
            }));

            setCards((prev) => {
                const others = prev.filter((c) => c.list_id !== overListId || c.id === activeId);
                const withoutActive = others.filter((c) => c.id !== activeId);
                return [...withoutActive, ...reorderedList];
            });

            fetch('/api/workspaces/cards/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    list_id: overListId,
                    ordered_ids: reorderedList.map((c) => c.id),
                }),
            });
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
                                canEdit={canEdit}
                                onAddCard={handleAddCard}
                                onDeleteCard={handleDeleteCard}
                                onEditCard={setEditingCard}
                                onDeleteList={handleDeleteList}
                                onRenameList={handleRenameList}
                            />
                        ))}
                    </SortableContext>

                    {/* Add List */}
                    {canEdit && (
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
                            onEdit={() => {}}
                            isDragOverlay
                        />
                    )}
                    {activeList && (
                        <SortableList
                            list={activeList}
                            cards={cardsForList(activeList.id)}
                            canEdit={false}
                            onAddCard={async () => {}}
                            onDeleteCard={() => {}}
                            onEditCard={() => {}}
                            onDeleteList={() => {}}
                            onRenameList={() => {}}
                            isDragOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>

            {editingCard && (
                <EditCardModal
                    card={editingCard}
                    onClose={() => setEditingCard(null)}
                    onSave={handleSaveCard}
                />
            )}
        </>
    );
}
