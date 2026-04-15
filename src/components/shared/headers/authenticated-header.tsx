import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import styles from "@/styles/shared/headers/authenticated-header.module.scss";
import Link from "next/link";
import UserDropdown from "@/components/shared/headers/UserDropdown";
import NotificationsDropdown from "@/components/shared/headers/NotificationsDropdown";
import ActivityDropdown from "@/components/shared/headers/ActivityDropdown";
import MessagesDropdown from "@/components/shared/headers/MessagesDropdown";

const MESSAGE_AVATAR_COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626"];

function makeInitials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function pickAvatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return MESSAGE_AVATAR_COLORS[hash % MESSAGE_AVATAR_COLORS.length];
}

export default async function AuthenticatedHeader() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    let firstName = "";
    let lastName = "";
    let avatarUrl: string | null = null;
    let notifications: Array<{
        id: string;
        title: string;
        body: string | null;
        is_read: boolean;
        created_at: string;
        notification_type: string;
    }> = [];
    let activity: Array<{
        id: string;
        title: string;
        description: string | null;
        created_at: string;
        activity_type: string;
    }> = [];
    let messagePreviews: Array<{
        id: string;
        conversation_id: string;
        unread: boolean;
        initials: string;
        color: string;
        sender: string;
        preview: string;
        time: string;
    }> = [];

    if (user) {
        const [{ data: profile }, { data: notificationRows }, { data: activityRows }, { data: memberships }] = await Promise.all([
            supabase
                .from("profiles")
                .select("first_name, last_name, avatar_id")
                .eq("id", user.id)
                .single(),
            supabase
                .from("notifications")
                .select("id, title, body, is_read, created_at, notification_type")
                .eq("recipient_user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(8),
            supabase
                .from("activity_events")
                .select("id, title, description, created_at, activity_type")
                .eq("actor_user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(8),
            supabase
                .from("conversation_members")
                .select("conversation_id")
                .eq("user_id", user.id)
                .is("left_at", null),
        ]);

        notifications = notificationRows ?? [];
        activity = activityRows ?? [];

        const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
        if (conversationIds.length > 0) {
            const [{ data: members }, { data: latestMessages }] = await Promise.all([
                supabase
                    .from("conversation_members")
                    .select("conversation_id, user_id")
                    .in("conversation_id", conversationIds)
                    .is("left_at", null),
                supabase
                    .from("conversation_messages")
                    .select("id, conversation_id, body, sender_user_id, created_at")
                    .in("conversation_id", conversationIds)
                    .is("deleted_at", null)
                    .order("created_at", { ascending: false }),
            ]);

            const latestMessageByConversation = new Map<string, { id: string; conversation_id: string; body: string; sender_user_id: string; created_at: string }>();
            (latestMessages ?? []).forEach((message) => {
                if (!latestMessageByConversation.has(message.conversation_id)) {
                    latestMessageByConversation.set(message.conversation_id, message);
                }
            });

            const userIds = new Set<string>();
            (members ?? []).forEach((member) => userIds.add(member.user_id));
            latestMessageByConversation.forEach((message) => userIds.add(message.sender_user_id));

            const { data: profiles } = userIds.size > 0
                ? await supabase
                    .from("profiles")
                    .select("id, first_name, last_name, user_name")
                    .in("id", Array.from(userIds))
                : { data: [] };

            const profileById = new Map(
                (profiles ?? []).map((person) => {
                    const fullName = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
                    const displayName = fullName || (person.user_name ? `@${person.user_name}` : "Unknown user");
                    return [person.id, displayName];
                })
            );

            const membersByConversation = new Map<string, string[]>();
            (members ?? []).forEach((member) => {
                if (!membersByConversation.has(member.conversation_id)) {
                    membersByConversation.set(member.conversation_id, []);
                }
                membersByConversation.get(member.conversation_id)?.push(member.user_id);
            });

            messagePreviews = Array.from(latestMessageByConversation.values())
                .map((latest) => {
                    const memberIds = membersByConversation.get(latest.conversation_id) ?? [];
                    const otherMemberName = memberIds
                        .filter((memberId) => memberId !== user.id)
                        .map((memberId) => profileById.get(memberId) ?? "Unknown user")
                        .join(", ");

                    const senderName = profileById.get(latest.sender_user_id) ?? "Unknown user";
                    const displayName = otherMemberName || senderName;

                    return {
                        id: latest.id,
                        conversation_id: latest.conversation_id,
                        unread: latest.sender_user_id !== user.id,
                        initials: makeInitials(displayName),
                        color: pickAvatarColor(latest.conversation_id),
                        sender: displayName,
                        preview: latest.body,
                        time: latest.created_at,
                    };
                })
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .slice(0, 8);
        }

        if (profile) {
            firstName = profile.first_name ?? "";
            lastName = profile.last_name ?? "";

            if (profile.avatar_id) {
                const { data: file } = await supabase
                    .from("files")
                    .select("file_bucket, file_folder, file_name")
                    .eq("id", profile.avatar_id)
                    .single();

                if (file?.file_bucket && file?.file_folder && file?.file_name) {
                    const path = `${file.file_folder}/${file.file_name}`;
                    const { data: urlData } = supabase.storage.from(file.file_bucket).getPublicUrl(path);
                    avatarUrl = urlData.publicUrl ?? null;
                }
            }
        }
    }

    return (
        <header className={styles.authenticated_header}>
            <div className={styles.authenticated_header_brand}>
                <Link href="/dashboard" className={styles.authenticated_header_brand_logo}>
                    <span className={styles.authenticated_header_brand_logo}>Kanbanflo</span>
                </Link>
            </div>
            <div className={styles.authenticated_header_center}>
                <NotificationsDropdown initialNotifications={notifications} />
                <ActivityDropdown initialActivity={activity} />
                <MessagesDropdown initialMessages={messagePreviews} />
            </div>
            <UserDropdown firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} />
        </header>
    );
}