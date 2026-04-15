import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const Schema = z.object({
    notification_id: z.string().uuid().optional(),
    mark_all: z.boolean().optional(),
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

    const now = new Date().toISOString();

    if (parsed.data.mark_all) {
        const { error } = await supabase
            .from("notifications")
            .update({
                is_read: true,
                read_at: now,
            })
            .eq("recipient_user_id", user.id)
            .eq("is_read", false);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, mode: "all" });
    }

    if (!parsed.data.notification_id) {
        return NextResponse.json({ error: "notification_id is required when mark_all is false" }, { status: 400 });
    }

    const { error } = await supabase
        .from("notifications")
        .update({
            is_read: true,
            read_at: now,
        })
        .eq("id", parsed.data.notification_id)
        .eq("recipient_user_id", user.id)
        .eq("is_read", false);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, mode: "single" });
}