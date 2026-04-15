import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent } from "@/lib/activity/events";

const Schema = z.object({ id: z.string().uuid() });

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { data: targetList } = await supabase
        .from("kanban_lists")
        .select("id, name, workspace_id")
        .eq("id", parsed.data.id)
        .maybeSingle();

    const { error } = await supabase.from("kanban_lists").delete().eq("id", parsed.data.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (targetList) {
        await recordActivityEvent(supabase, {
            actorUserId: user.id,
            activityType: "kanban.list.deleted",
            title: `Deleted list \"${targetList.name}\"`,
            entityType: "list",
            entityId: targetList.id,
            workspaceId: targetList.workspace_id,
        });
    }

    return NextResponse.json({ success: true });
}
