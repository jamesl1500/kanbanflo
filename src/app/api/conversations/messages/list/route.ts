import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const Schema = z.object({
    conversation_id: z.string().uuid(),
    limit: z.number().int().min(1).max(200).optional(),
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

    const { conversation_id, limit = 100 } = parsed.data;

    const { data: membership } = await supabase
        .from("conversation_members")
        .select("id")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user.id)
        .is("left_at", null)
        .maybeSingle();

    if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: messages, error: messagesError } = await supabase
        .from("conversation_messages")
        .select("id, conversation_id, sender_user_id, body, created_at")
        .eq("conversation_id", conversation_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(limit);

    if (messagesError) {
        return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    const senderIds = Array.from(new Set((messages ?? []).map((message) => message.sender_user_id)));
    const { data: profiles } = senderIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_name")
            .in("id", senderIds)
        : { data: [] };

    const profileById = new Map(
        (profiles ?? []).map((profile) => {
            const fullName = `${profile.first_name} ${profile.last_name}`.trim();
            const displayName = fullName || (profile.user_name ? `@${profile.user_name}` : "Unknown user");
            return [profile.id, displayName];
        })
    );

    return NextResponse.json({
        messages: (messages ?? []).map((message) => ({
            ...message,
            sender_name: profileById.get(message.sender_user_id) ?? "Unknown user",
        })),
    });
}
