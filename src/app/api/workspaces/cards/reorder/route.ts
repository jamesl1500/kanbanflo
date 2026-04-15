import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent } from "@/lib/activity/events";

// ordered_ids is just the cards in the target list in new order
const Schema = z.object({
    list_id: z.string().uuid(),
    ordered_ids: z.array(z.string().uuid()).min(0),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { list_id, ordered_ids } = parsed.data;

    // Two-phase reorder avoids transient position collisions and surfaces DB/RLS errors.
    for (let index = 0; index < ordered_ids.length; index += 1) {
        const id = ordered_ids[index];
        const { error } = await supabase
            .from("kanban_cards")
            .update({ list_id, position: -(index + 1) })
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    for (let index = 0; index < ordered_ids.length; index += 1) {
        const id = ordered_ids[index];
        const { error } = await supabase
            .from("kanban_cards")
            .update({ list_id, position: index })
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: "kanban.card.reordered",
        title: "Reordered cards",
        entityType: "list",
        entityId: list_id,
        metadata: {
            ordered_ids,
        },
    });

    return NextResponse.json({ success: true });
}
