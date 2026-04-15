import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent } from "@/lib/activity/events";

const Schema = z.object({
    type: z.enum(["direct", "group", "company_group"]),
    company_slug: z.string().min(2).max(80),
    title: z.string().max(120).optional(),
    member_user_ids: z.array(z.string().uuid()).default([]),
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

    const { type, company_slug, title, member_user_ids } = parsed.data;

    const { data: company } = await supabase
        .from("companies")
        .select("id, slug, name")
        .eq("slug", company_slug)
        .maybeSingle();

    if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: actorMembership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!actorMembership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (type === "company_group") {
        if (!["owner", "admin"].includes(actorMembership.role)) {
            return NextResponse.json({ error: "Only owners and admins can create the company chat" }, { status: 403 });
        }

        const { data: existing } = await supabase
            .from("conversations")
            .select("id")
            .eq("company_id", company.id)
            .eq("kind", "company_group")
            .eq("is_archived", false)
            .maybeSingle();

        if (existing) {
            const { data: companyMembers } = await supabase
                .from("company_members")
                .select("user_id")
                .eq("company_id", company.id);

            if (companyMembers && companyMembers.length > 0) {
                const { error: bootstrapError } = await supabase
                    .from("conversation_members")
                    .insert([
                        {
                            conversation_id: existing.id,
                            user_id: user.id,
                            role: "owner",
                        },
                    ]);

                if (bootstrapError && bootstrapError.code !== "23505") {
                    return NextResponse.json({ error: bootstrapError.message }, { status: 500 });
                }

                const otherRows = companyMembers
                    .filter((member) => member.user_id !== user.id)
                    .map((member) => ({
                        conversation_id: existing.id,
                        user_id: member.user_id,
                        role: "member",
                    }));

                if (otherRows.length > 0) {
                    const { data: existingConversationMembers } = await supabase
                        .from("conversation_members")
                        .select("user_id")
                        .eq("conversation_id", existing.id);

                    const existingUserIds = new Set(
                        (existingConversationMembers ?? []).map((member) => member.user_id)
                    );

                    const missingRows = otherRows.filter(
                        (row) => !existingUserIds.has(row.user_id)
                    );

                    if (missingRows.length > 0) {
                        const { error: otherRowsError } = await supabase
                            .from("conversation_members")
                            .insert(missingRows);

                        if (otherRowsError) {
                            return NextResponse.json({ error: otherRowsError.message }, { status: 500 });
                        }
                    }
                }
            }

            return NextResponse.json({ conversation: { id: existing.id }, existed: true });
        }

        const conversationId = crypto.randomUUID();

        const { error: conversationError } = await supabase
            .from("conversations")
            .insert({
                id: conversationId,
                kind: "company_group",
                company_id: company.id,
                title: title?.trim() || `${company.name} - Company Chat`,
                created_by: user.id,
            });

        if (conversationError) {
            return NextResponse.json({ error: conversationError?.message ?? "Failed to create company conversation" }, { status: 500 });
        }

        const { data: companyMembers } = await supabase
            .from("company_members")
            .select("user_id")
            .eq("company_id", company.id);

        if (companyMembers && companyMembers.length > 0) {
            const { error: bootstrapError } = await supabase
                .from("conversation_members")
                .insert([
                    {
                        conversation_id: conversationId,
                        user_id: user.id,
                        role: "owner",
                    },
                ]);

            if (bootstrapError && bootstrapError.code !== "23505") {
                return NextResponse.json({ error: bootstrapError.message }, { status: 500 });
            }

            const otherRows = companyMembers
                .filter((member) => member.user_id !== user.id)
                .map((member) => ({
                    conversation_id: conversationId,
                    user_id: member.user_id,
                    role: "member",
                }));

            if (otherRows.length > 0) {
                const { data: existingConversationMembers } = await supabase
                    .from("conversation_members")
                    .select("user_id")
                    .eq("conversation_id", conversationId);

                const existingUserIds = new Set(
                    (existingConversationMembers ?? []).map((member) => member.user_id)
                );

                const missingRows = otherRows.filter(
                    (row) => !existingUserIds.has(row.user_id)
                );

                if (missingRows.length > 0) {
                    const { error: membersInsertError } = await supabase
                        .from("conversation_members")
                        .insert(missingRows);

                    if (membersInsertError) {
                        return NextResponse.json({ error: membersInsertError.message }, { status: 500 });
                    }
                }
            }
        }

        await recordActivityEvent(supabase, {
            actorUserId: user.id,
            activityType: "conversation.company_group.created",
            title: "Created company group chat",
            entityType: "conversation",
            entityId: conversationId,
            companyId: company.id,
        });

        return NextResponse.json({ conversation: { id: conversationId }, existed: false });
    }

    const uniqueMemberIds = Array.from(new Set([...member_user_ids, user.id]));
    const otherMemberIds = uniqueMemberIds.filter((id) => id !== user.id);

    if (type === "direct" && otherMemberIds.length !== 1) {
        return NextResponse.json({ error: "Direct conversations require exactly one other member" }, { status: 400 });
    }

    if (type === "group" && otherMemberIds.length < 1) {
        return NextResponse.json({ error: "Group conversations require at least one other member" }, { status: 400 });
    }

    const { data: eligibleMembers } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", company.id)
        .in("user_id", uniqueMemberIds);

    const eligibleSet = new Set((eligibleMembers ?? []).map((member) => member.user_id));
    if (uniqueMemberIds.some((id) => !eligibleSet.has(id))) {
        return NextResponse.json({ error: "Every participant must belong to the selected company" }, { status: 400 });
    }

    if (type === "direct") {
        const { data: myDirects } = await supabase
            .from("conversations")
            .select("id")
            .eq("kind", "direct")
            .eq("company_id", company.id)
            .eq("is_archived", false);

        const targetUserId = otherMemberIds[0];

        if (myDirects && myDirects.length > 0) {
            const directIds = myDirects.map((conversation) => conversation.id);
            const { data: directMembers } = await supabase
                .from("conversation_members")
                .select("conversation_id, user_id")
                .in("conversation_id", directIds)
                .is("left_at", null);

            const memberMap = new Map<string, Set<string>>();
            (directMembers ?? []).forEach((member) => {
                if (!memberMap.has(member.conversation_id)) {
                    memberMap.set(member.conversation_id, new Set());
                }
                memberMap.get(member.conversation_id)?.add(member.user_id);
            });

            for (const [conversationId, members] of memberMap.entries()) {
                if (members.size === 2 && members.has(user.id) && members.has(targetUserId)) {
                    return NextResponse.json({ conversation: { id: conversationId }, existed: true });
                }
            }
        }
    }

    const conversationTitle = type === "group" ? (title?.trim() || "Group chat") : null;

    const conversationId = crypto.randomUUID();

    const { error: conversationError } = await supabase
        .from("conversations")
        .insert({
            id: conversationId,
            kind: type,
            company_id: company.id,
            title: conversationTitle,
            created_by: user.id,
        });

    if (conversationError) {
        return NextResponse.json({ error: conversationError?.message ?? "Failed to create conversation" }, { status: 500 });
    }

    const { error: bootstrapError } = await supabase
        .from("conversation_members")
        .insert([
            {
                conversation_id: conversationId,
                user_id: user.id,
                role: "owner",
            },
        ]);

    if (bootstrapError) {
        return NextResponse.json({ error: bootstrapError.message }, { status: 500 });
    }

    const otherMemberRows = uniqueMemberIds
        .filter((id) => id !== user.id)
        .map((id) => ({
            conversation_id: conversationId,
            user_id: id,
            role: "member",
        }));

    if (otherMemberRows.length > 0) {
        const { error: membersInsertError } = await supabase
            .from("conversation_members")
            .insert(otherMemberRows);

        if (membersInsertError) {
            return NextResponse.json({ error: membersInsertError.message }, { status: 500 });
        }
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: `conversation.${type}.created`,
        title: `Created ${type === "direct" ? "direct" : "group"} conversation`,
        entityType: "conversation",
        entityId: conversationId,
        companyId: company.id,
        metadata: {
            participant_count: uniqueMemberIds.length,
        },
    });

    return NextResponse.json({ conversation: { id: conversationId }, existed: false });
}
