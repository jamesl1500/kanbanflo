import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const Schema = z.object({
    list_id: z.string().uuid(),
    workspace_id: z.string().uuid(),
    title: z.string().min(1, "Card title is required").max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    priority: z.enum(["high", "medium", "low"]).optional(),
    due_date: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { list_id, workspace_id, title, description, priority, due_date } = parsed.data;

    // Get next position within list
    const { count } = await supabase
        .from("kanban_cards")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list_id);

    const { data: card, error } = await supabase
        .from("kanban_cards")
        .insert({
            list_id,
            workspace_id,
            title,
            description: description ?? null,
            priority: priority ?? "medium",
            due_date: due_date ?? null,
            position: count ?? 0,
        })
        .select()
        .single();

    if (error || !card) return NextResponse.json({ error: error?.message ?? "Failed to create card" }, { status: 500 });

    return NextResponse.json({ success: true, card }, { status: 201 });
}
