import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent, sendUserNotification } from "@/lib/activity/events";

const Schema = z.object({
    conversation_id: z.string().uuid(),
    member_user_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    const { conversation_id, member_user_id } = parsed.data;

    const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id, title, company_id, created_by")
        .eq("id", conversation_id)
        .maybeSingle();

    if (conversationError) {
        return NextResponse.json({ error: conversationError.message }, { status: 500 });
    }

    if (!conversation) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const [{ data: actorMembership }, { data: targetMembership }] = await Promise.all([
        supabase
            .from("conversation_members")
            .select("id, user_id, role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", user.id)
            .is("left_at", null)
            .maybeSingle(),
        supabase
            .from("conversation_members")
            .select("id, user_id, role")
            .eq("conversation_id", conversation_id)
            .eq("user_id", member_user_id)
            .is("left_at", null)
            .maybeSingle(),
    ]);

    if (!actorMembership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canRemoveMembers = actorMembership.role === "admin" || conversation.created_by === user.id;
    if (!canRemoveMembers) {
        return NextResponse.json({ error: "Only the conversation creator or an admin can remove members." }, { status: 403 });
    }

    if (!targetMembership) {
        return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (targetMembership.user_id === user.id) {
        return NextResponse.json({ error: "You cannot remove yourself from the conversation." }, { status: 400 });
    }

    if (targetMembership.user_id === conversation.created_by) {
        return NextResponse.json({ error: "The conversation creator cannot be removed." }, { status: 400 });
    }

    const { error: updateError } = await supabase
        .from("conversation_members")
        .update({ left_at: new Date().toISOString() })
        .eq("id", targetMembership.id)
        .eq("conversation_id", conversation_id)
        .is("left_at", null);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: "conversation.member.removed",
        title: "Removed a conversation member",
        entityType: "conversation",
        entityId: conversation_id,
        companyId: conversation.company_id ?? undefined,
        metadata: {
            removed_user_id: member_user_id,
        },
    });

    await sendUserNotification(supabase, {
        recipientUserId: member_user_id,
        actorUserId: user.id,
        notificationType: "conversation.member.removed",
        title: "You were removed from a conversation",
        body: `You were removed from ${conversation.title ?? "a conversation"}.`,
        entityType: "conversation",
        entityId: conversation_id,
        companyId: conversation.company_id ?? undefined,
    });

    return NextResponse.json({ success: true });
}
