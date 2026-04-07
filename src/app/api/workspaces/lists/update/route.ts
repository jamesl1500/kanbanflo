import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const Schema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "List name is required").max(60).optional(),
    color: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { id, ...updates } = parsed.data;

    const { data: list, error } = await supabase
        .from("kanban_lists")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error || !list) return NextResponse.json({ error: error?.message ?? "Failed to update list" }, { status: 500 });

    return NextResponse.json({ success: true, list });
}
