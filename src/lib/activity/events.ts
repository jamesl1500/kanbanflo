import type { SupabaseClient } from "@supabase/supabase-js";

type ActivityEventInput = {
    actorUserId: string;
    activityType: string;
    title: string;
    description?: string | null;
    entityType?: string;
    entityId?: string;
    companyId?: string;
    workspaceId?: string;
    cardId?: string;
    metadata?: Record<string, unknown>;
};

type NotificationInput = {
    recipientUserId: string;
    actorUserId?: string;
    notificationType: string;
    title: string;
    body?: string | null;
    entityType?: string;
    entityId?: string;
    companyId?: string;
    workspaceId?: string;
    cardId?: string;
    metadata?: Record<string, unknown>;
};

export async function recordActivityEvent(
    supabase: SupabaseClient,
    input: ActivityEventInput
): Promise<void> {
    const { error } = await supabase.from("activity_events").insert({
        actor_user_id: input.actorUserId,
        activity_type: input.activityType,
        title: input.title,
        description: input.description ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        company_id: input.companyId ?? null,
        workspace_id: input.workspaceId ?? null,
        card_id: input.cardId ?? null,
        metadata: input.metadata ?? {},
    });

    if (error) {
        console.error("Failed to record activity event:", error.message);
    }
}

export async function sendUserNotification(
    supabase: SupabaseClient,
    input: NotificationInput
): Promise<void> {
    const { error } = await supabase.from("notifications").insert({
        recipient_user_id: input.recipientUserId,
        actor_user_id: input.actorUserId ?? null,
        notification_type: input.notificationType,
        title: input.title,
        body: input.body ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        company_id: input.companyId ?? null,
        workspace_id: input.workspaceId ?? null,
        card_id: input.cardId ?? null,
        metadata: input.metadata ?? {},
    });

    if (error) {
        console.error("Failed to send notification:", error.message);
    }
}
