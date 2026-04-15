import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { card_id } = body;

    if (!card_id || typeof card_id !== "string") {
        return NextResponse.json({ error: "Invalid card_id" }, { status: 400 });
    }

    // RLS on kanban_subtasks already ensures only company members can read
    const { data: subtasks, error } = await supabase
        .from("kanban_subtasks")
        .select("id, title, is_completed, position, due_date")
        .eq("card_id", card_id)
        .order("position", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subtasks: subtasks ?? [] });
}
