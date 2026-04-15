import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { CreateSubtaskSchema } from "@/lib/schemas/tasks/SubtaskForm";
import { recordActivityEvent } from "@/lib/activity/events";

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = CreateSubtaskSchema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const { company_slug, card_id, title, description, due_date } = parsed.data;

    const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", company_slug)
        .maybeSingle();

    if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
        .from("company_members")
        .select("id")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: card } = await supabase
        .from("kanban_cards")
        .select("id, workspace_id")
        .eq("id", card_id)
        .maybeSingle();

    if (!card) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, company_id")
        .eq("id", card.workspace_id)
        .maybeSingle();

    if (!workspace || workspace.company_id !== company.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { count } = await supabase
        .from("kanban_subtasks")
        .select("id", { count: "exact", head: true })
        .eq("card_id", card_id);

    const { data: subtask, error: createError } = await supabase
        .from("kanban_subtasks")
        .insert({
            card_id,
            title,
            description: description ?? null,
            due_date: due_date ?? null,
            position: count ?? 0,
        })
        .select("id, title, description, is_completed, due_date, position, created_at")
        .single();

    if (createError || !subtask) {
        return NextResponse.json({ error: createError?.message ?? "Failed to create subtask" }, { status: 500 });
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: "subtask.created",
        title: `Created subtask \"${subtask.title}\"`,
        entityType: "subtask",
        entityId: subtask.id,
        companyId: company.id,
        workspaceId: workspace.id,
        cardId: card.id,
    });

    return NextResponse.json({ success: true, subtask }, { status: 201 });
}
