import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

// Accepts an ordered array of list IDs and reassigns their positions
const Schema = z.object({
    workspace_id: z.string().uuid(),
    ordered_ids: z.array(z.string().uuid()).min(1),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { ordered_ids } = parsed.data;

    const updates = ordered_ids.map((id, index) =>
        supabase.from("kanban_lists").update({ position: index }).eq("id", id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
}
