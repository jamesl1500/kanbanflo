'use client';

import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CheckCircle,
    Clock,
    Users,
    Buildings,
    ArrowRight,
    DotsSixVertical,
    Circle,
    ArrowClockwise,
} from '@phosphor-icons/react';
import styles from '@/styles/pages/companies/company-dashboard.module.scss';
import { useCompany } from '@/components/companies/CompanyContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = 'todo' | 'in_progress' | 'completed';
type TaskPriority = 'high' | 'medium' | 'low';

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_TASKS = [
    { id: 1, title: 'Redesign landing page', assignee: 'Alex R.', status: 'in_progress' as TaskStatus, priority: 'high' as TaskPriority, due: 'Apr 10' },
    { id: 2, title: 'Write Q2 marketing copy', assignee: 'Jordan L.', status: 'todo' as TaskStatus, priority: 'medium' as TaskPriority, due: 'Apr 12' },
    { id: 3, title: 'Set up staging environment', assignee: 'Sam K.', status: 'completed' as TaskStatus, priority: 'high' as TaskPriority, due: 'Apr 5' },
    { id: 4, title: 'Conduct user interviews', assignee: 'Morgan C.', status: 'in_progress' as TaskStatus, priority: 'medium' as TaskPriority, due: 'Apr 15' },
    { id: 5, title: 'Update API documentation', assignee: 'Taylor P.', status: 'todo' as TaskStatus, priority: 'low' as TaskPriority, due: 'Apr 18' },
];

const DUMMY_ACTIVITY = [
    { id: 1, user: 'Alex R.', action: 'completed task "Set up staging environment"', time: '12 min ago' },
    { id: 2, user: 'Jordan L.', action: 'added a comment on "Redesign landing page"', time: '1 hr ago' },
    { id: 3, user: 'Sam K.', action: 'created workspace "Backend Sprint 3"', time: '3 hrs ago' },
    { id: 4, user: 'Morgan C.', action: 'invited Taylor P. to the company', time: 'Yesterday' },
    { id: 5, user: 'Taylor P.', action: 'updated task priority on "Write Q2 marketing copy"', time: '2 days ago' },
];

const DUMMY_WORKSPACES = [
    { id: 1, name: 'Product Design', tasks: 14, members: 4 },
    { id: 2, name: 'Backend Sprint 3', tasks: 22, members: 3 },
    { id: 3, name: 'Marketing Q2', tasks: 9, members: 5 },
];

const DUMMY_MEMBERS = [
    { id: 1, name: 'Alex Rivera', role: 'owner', initials: 'AR', color: '#6366f1' },
    { id: 2, name: 'Jordan Lee', role: 'admin', initials: 'JL', color: '#16a34a' },
    { id: 3, name: 'Sam Kim', role: 'member', initials: 'SK', color: '#d97706' },
    { id: 4, name: 'Morgan Chen', role: 'member', initials: 'MC', color: '#7c3aed' },
    { id: 5, name: 'Taylor Park', role: 'member', initials: 'TP', color: '#dc2626' },
];

// ─── Card definitions ─────────────────────────────────────────────────────────

type CardId = 'stats' | 'tasks' | 'activity' | 'workspaces' | 'members';

const DEFAULT_ORDER: CardId[] = ['stats', 'tasks', 'activity', 'workspaces', 'members'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TaskStatus }) {
    const map: Record<TaskStatus, string> = {
        todo: styles.pillTodo,
        in_progress: styles.pillInProgress,
        completed: styles.pillCompleted,
    };
    const labels: Record<TaskStatus, string> = {
        todo: 'To Do',
        in_progress: 'In Progress',
        completed: 'Done',
    };
    return <span className={`${styles.pill} ${map[status]}`}>{labels[status]}</span>;
}

function PriorityDot({ priority }: { priority: TaskPriority }) {
    const map: Record<TaskPriority, string> = {
        high: styles.dotHigh,
        medium: styles.dotMedium,
        low: styles.dotLow,
    };
    return <span className={`${styles.priorityDot} ${map[priority]}`} title={priority} />;
}

function UserAvatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
    return (
        <span
            className={styles.avatar}
            style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
        >
            {initials}
        </span>
    );
}

function StatsCard() {
    const stats = [
        { icon: <CheckCircle size={20} weight="fill" />, value: '47', label: 'Tasks completed', color: '#16a34a' },
        { icon: <Clock size={20} weight="fill" />, value: '12', label: 'Open tasks', color: '#d97706' },
        { icon: <Buildings size={20} weight="fill" />, value: '3', label: 'Workspaces', color: '#6366f1' },
        { icon: <Users size={20} weight="fill" />, value: '5', label: 'Members', color: '#2563eb' },
    ];
    return (
        <div className={styles.statsGrid}>
            {stats.map((s) => (
                <div key={s.label} className={styles.statItem}>
                    <span className={styles.statIcon} style={{ color: s.color, background: `${s.color}18` }}>
                        {s.icon}
                    </span>
                    <div>
                        <p className={styles.statValue}>{s.value}</p>
                        <p className={styles.statLabel}>{s.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function TasksCard() {
    return (
        <ul className={styles.taskList}>
            {DUMMY_TASKS.map((t) => (
                <li key={t.id} className={styles.taskItem}>
                    <PriorityDot priority={t.priority} />
                    <span className={styles.taskTitle}>{t.title}</span>
                    <span className={styles.taskAssignee}>{t.assignee}</span>
                    <span className={styles.taskDue}>{t.due}</span>
                    <StatusPill status={t.status} />
                </li>
            ))}
        </ul>
    );
}

function ActivityCard() {
    return (
        <ul className={styles.activityList}>
            {DUMMY_ACTIVITY.map((a) => (
                <li key={a.id} className={styles.activityItem}>
                    <span className={styles.activityIconWrap}>
                        <ArrowClockwise size={14} />
                    </span>
                    <div className={styles.activityBody}>
                        <p className={styles.activityText}>
                            <strong>{a.user}</strong> {a.action}
                        </p>
                        <span className={styles.activityTime}>{a.time}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function WorkspacesCard() {
    return (
        <div className={styles.workspaceGrid}>
            {DUMMY_WORKSPACES.map((w) => (
                <div key={w.id} className={styles.workspaceItem}>
                    <span className={styles.workspaceIcon}>
                        <Buildings size={16} weight="fill" />
                    </span>
                    <div className={styles.workspaceInfo}>
                        <p className={styles.workspaceName}>{w.name}</p>
                        <p className={styles.workspaceMeta}>{w.tasks} tasks · {w.members} members</p>
                    </div>
                    <ArrowRight size={14} className={styles.workspaceArrow} />
                </div>
            ))}
        </div>
    );
}

function MembersCard() {
    return (
        <ul className={styles.memberList}>
            {DUMMY_MEMBERS.map((m) => (
                <li key={m.id} className={styles.memberItem}>
                    <UserAvatar initials={m.initials} color={m.color} />
                    <div className={styles.memberInfo}>
                        <p className={styles.memberName}>{m.name}</p>
                        <p className={styles.memberRole}>{m.role}</p>
                    </div>
                    <Circle size={8} weight="fill" className={styles.onlineDot} />
                </li>
            ))}
        </ul>
    );
}

const CARD_META: Record<CardId, { title: string; fullWidth?: boolean }> = {
    stats: { title: 'Overview', fullWidth: true },
    tasks: { title: 'Recent Tasks' },
    activity: { title: 'Activity' },
    workspaces: { title: 'Workspaces' },
    members: { title: 'Members' },
};

function SortableCard({ id, children }: { id: CardId; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const meta = CARD_META[id];

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`${styles.card} ${meta.fullWidth ? styles.cardFull : ''} ${isDragging ? styles.cardDragging : ''}`}
        >
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{meta.title}</h3>
                <button
                    className={styles.dragHandle}
                    {...attributes}
                    {...listeners}
                    aria-label="Drag to reorder"
                    title="Drag to reorder"
                >
                    <DotsSixVertical size={16} />
                </button>
            </div>
            <div className={styles.cardBody}>{children}</div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyPage() {
    const { name: companyName, description: companyDescription, memberRole } = useCompany();
    const [order, setOrder] = useState<CardId[]>(DEFAULT_ORDER);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOrder((prev) => {
                const from = prev.indexOf(active.id as CardId);
                const to = prev.indexOf(over.id as CardId);
                return arrayMove(prev, from, to);
            });
        }
    }

    const cardContent: Record<CardId, React.ReactNode> = {
        stats: <StatsCard />,
        tasks: <TasksCard />,
        activity: <ActivityCard />,
        workspaces: <WorkspacesCard />,
        members: <MembersCard />,
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <div className={styles.companyIcon}>
                        <Buildings size={22} weight="fill" />
                    </div>
                    <div>
                        <h1 className={styles.companyName}>{companyName}</h1>
                        {companyDescription && (
                            <p className={styles.companyDescription}>{companyDescription}</p>
                        )}
                    </div>
                </div>
                <span className={styles.roleBadge}>{memberRole}</span>
            </div>

            <p className={styles.dragHint}>
                <DotsSixVertical size={13} /> Drag cards to rearrange your dashboard
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={order} strategy={rectSortingStrategy}>
                    <div className={styles.grid}>
                        {order.map((id) => (
                            <SortableCard key={id} id={id}>
                                {cardContent[id]}
                            </SortableCard>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

