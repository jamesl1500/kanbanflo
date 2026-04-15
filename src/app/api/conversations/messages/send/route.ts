import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent, sendUserNotification } from "@/lib/activity/events";

const Schema = z.object({
    conversation_id: z.string().uuid(),
    body: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    const { conversation_id, body } = parsed.data;

    const [{ data: membership }, { data: conversation }] = await Promise.all([
        supabase
            .from("conversation_members")
            .select("id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", user.id)
            .is("left_at", null)
            .maybeSingle(),
        supabase
            .from("conversations")
            .select("id, company_id")
            .eq("id", conversation_id)
            .maybeSingle(),
    ]);

    if (!membership || !conversation) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) {
        return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const { data: message, error: messageError } = await supabase
        .from("conversation_messages")
        .insert({
            conversation_id,
            sender_user_id: user.id,
            body: trimmedBody,
        })
        .select("id, conversation_id, sender_user_id, body, created_at")
        .single();

    if (messageError || !message) {
        return NextResponse.json({ error: messageError?.message ?? "Failed to send message" }, { status: 500 });
    }

    const { data: recipients } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", conversation_id)
        .is("left_at", null)
        .neq("user_id", user.id);

    if (recipients && recipients.length > 0) {
        await Promise.all(
            recipients.map((recipient) =>
                sendUserNotification(supabase, {
                    recipientUserId: recipient.user_id,
                    actorUserId: user.id,
                    notificationType: "conversation.message",
                    title: "New message",
                    body: trimmedBody.length > 120 ? `${trimmedBody.slice(0, 117)}...` : trimmedBody,
                    entityType: "conversation",
                    entityId: conversation_id,
                    companyId: conversation.company_id ?? undefined,
                })
            )
        );
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: "conversation.message.sent",
        title: "Sent a message",
        description: trimmedBody.length > 140 ? `${trimmedBody.slice(0, 137)}...` : trimmedBody,
        entityType: "conversation",
        entityId: conversation_id,
        companyId: conversation.company_id ?? undefined,
        metadata: {
            conversation_id,
        },
    });

    return NextResponse.json({ message });
}
