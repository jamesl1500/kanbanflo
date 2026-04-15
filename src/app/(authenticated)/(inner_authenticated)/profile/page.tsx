import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import styles from '@/styles/pages/profile/profile-main.module.scss';
import { createClient } from '@/utils/supabase/server';
import ProfileTabs from '@/components/profile/ProfileTabs';

function formatRelativeTime(input: string): string {
    const deltaSeconds = Math.floor((Date.now() - new Date(input).getTime()) / 1000);
    if (!Number.isFinite(deltaSeconds)) return 'Just now';

    const abs = Math.abs(deltaSeconds);
    if (abs < 60) return `${Math.max(1, abs)}s ago`;
    if (abs < 3600) return `${Math.floor(abs / 60)}m ago`;
    if (abs < 86400) return `${Math.floor(abs / 3600)}h ago`;
    return `${Math.floor(abs / 86400)}d ago`;
}

function mapTaskStatus(value: string): 'completed' | 'in_progress' | 'todo' {
    if (value === 'done') return 'completed';
    if (value === 'in_progress' || value === 'review' || value === 'blocked') return 'in_progress';
    return 'todo';
}

function formatDueLabel(value: string | null): string {
    if (!value) return 'No due date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeActivityStreak(activityDates: string[]): number {
    if (activityDates.length === 0) return 0;

    const uniqueDays = Array.from(
        new Set(
            activityDates.map((value) => {
                const date = new Date(value);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            })
        )
    ).sort((a, b) => b - a);

    if (uniqueDays.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i += 1) {
        const prev = uniqueDays[i - 1];
        const curr = uniqueDays[i];
        if (prev - curr === 24 * 60 * 60 * 1000) {
            streak += 1;
            continue;
        }
        break;
    }

    return streak;
}

export default async function ProfileMainPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

    const displayName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
        : (user.email ?? 'User');

    const [{ data: activityRows }, { data: companyMembershipRows }, { data: ownedWorkspaceRows }] = await Promise.all([
        supabase
            .from('activity_events')
            .select('id, title, description, created_at, activity_type, workspace_id')
            .eq('actor_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(12),
        supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id),
        supabase
            .from('workspaces')
            .select('id, name, description, status, company_id')
            .eq('owner_id', user.id),
    ]);

    const companyIds = Array.from(new Set((companyMembershipRows ?? []).map((row) => row.company_id)));

    const { data: companyWorkspaceRows } = companyIds.length > 0
        ? await supabase
            .from('workspaces')
            .select('id, name, description, status, company_id')
            .in('company_id', companyIds)
            .order('created_at', { ascending: false })
        : { data: [] };

    const workspaceRows = Array.from(
        new Map(
            [...(companyWorkspaceRows ?? []), ...(ownedWorkspaceRows ?? [])].map((workspace) => [workspace.id, workspace])
        ).values()
    );

    const workspaceIds = workspaceRows.map((workspace) => workspace.id);

    const { data: cardRows } = workspaceIds.length > 0
        ? await supabase
            .from('kanban_cards')
            .select('id, workspace_id, title, status, priority, due_date, assignee_id, created_at')
            .in('workspace_id', workspaceIds)
            .order('created_at', { ascending: false })
        : { data: [] };

    const membersByWorkspace = workspaceIds.length > 0
        ? await supabase
            .from('workspace_members')
            .select('workspace_id, user_id')
            .in('workspace_id', workspaceIds)
        : { data: [] };

    const workspaceNameById = new Map((workspaceRows ?? []).map((workspace) => [workspace.id, workspace.name]));

    const memberCountByWorkspace = new Map<string, number>();
    (membersByWorkspace.data ?? []).forEach((row) => {
        memberCountByWorkspace.set(row.workspace_id, (memberCountByWorkspace.get(row.workspace_id) ?? 0) + 1);
    });

    const taskCountByWorkspace = new Map<string, number>();
    (cardRows ?? []).forEach((card) => {
        taskCountByWorkspace.set(card.workspace_id, (taskCountByWorkspace.get(card.workspace_id) ?? 0) + 1);
    });

    const feed = (activityRows ?? []).map((item) => {
        const type: 'task_complete' | 'joined' | 'post' = item.activity_type.includes('task') && item.activity_type.includes('complete')
            ? 'task_complete'
            : item.activity_type.includes('join')
                ? 'joined'
                : 'post';

        return {
            id: item.id,
            type,
            text: item.description || item.title,
            workspace: item.workspace_id ? workspaceNameById.get(item.workspace_id) ?? undefined : undefined,
            time: formatRelativeTime(item.created_at),
        };
    });

    const workspaces = (workspaceRows ?? []).map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description ?? 'No description yet.',
        members: memberCountByWorkspace.get(workspace.id) ?? 0,
        tasks: taskCountByWorkspace.get(workspace.id) ?? 0,
    }));

    const tasks = (cardRows ?? [])
        .filter((card) => card.assignee_id === user.id)
        .slice(0, 12)
        .map((card) => ({
            id: card.id,
            title: card.title,
            workspace: workspaceNameById.get(card.workspace_id) ?? 'Workspace',
            status: mapTaskStatus(card.status),
            due: formatDueLabel(card.due_date),
            priority: card.priority,
        }));

    const tasksDoneCount = (cardRows ?? []).filter((card) => card.assignee_id === user.id && card.status === 'done').length;
    const workspaceCount = (workspaceRows ?? []).length;
    const collaboratorCount = new Set(
        (membersByWorkspace.data ?? [])
            .map((row) => row.user_id)
            .filter((memberUserId) => memberUserId !== user.id)
    ).size;
    const activityStreak = computeActivityStreak((activityRows ?? []).map((item) => item.created_at));

    let coverUrl: string | null = null;

    // Get avatar and cover URLs if they exist
    if (profile) {
        if (profile.avatar_id) {
            const { data: avatarFile } = await supabase
                .from('files')
                .select('file_bucket, file_folder, file_name')
                .eq('id', profile.avatar_id)
                .single();

            if (avatarFile?.file_bucket && avatarFile.file_name) {
                const path = [avatarFile.file_folder, avatarFile.file_name].filter(Boolean).join('/');
                const { data } = supabase.storage.from(avatarFile.file_bucket).getPublicUrl(path);
                profile.avatar_url = data.publicUrl;
            }
        }

        if (profile.cover_photo_id) {
            const { data: coverFile } = await supabase
                .from('files')
                .select('file_bucket, file_folder, file_name')
                .eq('id', profile.cover_photo_id)
                .single();

            if (coverFile?.file_bucket && coverFile.file_name) {
                const path = [coverFile.file_folder, coverFile.file_name].filter(Boolean).join('/');
                const { data } = supabase.storage.from(coverFile.file_bucket).getPublicUrl(path);
                coverUrl = data.publicUrl;
            }
        }
    }

    return (
        <div className={styles.profileMainPage}>
            <div className={styles.profileMainPageInner}>

                {/* ── Jumbotron ── */}
                <div className={styles.profileJumbotron}>
                    <div
                        className={styles.profileJumbotronCover}
                        style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    />
                    <div className={styles.profileJumbotronUser}>
                        <div className={styles.profileAvatarRow}>
                            <Image
                                src={profile?.avatar_url ?? "/default-avatar.png"}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className={styles.profileAvatar}
                                priority
                            />
                            <div className={styles.profileIdentity}>
                                <h2>{displayName}</h2>
                                {profile?.user_name && <p>@{profile.user_name}</p>}
                            </div>
                        </div>
                        {profile?.bio && (
                            <p className={styles.profileBio}>{profile.bio}</p>
                        )}
                        <div className={styles.profileActions}>
                            <button className={styles.profileActionSecondary}>
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className={styles.profileStats}>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>{tasksDoneCount}</div>
                        <div className={styles.profileStatLabel}>Tasks Done</div>
                    </div>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>{workspaceCount}</div>
                        <div className={styles.profileStatLabel}>Workspaces</div>
                    </div>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>{collaboratorCount}</div>
                        <div className={styles.profileStatLabel}>Workspace Groups</div>
                    </div>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>{activityStreak}</div>
                        <div className={styles.profileStatLabel}>Day Streak</div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className={styles.profileContent}>
                    <ProfileTabs feed={feed} workspaces={workspaces} tasks={tasks} />
                </div>

            </div>
        </div>
    );
}
