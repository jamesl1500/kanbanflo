import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: memberships, error: membershipsError } = await supabase
        .from("conversation_members")
        .select("conversation_id, role")
        .eq("user_id", user.id)
        .is("left_at", null);

    if (membershipsError) {
        return NextResponse.json({ error: membershipsError.message }, { status: 500 });
    }

    const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
    if (conversationIds.length === 0) {
        return NextResponse.json({ conversations: [] });
    }

    const [{ data: conversations, error: conversationsError }, { data: members, error: membersError }, { data: latestMessages, error: latestMessagesError }] = await Promise.all([
        supabase
            .from("conversations")
            .select("id, kind, title, company_id, created_by, created_at, updated_at, last_message_at")
            .in("id", conversationIds)
            .eq("is_archived", false),
        supabase
            .from("conversation_members")
            .select("conversation_id, user_id, role")
            .in("conversation_id", conversationIds)
            .is("left_at", null),
        supabase
            .from("conversation_messages")
            .select("id, conversation_id, body, sender_user_id, created_at")
            .in("conversation_id", conversationIds)
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),
    ]);

    if (conversationsError) {
        return NextResponse.json({ error: conversationsError.message }, { status: 500 });
    }

    if (membersError) {
        return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    if (latestMessagesError) {
        return NextResponse.json({ error: latestMessagesError.message }, { status: 500 });
    }

    const userIds = new Set<string>();
    (members ?? []).forEach((member) => userIds.add(member.user_id));
    (latestMessages ?? []).forEach((message) => userIds.add(message.sender_user_id));

    const { data: profiles } = userIds.size > 0
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_name")
            .in("id", Array.from(userIds))
        : { data: [] };

    const companyIds = Array.from(
        new Set((conversations ?? []).map((conversation) => conversation.company_id).filter(Boolean))
    ) as string[];

    const { data: companies } = companyIds.length > 0
        ? await supabase
            .from("companies")
            .select("id, slug, name")
            .in("id", companyIds)
        : { data: [] };

    const profileById = new Map(
        (profiles ?? []).map((profile) => {
            const fullName = `${profile.first_name} ${profile.last_name}`.trim();
            const displayName = fullName || (profile.user_name ? `@${profile.user_name}` : "Unknown user");
            return [profile.id, displayName];
        })
    );

    const companyById = new Map((companies ?? []).map((company) => [company.id, company]));

    const membersByConversation = new Map<string, Array<{ user_id: string; role: string; display_name: string }>>();
    (members ?? []).forEach((member) => {
        if (!membersByConversation.has(member.conversation_id)) {
            membersByConversation.set(member.conversation_id, []);
        }

        membersByConversation.get(member.conversation_id)?.push({
            user_id: member.user_id,
            role: member.role,
            display_name: profileById.get(member.user_id) ?? "Unknown user",
        });
    });

    const latestMessageByConversation = new Map<string, { id: string; body: string; sender_user_id: string; created_at: string }>();
    (latestMessages ?? []).forEach((message) => {
        if (!latestMessageByConversation.has(message.conversation_id)) {
            latestMessageByConversation.set(message.conversation_id, message);
        }
    });

    const roleByConversation = new Map((memberships ?? []).map((item) => [item.conversation_id, item.role]));

    const mapped = (conversations ?? []).map((conversation) => {
        const membersForConversation = membersByConversation.get(conversation.id) ?? [];
        const company = conversation.company_id ? companyById.get(conversation.company_id) : null;
        const latestMessage = latestMessageByConversation.get(conversation.id) ?? null;
        const fallbackTitle = membersForConversation
            .filter((member) => member.user_id !== user.id)
            .map((member) => member.display_name)
            .join(", ");

        return {
            id: conversation.id,
            kind: conversation.kind,
            title: conversation.title ?? (fallbackTitle || "Untitled conversation"),
            company: company
                ? { id: company.id, slug: company.slug, name: company.name }
                : null,
            my_role: roleByConversation.get(conversation.id) ?? "member",
            members: membersForConversation,
            latest_message: latestMessage
                ? {
                    id: latestMessage.id,
                    body: latestMessage.body,
                    sender_user_id: latestMessage.sender_user_id,
                    sender_name: profileById.get(latestMessage.sender_user_id) ?? "Unknown user",
                    created_at: latestMessage.created_at,
                }
                : null,
            last_activity_at: conversation.last_message_at ?? conversation.updated_at ?? conversation.created_at,
        };
    }).sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime());

    return NextResponse.json({ conversations: mapped });
}
