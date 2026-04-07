import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const Schema = z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1, "List name is required").max(60, "Name must be 60 characters or less"),
    color: z.string().optional(),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { workspace_id, name, color } = parsed.data;

    // Get next position
    const { count } = await supabase
        .from("kanban_lists")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace_id);

    const { data: list, error } = await supabase
        .from("kanban_lists")
        .insert({ workspace_id, name, color: color ?? null, position: count ?? 0 })
        .select()
        .single();

    if (error || !list) return NextResponse.json({ error: error?.message ?? "Failed to create list" }, { status: 500 });

    return NextResponse.json({ success: true, list }, { status: 201 });
}
