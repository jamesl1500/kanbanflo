'use client';

import { useEffect, useMemo, useState } from 'react';
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
import Link from 'next/link';
import {
    CheckCircle,
    Clock,
    Users,
    Buildings,
    ArrowRight,
    DotsSixVertical,
    Circle,
    ArrowClockwise,
    ChatsCircle,
} from '@phosphor-icons/react';
import styles from '@/styles/pages/companies/company-dashboard.module.scss';
import { useCompany } from '@/components/companies/CompanyContext';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'done';
type TaskPriority = 'high' | 'medium' | 'low';

type TaskRow = {
    id: string;
    title: string;
    assignee: string;
    status: TaskStatus;
    priority: TaskPriority;
    due: string;
};

type ActivityRow = {
    id: string;
    user: string;
    action: string;
    time: string;
};

type WorkspaceRow = {
    id: string;
    name: string;
    tasks: number;
    members: number;
};

type MemberRow = {
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    initials: string;
    color: string;
};

type OverviewStats = {
    completedTasks: number;
    openTasks: number;
    workspaceCount: number;
    memberCount: number;
};

// ─── Card definitions ─────────────────────────────────────────────────────────

type CardId = 'stats' | 'tasks' | 'activity' | 'workspaces' | 'members';

const DEFAULT_ORDER: CardId[] = ['stats', 'tasks', 'activity', 'workspaces', 'members'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TaskStatus }) {
    const map: Record<TaskStatus, string> = {
        todo: styles.pillTodo,
        in_progress: styles.pillInProgress,
        blocked: styles.pillTodo,
        review: styles.pillInProgress,
        done: styles.pillCompleted,
    };
    const labels: Record<TaskStatus, string> = {
        todo: 'To Do',
        in_progress: 'In Progress',
        blocked: 'Blocked',
        review: 'Review',
        done: 'Done',
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

function StatsCard({ stats }: { stats: OverviewStats }) {
    const statItems = [
        { icon: <CheckCircle size={20} weight="fill" />, value: String(stats.completedTasks), label: 'Tasks completed', color: '#16a34a' },
        { icon: <Clock size={20} weight="fill" />, value: String(stats.openTasks), label: 'Open tasks', color: '#d97706' },
        { icon: <Buildings size={20} weight="fill" />, value: String(stats.workspaceCount), label: 'Workspaces', color: '#6366f1' },
        { icon: <Users size={20} weight="fill" />, value: String(stats.memberCount), label: 'Members', color: '#2563eb' },
    ];
    return (
        <div className={styles.statsGrid}>
            {statItems.map((s) => (
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

function TasksCard({ tasks }: { tasks: TaskRow[] }) {
    if (tasks.length === 0) {
        return <p className={styles.companyDescription}>No tasks yet in this company.</p>;
    }

    return (
        <ul className={styles.taskList}>
            {tasks.map((t) => (
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

function ActivityCard({ activity }: { activity: ActivityRow[] }) {
    if (activity.length === 0) {
        return <p className={styles.companyDescription}>No activity yet.</p>;
    }

    return (
        <ul className={styles.activityList}>
            {activity.map((a) => (
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

function WorkspacesCard({ workspaces, companySlug }: { workspaces: WorkspaceRow[]; companySlug: string }) {
    if (workspaces.length === 0) {
        return <p className={styles.companyDescription}>No workspaces yet.</p>;
    }

    return (
        <div className={styles.workspaceGrid}>
            {workspaces.map((w) => (
                <Link
                    key={w.id}
                    href={`/companies/s/${companySlug}/workspaces/${w.id}`}
                    className={styles.workspaceItem}
                >
                    <span className={styles.workspaceIcon}>
                        <Buildings size={16} weight="fill" />
                    </span>
                    <div className={styles.workspaceInfo}>
                        <p className={styles.workspaceName}>{w.name}</p>
                        <p className={styles.workspaceMeta}>{w.tasks} tasks · {w.members} members</p>
                    </div>
                    <ArrowRight size={14} className={styles.workspaceArrow} />
                </Link>
            ))}
        </div>
    );
}

function MembersCard({ members }: { members: MemberRow[] }) {
    if (members.length === 0) {
        return <p className={styles.companyDescription}>No members found.</p>;
    }

    return (
        <ul className={styles.memberList}>
            {members.map((m) => (
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

function formatRelativeTime(input: string): string {
    const timestamp = new Date(input).getTime();
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDueDate(input: string | null): string {
    if (!input) return 'No due date';

    return new Date(input).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function getDisplayName(profile: { first_name: string; last_name: string; user_name: string | null } | undefined): string {
    if (!profile) return 'Unknown';

    const fullName = `${profile.first_name} ${profile.last_name}`.trim();
    if (fullName) return fullName;
    if (profile.user_name) return `@${profile.user_name}`;
    return 'Unknown';
}

function getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function colorFromId(id: string): string {
    const palette = ['#6366f1', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0ea5e9'];
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % 997;
    return palette[hash % palette.length];
}

export default function CompanyPage() {
    const { id: companyId, slug: companySlug, name: companyName, description: companyDescription, memberRole } = useCompany();
    const router = useRouter();
    const [order, setOrder] = useState<CardId[]>(DEFAULT_ORDER);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    const [activity, setActivity] = useState<ActivityRow[]>([]);
    const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [overview, setOverview] = useState<OverviewStats>({
        completedTasks: 0,
        openTasks: 0,
        workspaceCount: 0,
        memberCount: 0,
    });
    const [creatingCompanyChat, setCreatingCompanyChat] = useState(false);

    const supabase = useMemo(() => createClient(), []);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    useEffect(() => {
        let isActive = true;

        async function loadDashboardData() {
            const { data: workspaceRows } = await supabase
                .from('workspaces')
                .select('id, name')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            const workspaceIds = (workspaceRows ?? []).map((workspace) => workspace.id);

            const [cardsResult, membersResult, activityResult, workspaceMembersResult] = await Promise.all([
                workspaceIds.length > 0
                    ? supabase
                        .from('kanban_cards')
                        .select('id, title, assignee_id, status, priority, due_date, workspace_id, created_at, updated_at')
                        .in('workspace_id', workspaceIds)
                        .order('updated_at', { ascending: false })
                    : Promise.resolve({ data: [] as Array<{ id: string; title: string; assignee_id: string | null; status: TaskStatus; priority: TaskPriority; due_date: string | null; workspace_id: string; created_at: string; updated_at: string }> }),
                supabase
                    .from('company_members')
                    .select('id, user_id, role')
                    .eq('company_id', companyId)
                    .order('joined_at', { ascending: true }),
                supabase
                    .from('activity_events')
                    .select('id, actor_user_id, title, description, created_at')
                    .eq('company_id', companyId)
                    .order('created_at', { ascending: false })
                    .limit(8),
                workspaceIds.length > 0
                    ? supabase
                        .from('workspace_members')
                        .select('workspace_id, user_id')
                        .in('workspace_id', workspaceIds)
                    : Promise.resolve({ data: [] as Array<{ workspace_id: string; user_id: string }> }),
            ]);

            if (!isActive) return;

            const cards = cardsResult.data ?? [];
            const companyMembers = membersResult.data ?? [];
            const activityRows = activityResult.data ?? [];
            const workspaceMemberRows = workspaceMembersResult.data ?? [];

            const relevantUserIds = new Set<string>();
            companyMembers.forEach((member) => relevantUserIds.add(member.user_id));
            cards.forEach((card) => {
                if (card.assignee_id) relevantUserIds.add(card.assignee_id);
            });
            activityRows.forEach((row) => relevantUserIds.add(row.actor_user_id));

            const relevantIds = Array.from(relevantUserIds);
            const { data: profiles } = relevantIds.length > 0
                ? await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, user_name')
                    .in('id', relevantIds)
                : { data: [] };

            const profileByUserId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

            const taskRows: TaskRow[] = cards.slice(0, 8).map((card) => ({
                id: card.id,
                title: card.title,
                assignee: card.assignee_id ? getDisplayName(profileByUserId.get(card.assignee_id)) : 'Unassigned',
                status: card.status,
                priority: card.priority,
                due: formatDueDate(card.due_date),
            }));

            const activityFeed: ActivityRow[] = activityRows.map((row) => ({
                id: row.id,
                user: getDisplayName(profileByUserId.get(row.actor_user_id)),
                action: row.description || row.title,
                time: formatRelativeTime(row.created_at),
            }));

            const workspaceMembers = new Map<string, Set<string>>();
            workspaceMemberRows.forEach((wm) => {
                if (!workspaceMembers.has(wm.workspace_id)) {
                    workspaceMembers.set(wm.workspace_id, new Set());
                }
                workspaceMembers.get(wm.workspace_id)?.add(wm.user_id);
            });

            const workspaceCards = new Map<string, number>();
            cards.forEach((card) => {
                workspaceCards.set(card.workspace_id, (workspaceCards.get(card.workspace_id) ?? 0) + 1);
            });

            const workspaceRowsView: WorkspaceRow[] = (workspaceRows ?? []).map((workspace) => ({
                id: workspace.id,
                name: workspace.name,
                tasks: workspaceCards.get(workspace.id) ?? 0,
                members: workspaceMembers.get(workspace.id)?.size ?? companyMembers.length,
            }));

            const memberRows: MemberRow[] = companyMembers.map((member) => {
                const displayName = getDisplayName(profileByUserId.get(member.user_id));
                return {
                    id: member.id,
                    name: displayName,
                    role: member.role,
                    initials: getInitials(displayName),
                    color: colorFromId(member.user_id),
                };
            });

            setTasks(taskRows);
            setActivity(activityFeed);
            setWorkspaces(workspaceRowsView);
            setMembers(memberRows);
            setOverview({
                completedTasks: cards.filter((card) => card.status === 'done').length,
                openTasks: cards.filter((card) => card.status !== 'done').length,
                workspaceCount: workspaceRowsView.length,
                memberCount: memberRows.length,
            });
            setLoading(false);
        }

        loadDashboardData();
        const interval = setInterval(loadDashboardData, 15000);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [companyId, supabase]);

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
        stats: <StatsCard stats={overview} />,
        tasks: <TasksCard tasks={tasks} />,
        activity: <ActivityCard activity={activity} />,
        workspaces: <WorkspacesCard workspaces={workspaces} companySlug={companySlug} />,
        members: <MembersCard members={members} />,
    };

    const canManageCompanyChat = memberRole === 'owner' || memberRole === 'admin';

    async function handleCreateCompanyChat() {
        if (!canManageCompanyChat || creatingCompanyChat) return;
        setCreatingCompanyChat(true);

        const response = await fetch('/api/conversations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'company_group',
                company_slug: companySlug,
            }),
        });

        const data = await response.json();
        setCreatingCompanyChat(false);

        if (!response.ok || !data?.conversation?.id) {
            return;
        }

        router.push(`/messages?conversation=${data.conversation.id}`);
    }

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
                <div className={styles.pageHeaderActions}>
                    {canManageCompanyChat && (
                        <button
                            className={styles.groupChatBtn}
                            onClick={handleCreateCompanyChat}
                            disabled={creatingCompanyChat}
                        >
                            <ChatsCircle size={15} weight="fill" />
                            {creatingCompanyChat ? 'Creating chat...' : 'Create company chat'}
                        </button>
                    )}
                    <span className={styles.roleBadge}>{memberRole}</span>
                </div>
            </div>

            <p className={styles.dragHint}>
                <DotsSixVertical size={13} /> Drag cards to rearrange your dashboard
            </p>

            {loading && <p className={styles.companyDescription}>Loading live company data...</p>}

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

