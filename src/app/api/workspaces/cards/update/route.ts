import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const Schema = z.object({
    id: z.string().uuid(),
    list_id: z.string().uuid().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
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

    const { id, ...updates } = parsed.data;

    const { data: card, error } = await supabase
        .from("kanban_cards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error || !card) return NextResponse.json({ error: error?.message ?? "Failed to update card" }, { status: 500 });

    return NextResponse.json({ success: true, card });
}
